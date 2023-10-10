import { minimize } from '../lib/g9';
import { generateId, removeOne } from '../lib/helpers';
import SVG from './Svg';
import { GameObject } from './GameObject';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Handle, { aCanonicalHandle } from './ink/Handle';

type VariableInfo = CanonicalVariableInfo | AbsorbedVariableInfo;

interface CanonicalVariableInfo {
  isCanonical: true;
  absorbedVariables: Set<Variable>;
}

interface AbsorbedVariableInfo {
  isCanonical: false;
  canonicalInstance: Variable;
  // canonicalInstance.value === absorbedVariable.value + valueOffset
  valueOffset: number;
}

export class Variable {
  static readonly all = new Set<Variable>();

  readonly id = generateId();
  represents?: { object: object; property: string };
  info: VariableInfo = {
    isCanonical: true,
    absorbedVariables: new Set(),
  };
  wasRemoved = false;

  constructor(
    private _value: number = 0,
    represents?: { object: object; property: string }
  ) {
    this.represents = represents;
    Variable.all.add(this);
  }

  /** Removes this variable and any constraint that reference it. */
  remove() {
    if (this.wasRemoved) {
      return;
    }

    Variable.all.delete(this);
    this.wasRemoved = true;
    for (const constraint of Constraint.all) {
      if (constraint.variables.includes(this)) {
        constraint.remove();
      }
    }
  }

  get canonicalInstance(): Variable {
    return this.info.isCanonical ? this : this.info.canonicalInstance;
  }

  get valueOffset() {
    return this.info.isCanonical ? 0 : this.info.valueOffset;
  }

  get value() {
    return this._value;
  }

  set value(newValue: number) {
    if (this.info.isCanonical) {
      this._value = newValue;
      for (const child of this.info.absorbedVariables) {
        const valueOffset = (child.info as AbsorbedVariableInfo).valueOffset;
        child._value = newValue - valueOffset;
      }
    } else {
      this.info.canonicalInstance.value = newValue + this.info.valueOffset;
    }
  }

  absorb(that: Variable, valueOffset = 0) {
    if (this === that) {
      return;
    } else if (!this.info.isCanonical || !that.info.isCanonical) {
      this.canonicalInstance.absorb(that.canonicalInstance, valueOffset);
      return;
    }

    const thatLockConstraint = that.lockConstraint;

    // console.log(this.id, 'absorbing', that.id);
    for (const otherVariable of that.info.absorbedVariables) {
      // console.log(this.id, 'absorbing', otherVariable.id);
      otherVariable.value = this.value;
      const otherVariableInfo = otherVariable.info as AbsorbedVariableInfo;
      otherVariableInfo.canonicalInstance = this;
      otherVariableInfo.valueOffset += valueOffset;
      this.info.absorbedVariables.add(otherVariable);
    }

    that.value = this.value;
    that.info = {
      isCanonical: false,
      canonicalInstance: this,
      valueOffset: valueOffset,
    };
    this.info.absorbedVariables.add(that);

    if (thatLockConstraint) {
      thatLockConstraint.remove();
      this.lock();
    }

    forgetClustersForSolver();
  }

  promoteToCanonical() {
    if (this.info.isCanonical) {
      // nothing to do
    } else {
      this.info.canonicalInstance.breakOff(this);
    }
  }

  breakOff(that: Variable) {
    if (!this.info.isCanonical) {
      throw new Error('Handle.breakOff() called on absorbed variable');
    }
    if (!this.info.absorbedVariables.has(that)) {
      throw new Error('cannot break off a variable that has not been absorbed');
    }

    this.info.absorbedVariables.delete(that);
    that.info = { isCanonical: true, absorbedVariables: new Set() };

    if (this.isLocked) {
      that.lock();
    }

    forgetClustersForSolver();
  }

  get lockConstraint(): Constant | null {
    for (const c of Constraint.all) {
      if (c instanceof Constant && c.variable === this.canonicalInstance) {
        return c;
      }
    }
    return null;
  }

  get isLocked() {
    return !!this.lockConstraint;
  }

  lock(): Constant {
    return constant(this.canonicalInstance).constraints.find(
      isConstantConstraint
    )!;
  }

  unlock() {
    for (const c of Constraint.all) {
      if (c instanceof Constant && c.variable === this.canonicalInstance) {
        c.remove();
      }
    }
  }

  toggleLock() {
    if (this.isLocked) {
      this.unlock();
    } else {
      this.lock();
    }
  }
}

// #region constraint and thing clusters for solver

// A group of constraints (and things that they operate on) that should be solved together.
interface ClusterForSolver {
  constraints: Constraint[];
  variables: Variable[];
  constrained: Set<Variable>; // TODO: replace with `free` (easier to explain)
}

let _clustersForSolver: Set<ClusterForSolver> | null = null;

function getClustersForSolver(root: GameObject): Set<ClusterForSolver> {
  if (_clustersForSolver) {
    return _clustersForSolver;
  }

  // TODO: document what's going on here
  for (const variable of Variable.all) {
    variable.info = { isCanonical: true, absorbedVariables: new Set() };
  }
  root.forEach({
    what: aCanonicalHandle,
    do: handle => handle.setupVariableRelationships(),
  });

  interface Cluster {
    constraints: Constraint[];
    manipulationSet: ManipulationSet;
  }

  const clusters = new Set<Cluster>();
  for (const constraint of Constraint.all) {
    const constraints = [constraint];
    const manipulationSet = constraint.getManipulationSet();
    for (const cluster of clusters) {
      if (cluster.manipulationSet.overlapsWith(manipulationSet)) {
        constraints.push(...cluster.constraints);
        manipulationSet.absorb(cluster.manipulationSet);
        clusters.delete(cluster);
      }
    }
    clusters.add({ constraints, manipulationSet });
  }

  _clustersForSolver = new Set(
    Array.from(clusters).map(({ constraints: origConstraints }) => {
      const { constraints, variables } =
        getDedupedConstraintsAndVariables(origConstraints);

      const constrained = new Set<Variable>();
      // TODO: do we really need to look at origConstraints when computing the constrained state?
      // I'm doing this because some constraints are removed in deduping, but it's possible that
      // there's enough info in the deduped constraints. On the other hand, also looking at
      // origConstraints doesn't hurt so I'm leaving it here for now. (Think about this later.)
      while (true) {
        const oldNumConstrainedVariables = constrained.size;
        for (const constraint of [...origConstraints, ...constraints]) {
          constraint.addConstrainedVariables(constrained);
        }
        if (constrained.size === oldNumConstrainedVariables) {
          // no varibles were added since last time, so we're done
          break;
        }
      }

      return { constraints, variables, constrained };
    })
  );

  // for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clusters = _clustersForSolver;

  // console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

function getDedupedConstraintsAndVariables(constraints: Constraint[]) {
  // console.log('orig constraints', constraints);
  let result: Omit<ClusterForSolver, 'constrained'> | null = null;
  while (true) {
    const oldNumConstraints = result
      ? result.constraints.length
      : constraints.length;
    result = dedupVariables(dedupConstraints(constraints));
    // console.log('new len', result.constraints.length, 'old', oldNumConstraints);
    if (result.constraints.length === oldNumConstraints) {
      return result;
    }
  }
}

function dedupConstraints(constraints: Constraint[]): Constraint[] {
  const constraintByKey = new Map<string, Constraint>();
  const constraintsToProcess = new Set(constraints);
  while (true) {
    const constraint = removeOne(constraintsToProcess);
    if (!constraint) {
      break;
    }

    const key = constraint.getKeyWithDedupedHandlesAndVars();
    const matchingConstraint = constraintByKey.get(key);
    if (matchingConstraint) {
      captureNewConstraints(constraintsToProcess, () =>
        matchingConstraint.onClash(constraint)
      );
    } else {
      constraintByKey.set(key, constraint);
    }
  }
  return Array.from(constraintByKey.values());
}

function dedupVariables(constraints: Constraint[]) {
  // Dedup variables based on Equals
  let idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof Equals)) {
      idx++;
      continue;
    }

    const { a, b } = constraint;
    a.absorb(b);
    constraints.splice(idx, 1);
  }

  // Here's another kind of deduping that we can do for variables: when
  // we have Sum(a, b, c) and Constant(c), variable a can absorb b w/
  // an "offset" of c. (There's a lot more that we could do here, this
  // is just an initial experiment.)
  // TODO: handle all possible cases.
  idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof Sum)) {
      idx++;
      continue;
    }

    const { a, b, c: k } = constraint;
    const constant = constraints.find(
      c =>
        c instanceof Constant &&
        c.variable.canonicalInstance === k.canonicalInstance
    ) as Constant;
    a.absorb(b, constant.value);
    constraints.splice(idx, 1);
  }

  // Gather all deduped variables.
  const variables = new Set<Variable>();
  for (const constraint of constraints) {
    for (const variable of constraint.variables) {
      variables.add(variable.canonicalInstance);
    }
  }

  return { variables: Array.from(variables), constraints };
}

function forgetClustersForSolver() {
  _clustersForSolver = null;
}

// #endregion constraint and thing clusters for solver

/**
 * Calls `fn`, and if that results in the creation of new constraints,
 * they will be added to `dest`, in addition to `Constraint.all`.
 */
function captureNewConstraints<T>(dest: Set<Constraint>, fn: () => T): T {
  newConstraintAccumulator = dest;
  try {
    return fn();
  } finally {
    newConstraintAccumulator = undefined;
  }
}

// #region solving

export function solve(root: GameObject) {
  const clusters = getClustersForSolver(root);
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}

function solveCluster({
  constraints,
  variables,
  constrained,
}: ClusterForSolver) {
  if (constraints.length === 0) {
    // nothing to solve!
    return;
  }

  const knowns = computeKnowns(constraints);

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like pin and
  // constant constraints.
  const inputs: number[] = [];
  const varIdx = new Map<Variable, number>();
  for (const variable of variables) {
    if (!knowns.has(variable) && constrained.has(variable)) {
      varIdx.set(variable, inputs.length);
      inputs.push(variable.value);
    }
  }

  // This is where we actually run the solver.

  function computeTotalError(currState: number[]) {
    let error = 0;
    for (const constraint of constraints) {
      if (constraint instanceof Constant || constraint instanceof Pin) {
        // Ignore -- these guys already did their job in propagateKnowns().
        continue;
      }
      const values = constraint.variables.map(variable => {
        const valueOffset = variable.valueOffset;
        variable = variable.canonicalInstance;
        const vi = varIdx.get(variable);
        return (
          (vi === undefined ? variable.value : currState[vi]) - valueOffset
        );
      });
      error += Math.pow(constraint.getError(values, knowns, constrained), 2);
    }
    return error;
  }

  let result: ReturnType<typeof minimize>;
  try {
    result = minimize(computeTotalError, inputs);
  } catch (e) {
    console.log(
      'minimizeError threw',
      e,
      'while working on cluster with',
      constraints,
      variables,
      'with inputs',
      inputs,
      'knowns',
      knowns,
      'and constrained variables',
      constrained
    );
    SVG.showStatus('' + e);
    throw e;
  }

  // SVG.showStatus(`${result.iterations} iterations`);

  // Now we write the solution from the solver back into our variables and handles.
  const outputs = result.solution;
  for (const variable of variables) {
    if (!knowns.has(variable) && constrained.has(variable)) {
      variable.value = outputs.shift()!;
    }
  }
}

function computeKnowns(constraints: Constraint[]) {
  const knownVariables = new Set<Variable>();
  while (true) {
    let didSomething = false;
    for (const constraint of constraints) {
      if (constraint.propagateKnowns(knownVariables)) {
        didSomething = true;
      }
    }
    if (!didSomething) {
      break;
    }
  }
  return knownVariables;
}

// #endregion solving

// #region adding constraints

class ConstraintKeyGenerator {
  public readonly key: string;

  constructor(
    private readonly type: string,
    private readonly variableGroups: Variable[][]
  ) {
    this.key = this.generateKey();
  }

  getKeyWithDedupedHandlesAndVars() {
    return this.generateKey(true);
  }

  private generateKey(dedupHandlesAndVars = false) {
    const variableIdGroups = this.variableGroups
      .map(variableGroup =>
        variableGroup
          .map(variable =>
            dedupHandlesAndVars ? variable.canonicalInstance.id : variable.id
          )
          .sort()
          .join(',')
      )
      .map(variableIdGroup => `[${variableIdGroup}]`);
    return `${this.type}([${variableIdGroups}])`;
  }
}

export type OwnedVariables<OwnedVariableNames extends string> = {
  [Key in OwnedVariableNames]: Variable;
};

export interface AddConstraintResult<
  OwnedVariableNames extends string = never,
> {
  constraints: Constraint[];
  variables: OwnedVariables<OwnedVariableNames>;
  remove(): void;
}

function addConstraint<
  OwnedVariableNames extends string,
  C extends Constraint<OwnedVariableNames>,
>(
  keyGenerator: ConstraintKeyGenerator,
  createNew: (keyGenerator: ConstraintKeyGenerator) => C,
  onClash: (existingConstraint: C) => AddConstraintResult<OwnedVariableNames>
): AddConstraintResult<OwnedVariableNames> {
  const constraint = Constraint.find(
    constraint => constraint.key === keyGenerator.key
  ) as C | undefined;
  return constraint
    ? onClash(constraint)
    : createNew(keyGenerator).toAddConstraintResult();
}

// #endregion adding constraints

class ManipulationSet {
  readonly variables: Set<Variable>;

  constructor(vars: Variable[]) {
    this.variables = new Set(vars.map(variable => variable.canonicalInstance));
  }

  overlapsWith(that: ManipulationSet) {
    for (const v of that.variables) {
      if (this.variables.has(v)) {
        return true;
      }
    }
    return false;
  }

  absorb(that: ManipulationSet) {
    for (const v of that.variables) {
      this.variables.add(v);
    }
  }
}

let newConstraintAccumulator: Set<Constraint> | undefined;

abstract class Constraint<OwnedVariableNames extends string = never> {
  static readonly all = new Set<Constraint>();

  static find(
    pred: (constraint: Constraint) => boolean
  ): Constraint | undefined {
    for (const constraint of Constraint.all) {
      if (pred(constraint)) {
        return constraint;
      }
    }
    return undefined;
  }

  wasRemoved = false;

  constructor(
    public readonly variables: Variable[],
    private readonly keyGenerator: ConstraintKeyGenerator
  ) {
    Constraint.all.add(this);
    newConstraintAccumulator?.add(this);
    forgetClustersForSolver();
  }

  abstract get ownedVariables(): {
    [Key in OwnedVariableNames]: Variable;
  };

  /** Removes this constraint, any variables that it owns, and any constraint that references one of those variables. */
  remove() {
    if (this.wasRemoved) {
      return;
    }

    // Remove me.
    if (Constraint.all.delete(this)) {
      forgetClustersForSolver();
    }
    this.wasRemoved = true;

    // Remove the variables that I own and any constraint that references them.
    for (const variable of Object.values(this.ownedVariables) as Variable[]) {
      variable.remove();
    }
  }

  get key() {
    return this.keyGenerator.key;
  }

  getKeyWithDedupedHandlesAndVars() {
    return this.keyGenerator.getKeyWithDedupedHandlesAndVars();
  }

  abstract addConstrainedVariables(constrained: Set<Variable>): void;

  /**
   * If this constraint can determine the values of any variables based on
   * other state that is already known, it should set the values of those
   * variables, add them to `knowns`, and return `true`. Otherwise, it
   * should return `false`.
   */
  propagateKnowns(_knowns: Set<Variable>): boolean {
    return false;
  }

  /**
   * Returns the current error for this constraint. (OK if it's negative.)
   * If this constraint owns a variable whose state is not constrained,
   * ignore the corresponding value in `variableValues` and instead set
   * the value of that variable to make the error equal to zero.
   */
  abstract getError(
    variableValues: number[],
    knowns: Set<Variable>,
    constrained: Set<Variable>
  ): number;

  abstract onClash(constraint: this): AddConstraintResult<OwnedVariableNames>;

  toAddConstraintResult(): AddConstraintResult<OwnedVariableNames> {
    return {
      constraints: [this],
      variables: this.ownedVariables,
      remove: () => this.remove(),
    };
  }

  getManipulationSet(): ManipulationSet {
    return new ManipulationSet(this.variables);
  }
}

export function variable(value = 0): Variable {
  return new Variable(value);
}

export function constant(
  variable: Variable,
  value: number = variable.value
): AddConstraintResult {
  return addConstraint(
    new ConstraintKeyGenerator('constant', [[variable]]),
    keyGenerator => new Constant(variable, value, keyGenerator),
    existingConstraint => existingConstraint.onClash(value)
  );
}

class Constant extends Constraint {
  constructor(
    public readonly variable: Variable,
    public value: number,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([variable], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedVariables(constrained: Set<Variable>): void {
    constrained.add(this.variable);
  }

  propagateKnowns(knowns: Set<Variable>): boolean {
    if (!knowns.has(this.variable)) {
      this.variable.value = this.value;
      knowns.add(this.variable);
      return true;
    } else {
      return false;
    }
  }

  getError(_values: number[]): number {
    throw new Error('Constant.getError() should never be called!');
  }

  onClash(constraint: this): AddConstraintResult;
  onClash(value: number): AddConstraintResult;
  onClash(constraintOrValue: this | number): AddConstraintResult {
    this.value =
      constraintOrValue instanceof Constant
        ? constraintOrValue.value
        : constraintOrValue;
    return this.toAddConstraintResult();
  }
}

const isConstantConstraint = (c: Constraint): c is Constant =>
  c instanceof Constant;

export function equals(a: Variable, b: Variable): AddConstraintResult {
  return addConstraint(
    new ConstraintKeyGenerator('equals', [[a, b]]),
    keyGenerator => new Equals(a, b, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

class Equals extends Constraint {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedVariables(constrained: Set<Variable>): void {
    if (constrained.has(this.a)) {
      constrained.add(this.b);
    }
    if (constrained.has(this.b)) {
      constrained.add(this.a);
    }
  }

  propagateKnowns(knowns: Set<Variable>): boolean {
    if (!knowns.has(this.a) && knowns.has(this.b)) {
      this.a.value = this.b.value;
      knowns.add(this.a);
      return true;
    } else if (knowns.has(this.a) && !knowns.has(this.b)) {
      this.b.value = this.a.value;
      knowns.add(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(
    values: number[],
    _knowns: Set<Variable>,
    constrained: Set<Variable>
  ) {
    const [aValue, bValue] = values;
    if (!constrained.has(this.a)) {
      this.a.value = this.b.value;
    } else if (!constrained.has(this.b)) {
      this.b.value = this.a.value;
    }
    return aValue - bValue;
  }

  onClash(): AddConstraintResult {
    return this.toAddConstraintResult();
  }
}

/** a = b + c */
export function sum(
  a: Variable,
  b: Variable,
  c: Variable
): AddConstraintResult {
  return addConstraint(
    new ConstraintKeyGenerator('sum', [[a], [b, c]]),
    keyGenerator => new Sum(a, b, c, keyGenerator),
    existingConstraint => existingConstraint.onClash(a, b, c)
  );
}

class Sum extends Constraint {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    readonly c: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b, c], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedVariables(constrained: Set<Variable>): void {
    if (
      constrained.has(this.a) ||
      constrained.has(this.b) ||
      constrained.has(this.c)
    ) {
      constrained.add(this.a);
      constrained.add(this.b);
      constrained.add(this.c);
    }
  }

  propagateKnowns(knowns: Set<Variable>): boolean {
    if (!knowns.has(this.a) && knowns.has(this.b) && knowns.has(this.c)) {
      this.a.value = this.b.value + this.c.value;
      knowns.add(this.a);
      return true;
    } else if (
      knowns.has(this.a) &&
      !knowns.has(this.b) &&
      knowns.has(this.c)
    ) {
      this.b.value = this.a.value - this.c.value;
      knowns.add(this.b);
      return true;
    } else if (
      knowns.has(this.a) &&
      knowns.has(this.b) &&
      !knowns.has(this.c)
    ) {
      this.c.value = this.a.value - this.b.value;
      knowns.add(this.c);
      return true;
    } else {
      return false;
    }
  }

  getError(
    [aValue, bValue, cValue]: number[],
    _knowns: Set<Variable>,
    constrained: Set<Variable>
  ) {
    if (
      !constrained.has(this.a) &&
      constrained.has(this.b) &&
      constrained.has(this.c)
    ) {
      this.a.value = this.b.value + this.c.value;
    } else if (
      constrained.has(this.a) &&
      !constrained.has(this.b) &&
      constrained.has(this.c)
    ) {
      this.b.value = this.a.value - this.c.value;
    } else if (
      constrained.has(this.a) &&
      constrained.has(this.b) &&
      !constrained.has(this.c)
    ) {
      this.c.value = this.a.value - this.b.value;
    }
    return aValue - (bValue + cValue);
  }

  onClash(a: Variable, b: Variable, c: Variable): AddConstraintResult;
  onClash(newerConstraint: this): AddConstraintResult;
  onClash(
    _newerConstraintOrA: this | Variable,
    _b?: Variable,
    _c?: Variable
  ): AddConstraintResult {
    // TODO: implement this
    throw new Error('TODO');
  }
}

export function pin(
  handle: Handle,
  pos: Position = handle.position
): AddConstraintResult {
  return addConstraint(
    new ConstraintKeyGenerator('pin', [[handle.xVariable], [handle.yVariable]]),
    keyGenerator => new Pin(handle, pos, keyGenerator),
    existingConstraint => existingConstraint.onClash(pos)
  );
}

class Pin extends Constraint {
  constructor(
    private readonly handle: Handle,
    public position: Position,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle.xVariable, handle.yVariable], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedVariables(constrained: Set<Variable>): void {
    constrained.add(this.handle.xVariable);
    constrained.add(this.handle.yVariable);
  }

  propagateKnowns(knowns: Set<Variable>): boolean {
    if (
      !knowns.has(this.handle.xVariable) ||
      !knowns.has(this.handle.yVariable)
    ) {
      this.handle.position = this.position;
      knowns.add(this.handle.xVariable);
      knowns.add(this.handle.yVariable);
      return true;
    } else {
      return false;
    }
  }

  getError(_values: number[]): number {
    throw new Error('Pin.getError() should never be called!');
  }

  onClash(constraint: this): AddConstraintResult;
  onClash(position: Position): AddConstraintResult;
  onClash(constraintOrPosition: this | Position): AddConstraintResult {
    this.position =
      constraintOrPosition instanceof Pin
        ? constraintOrPosition.position
        : constraintOrPosition;
    return this.toAddConstraintResult();
  }
}

export function horizontal(a: Handle, b: Handle): AddConstraintResult {
  return equals(a.yVariable, b.yVariable);
}

export function vertical(a: Handle, b: Handle): AddConstraintResult {
  return equals(a.xVariable, b.xVariable);
}

export function distance(
  a: Handle,
  b: Handle
): AddConstraintResult<'distance'> {
  return addConstraint(
    new ConstraintKeyGenerator('distance', [
      [a.xVariable, b.xVariable],
      [a.yVariable, b.yVariable],
    ]),
    keyGenerator => new Distance(a, b, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

export function equalDistance(
  a1: Handle,
  a2: Handle,
  b1: Handle,
  b2: Handle
): AddConstraintResult {
  const { distance: distanceA } = distance(a1, a2).variables;
  const { distance: distanceB } = distance(b1, b2).variables;
  return equals(distanceA, distanceB);
}

class Distance extends Constraint<'distance'> {
  constructor(
    public readonly a: Handle,
    public readonly b: Handle,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super(
      [
        new Variable(Vec.dist(a.position, b.position)),
        a.xVariable,
        a.yVariable,
        b.xVariable,
        b.yVariable,
      ],
      keyGenerator
    );
    this.distance.represents = { object: this, property: 'distance' };
  }

  readonly ownedVariables = { distance: this.distance };

  get distance() {
    return this.variables[0];
  }

  addConstrainedVariables(constrained: Set<Variable>): void {
    if (constrained.has(this.distance)) {
      constrained.add(this.a.xVariable);
      constrained.add(this.a.yVariable);
      constrained.add(this.b.xVariable);
      constrained.add(this.b.yVariable);
    }
  }

  getError(
    [dist, ax, ay, bx, by]: number[],
    _knowns: Set<Variable>,
    constrained: Set<Variable>
  ): number {
    const aPos = { x: ax, y: ay };
    const bPos = { x: bx, y: by };
    const currDist = Vec.dist(aPos, bPos);
    if (!constrained.has(this.distance)) {
      this.distance.value = currDist;
    }
    return currDist - dist;
  }

  onClash(that: this): AddConstraintResult<'distance'>;
  onClash(): AddConstraintResult<'distance'>;
  onClash(that?: this): AddConstraintResult<'distance'> {
    if (that) {
      const eq = equals(this.distance, that.distance);
      return {
        constraints: [that, ...eq.constraints],
        variables: that.ownedVariables,
        remove() {
          that.remove();
          eq.remove();
        },
      };
    } else {
      return this.toAddConstraintResult();
    }
  }
}

export function angle(a: Handle, b: Handle): AddConstraintResult<'angle'> {
  return addConstraint(
    new ConstraintKeyGenerator('angle', [
      [a.xVariable, b.xVariable],
      [a.yVariable, b.yVariable],
    ]),
    keyGenerator => new Angle(a, b, keyGenerator),
    existingConstraint => existingConstraint.onClash(a, b)
  );
}

export function fixedAngle(
  a1: Handle,
  a2: Handle,
  b1: Handle,
  b2: Handle,
  angleValue: number
): AddConstraintResult<'diff'> {
  const {
    constraints: [angleAConstraint],
    variables: { angle: angleA },
  } = angle(a1, a2);
  const {
    constraints: [angleBConstraint],
    variables: { angle: angleB },
  } = angle(b1, b2);
  const diff = variable(angleValue);
  const s = sum(angleA, angleB, diff);
  const k = constant(diff);
  return {
    constraints: [
      angleAConstraint,
      angleBConstraint,
      ...s.constraints,
      ...k.constraints,
    ],
    variables: { diff },
    remove() {
      s.remove();
      k.remove();
    },
  };
}

class Angle extends Constraint<'angle'> {
  constructor(
    public readonly a: Handle,
    public readonly b: Handle,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super(
      [
        new Variable(Vec.angle(Vec.sub(b.position, a.position))),
        a.xVariable,
        a.yVariable,
        b.xVariable,
        b.yVariable,
      ],
      keyGenerator
    );
    this.angle.represents = { object: this, property: 'angle' };
  }

  readonly ownedVariables = { angle: this.angle };

  get angle() {
    return this.variables[0];
  }

  addConstrainedVariables(constrained: Set<Variable>): void {
    if (constrained.has(this.angle)) {
      constrained.add(this.a.xVariable);
      constrained.add(this.a.yVariable);
      constrained.add(this.b.xVariable);
      constrained.add(this.b.yVariable);
    }
  }

  getError(
    [angle, ax, ay, bx, by]: number[],
    knowns: Set<Variable>,
    constrained: Set<Variable>
  ): number {
    // The old way, which has problems b/c errors are in terms of angles.
    // const currentAngle = Vec.angle(Vec.sub(bPos, aPos));
    // return (currentAngle - angle) * 100;

    // The new way, implemented in terms of the minimum amount of displacement
    // required to satisfy the constraint.

    if (!constrained.has(this.angle)) {
      this.angle.value = Vec.angle(Vec.sub(this.b.position, this.a.position));
      return 0;
    }

    const aPos = { x: ax, y: ay };
    const bPos = { x: bx, y: by };
    const r = Vec.dist(bPos, aPos);
    let error = Infinity;

    if (!knowns.has(this.b.xVariable) && !knowns.has(this.b.yVariable)) {
      const x = ax + r * Math.cos(angle);
      const y = ay + r * Math.sin(angle);
      error = Math.min(error, Vec.dist(bPos, { x, y }));
    } else if (!knowns.has(this.b.xVariable)) {
      const x = ax + (by - ay) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - bx));
    } else if (!knowns.has(this.b.yVariable)) {
      const y = ay + (bx - ax) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - by));
    }

    if (!knowns.has(this.a.xVariable) && !knowns.has(this.a.yVariable)) {
      const x = bx + r * Math.cos(angle + Math.PI);
      const y = by + r * Math.sin(angle + Math.PI);
      error = Math.min(error, Vec.dist(aPos, { x, y }));
    } else if (!knowns.has(this.a.xVariable)) {
      const x = bx + (ay - by) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - ax));
    } else if (!knowns.has(this.a.yVariable)) {
      const y = by + (ax - bx) * Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(y - ay));
    }

    if (!Number.isFinite(error)) {
      // We can't move anything, but we'll ignore that and return a "reasonable" error.
      // (This gets better results than returning zero.)

      error = Math.min(
        // error we'd get from moving b to satisfy the constraint
        Vec.dist(bPos, {
          x: ax + r * Math.cos(angle),
          y: ay + r * Math.sin(angle),
        }),
        // error we'd get from moving a to satisfy the constraint
        Vec.dist(aPos, {
          x: bx + r * Math.cos(angle + Math.PI),
          y: Math.sin(angle + Math.PI),
        })
      );
    }

    return error;
  }

  onClash(that: this): AddConstraintResult<'angle'>;
  onClash(a: Handle, b: Handle): AddConstraintResult<'angle'>;
  onClash(thatOrA: this | Handle, b?: Handle): AddConstraintResult<'angle'> {
    if (thatOrA instanceof Angle) {
      const that = thatOrA;
      if (this.a === that.a && this.b === that.b) {
        // exactly the same thing!
        const eq = equals(this.angle, that.angle);
        return {
          constraints: [that, ...eq.constraints],
          variables: that.ownedVariables,
          remove() {
            that!.remove();
            eq.remove();
          },
        };
      } else {
        // same points but different order
        const diff = new Variable(this.angle.value - that.angle.value);
        const k = constant(diff);
        const s = sum(this.angle, that.angle, diff);
        return {
          constraints: [that, ...k.constraints, ...s.constraints],
          variables: that.ownedVariables,
          remove() {
            that.remove();
            k.remove();
            s.remove();
          },
        };
      }
    } else {
      const a = thatOrA;
      b = b!; // help the type checker understand that this is not undefined
      const angle = new Variable(Vec.angle(Vec.sub(b.position, a.position)));
      if (this.a === a && this.b === b) {
        // exactly the same thing!
        const eq = equals(this.angle, angle);
        return {
          constraints: eq.constraints,
          variables: { angle },
          remove() {
            eq.remove();
          },
        };
      } else {
        // same points but different order
        const diff = new Variable(this.angle.value - angle.value);
        const k = constant(diff);
        const s = sum(this.angle, angle, diff);
        return {
          constraints: [...k.constraints, ...s.constraints],
          variables: { angle },
          remove() {
            k.remove();
            s.remove();
          },
        };
      }
    }
  }
}

// This is a quick hack to get ivan going!
export function polarVector(
  a: Handle,
  b: Handle
): AddConstraintResult<'angle' | 'distance'> {
  const {
    constraints: [angleConstraint],
    variables: { angle: angleVariable },
  } = angle(a, b);
  const {
    constraints: [lengthConstraint],
    variables: { distance: distanceVariable },
  } = distance(a, b);
  return {
    constraints: [angleConstraint, lengthConstraint],
    variables: { angle: angleVariable, distance: distanceVariable },
    remove() {
      angleConstraint.remove();
      lengthConstraint.remove();
    },
  };
}

export function formula(
  args: Variable[],
  fn: (xs: number[]) => number
): AddConstraintResult<'result'> {
  const result = new Variable(fn(args.map(arg => arg.value)));
  return addConstraint(
    new ConstraintKeyGenerator('formula#' + generateId(), []),
    keyGenerator => new Formula(args, result, fn, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

class Formula extends Constraint<'result'> {
  constructor(
    public readonly args: Variable[],
    public readonly result: Variable,
    private readonly fn: (xs: number[]) => number,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([...args, result], keyGenerator);
    this.result.represents = { object: this, property: 'result' };
  }

  readonly ownedVariables = { result: this.result };

  addConstrainedVariables(constrained: Set<Variable>): void {
    for (const arg of this.args) {
      constrained.add(arg);
    }
  }

  propagateKnowns(knowns: Set<Variable>): boolean {
    if (!knowns.has(this.result) && this.args.every(arg => knowns.has(arg))) {
      this.result.value = this.computeResult();
      knowns.add(this.result);
      return true;
    } else {
      return false;
    }
  }

  getError(
    variableValues: number[],
    _knowns: Set<Variable>,
    constrained: Set<Variable>
  ): number {
    const currValue = this.computeResult(variableValues);
    if (!constrained.has(this.result)) {
      this.result.value = currValue;
      return 0;
    } else {
      return currValue - this.result.value;
    }
  }

  onClash(): AddConstraintResult<'result'>;
  onClash(that: this): AddConstraintResult<'result'>;
  onClash(_that?: this): AddConstraintResult<'result'> {
    throw new Error('Formula.onClash() should never be called!');
  }

  private computeResult(
    xs: number[] = this.args.map(arg => arg.value)
  ): number {
    return this.fn(xs);
  }
}

// #region temporary constraints

const tempConstraints = new Set<Constraint>();

export const now = {
  clear() {
    for (const constraint of tempConstraints) {
      tempConstraints.delete(constraint);
      constraint.remove();
    }
  },

  constant(variable: Variable, value: number = variable.value) {
    return captureNewConstraints(tempConstraints, () =>
      constant(variable, value)
    );
  },

  equals(a: Variable, b: Variable) {
    return captureNewConstraints(tempConstraints, () => equals(a, b));
  },

  sum(a: Variable, b: Variable, c: Variable) {
    return captureNewConstraints(tempConstraints, () => sum(a, b, c));
  },

  pin(handle: Handle, pos: Position = handle.position) {
    return captureNewConstraints(tempConstraints, () => pin(handle, pos));
  },

  horizontal(a: Handle, b: Handle) {
    return captureNewConstraints(tempConstraints, () => horizontal(a, b));
  },

  vertical(a: Handle, b: Handle) {
    return captureNewConstraints(tempConstraints, () => vertical(a, b));
  },

  distance(a: Handle, b: Handle) {
    return captureNewConstraints(tempConstraints, () => distance(a, b));
  },

  equalDistance(a1: Handle, a2: Handle, b1: Handle, b2: Handle) {
    return captureNewConstraints(tempConstraints, () =>
      equalDistance(a1, a2, b1, b2)
    );
  },

  angle(a: Handle, b: Handle) {
    return captureNewConstraints(tempConstraints, () => angle(a, b));
  },

  fixedAngle(
    a1: Handle,
    a2: Handle,
    b1: Handle,
    b2: Handle,
    angleValue: number
  ) {
    return captureNewConstraints(tempConstraints, () =>
      fixedAngle(a1, a2, b1, b2, angleValue)
    );
  },

  polarVector(a: Handle, b: Handle) {
    return captureNewConstraints(tempConstraints, () => polarVector(a, b));
  },

  formula(args: Variable[], fn: (xs: number[]) => number) {
    return captureNewConstraints(tempConstraints, () => formula(args, fn));
  },
};

// #endregion temporary constraints

// #region debugging

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allConstraints = Constraint.all;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allVariables = Variable.all;

// #endregion debugging
