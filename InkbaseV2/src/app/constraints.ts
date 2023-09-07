import { minimize } from '../lib/g9';
import { Position } from '../lib/types';
import { generateId, removeOne } from '../lib/helpers';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import SVG from './Svg';

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
  info: VariableInfo = {
    isCanonical: true,
    absorbedVariables: new Set(),
  };
  wasRemoved = false;

  constructor(private _value: number = 0) {
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
  }

  resetInfo() {
    if (this.info.isCanonical) {
      this.info.absorbedVariables.clear();
    } else {
      this.info = {
        isCanonical: true,
        absorbedVariables: new Set(),
      };
    }
  }
}

// #region constraint and thing clusters for solver

// A group of constraints (and things that they operate on) that should be solved together.
interface ClusterForSolver {
  constraints: Constraint[];
  variables: Variable[];
  handles: Handle[];
  handleGetsXFrom: Map<Handle, Variable>;
  handleGetsYFrom: Map<Handle, Variable>;
  constrainedState: StateSet;
}

let _clustersForSolver: Set<ClusterForSolver> | null = null;

function getClustersForSolver(): Set<ClusterForSolver> {
  if (_clustersForSolver) {
    return _clustersForSolver;
  }

  for (const variable of Variable.all) {
    variable.resetInfo();
  }

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
    Array.from(clusters).map(cluster => {
      const origConstraints = cluster.constraints;
      const { constraints, variables, handleGetsXFrom, handleGetsYFrom } =
        getDedupedConstraintsAndVariables(origConstraints);

      const constrainedState = new StateSet();
      // TODO: do we really need to look at origConstraints when computing the constrained state?
      // I'm doing this because some constraints are removed in deduping, but it's possible that
      // there's enough info in the deduped constraints. On the other hand, also looking at
      // origConstraints doesn't hurt so I'm leaving it here for now. (Think about this later.)
      for (const constraint of [...origConstraints, ...constraints]) {
        constraint.addConstrainedState(constrainedState);
      }

      return {
        constraints,
        variables,
        handles: getHandlesIn(constraints),
        handleGetsXFrom,
        handleGetsYFrom,
        constrainedState,
      };
    })
  );

  // for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clusters = _clustersForSolver;

  // console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

// TODO: this function works, but it's gross. Refactor.
function getDedupedConstraintsAndVariables(constraints: Constraint[]) {
  // console.log('orig constraints', constraints);
  let result: Omit<ClusterForSolver, 'handles' | 'constrainedState'> | null =
    null;
  while (true) {
    const oldNumConstraints = result
      ? result.constraints.length
      : constraints.length;
    const handleGetsXFrom = result
      ? result.handleGetsXFrom
      : new Map<Handle, Variable>();
    const handleGetsYFrom = result
      ? result.handleGetsYFrom
      : new Map<Handle, Variable>();
    result = dedupVariables(dedupConstraints(constraints));
    for (const [handle, variable] of handleGetsXFrom) {
      if (!result.handleGetsXFrom.has(handle)) {
        result.handleGetsXFrom.set(handle, variable);
      }
    }
    for (const [handle, variable] of handleGetsYFrom) {
      if (!result.handleGetsYFrom.has(handle)) {
        result.handleGetsYFrom.set(handle, variable);
      }
    }
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

  // When properties are used, unify the state from the handle
  // with that of the variable that is associated with it.
  const handleGetsXFrom = new Map<Handle, Variable>();
  const handleGetsYFrom = new Map<Handle, Variable>();
  for (const c of constraints) {
    if (c instanceof Property) {
      (c.property === 'x' ? handleGetsXFrom : handleGetsYFrom).set(
        c.handle.canonicalInstance,
        c.variable.canonicalInstance
      );
    }
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

  return {
    variables: Array.from(variables),
    constraints,
    handleGetsXFrom,
    handleGetsYFrom,
  };
}

function getHandlesIn(constraints: Constraint[]) {
  const handles = new Set<Handle>();
  for (const constraint of constraints) {
    for (const handle of constraint.handles) {
      handles.add(handle.canonicalInstance);
    }
  }
  return Array.from(handles);
}

function forgetClustersForSolver() {
  _clustersForSolver = null;
}

export function onHandlesReconfigured() {
  forgetClustersForSolver();
}

// #endregion constraint and thing clusters for solver

/**
 * Calls `fn`, and if that results in the creation of new constraints,
 * they will be added to `dest`, in addition to `Constraint.all`.
 */
function captureNewConstraints(dest: Set<Constraint>, fn: () => void) {
  newConstraintAccumulator = dest;
  try {
    fn();
  } finally {
    newConstraintAccumulator = undefined;
  }
}

// #region solving

class StateSet {
  private readonly xs = new Set<Handle>();
  private readonly ys = new Set<Handle>();
  private readonly vars = new Set<Variable>();

  /**
   * Returns a new state set. If `parent` is supplied, the new state set will include
   * every x, y, and variable that is in the parent state set, but adding new things to
   * the new state set does not change the parent state set.
   */
  constructor(private readonly parent?: StateSet) {}

  hasX(handle: Handle): boolean {
    return this.parent?.hasX(handle) || this.xs.has(handle.canonicalInstance);
  }

  hasY(handle: Handle): boolean {
    return this.parent?.hasY(handle) || this.ys.has(handle.canonicalInstance);
  }

  hasVar(variable: Variable): boolean {
    return (
      this.parent?.hasVar(variable) || this.vars.has(variable.canonicalInstance)
    );
  }

  addX(handle: Handle) {
    this.xs.add(handle.canonicalInstance);
  }

  addY(handle: Handle) {
    this.ys.add(handle.canonicalInstance);
  }

  addVar(variable: Variable) {
    this.vars.add(variable.canonicalInstance);
  }

  toJSON() {
    return {
      vars: Array.from(
        new Set([...this.vars, ...(this.parent?.vars ?? [])])
      ).map(v => ({ id: v.id, value: v.value })),
      xs: Array.from(new Set([...this.xs, ...(this.parent?.xs ?? [])])).map(
        h => ({ id: h.id, x: h.position.x })
      ),
      ys: Array.from(new Set([...this.ys, ...(this.parent?.ys ?? [])])).map(
        h => ({ id: h.id, y: h.position.y })
      ),
    };
  }
}

export function solve() {
  const clusters = getClustersForSolver();
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}

function solveCluster(cluster: ClusterForSolver) {
  const oldNumConstraints = cluster.constraints.length;

  if (cluster.constraints.length === 0) {
    // nothing to solve!
    return;
  }

  const constrainedState = new StateSet(cluster.constrainedState);

  try {
    minimizeError(cluster, constrainedState);
  } finally {
    // Remove the temporary pin constraints that we added to `constraints`.
    cluster.constraints.length = oldNumConstraints;
  }
}

function minimizeError(
  {
    constraints,
    variables,
    handles,
    handleGetsXFrom,
    handleGetsYFrom,
  }: ClusterForSolver,
  constrainedState: StateSet
) {
  const knownState = computeKnownState(constraints);

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like pin and
  // constant constraints.
  const inputs: number[] = [];
  const inputDescriptions: string[] = [];
  const varIdx = new Map<Variable, number>();
  for (const variable of variables) {
    if (!knownState.hasVar(variable) && constrainedState.hasVar(variable)) {
      varIdx.set(variable, inputs.length);
      inputs.push(variable.value);
      inputDescriptions.push(`var ${variable.id}`);
    }
  }
  const xIdx = new Map<Handle, number>();
  const yIdx = new Map<Handle, number>();
  for (const handle of handles) {
    if (knownState.hasX(handle) || !constrainedState.hasX(handle)) {
      // no op
    } else if (handleGetsXFrom.has(handle)) {
      xIdx.set(handle, varIdx.get(handleGetsXFrom.get(handle)!)!);
    } else {
      xIdx.set(handle, inputs.length);
      inputs.push(handle.position.x);
      inputDescriptions.push(`x ${handle.id}`);
    }

    if (knownState.hasY(handle) || !constrainedState.hasY(handle)) {
      // no op
    } else if (handleGetsYFrom.has(handle)) {
      yIdx.set(handle, varIdx.get(handleGetsYFrom.get(handle)!)!);
    } else {
      yIdx.set(handle, inputs.length);
      inputs.push(handle.position.y);
      inputDescriptions.push(`y ${handle.id}`);
    }
  }

  // This is where we actually run the solver.

  function computeTotalError(currState: number[]) {
    let error = 0;
    for (const constraint of constraints) {
      if (constraint instanceof Constant || constraint instanceof Pin) {
        // Ignore -- these guys already did their job in propagateKnownState().
        continue;
      }
      const positions = constraint.handles.map(handle => {
        handle = handle.canonicalInstance;
        const xi = xIdx.get(handle);
        const yi = yIdx.get(handle);
        if (xi === undefined && yi === undefined) {
          return handle.position;
        } else {
          return {
            x: xi === undefined ? handle.position.x : currState[xi],
            y: yi === undefined ? handle.position.y : currState[yi],
          };
        }
      });
      const values = constraint.variables.map(variable => {
        const valueOffset = variable.valueOffset;
        variable = variable.canonicalInstance;
        const vi = varIdx.get(variable);
        return (
          (vi === undefined ? variable.value : currState[vi]) - valueOffset
        );
      });
      error += Math.pow(
        constraint.getError(positions, values, knownState, constrainedState),
        2
      );
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
      handles,
      'with inputs',
      inputs.map((input, idx) => ({ input, is: inputDescriptions[idx] })),
      'known state',
      knownState.toJSON(),
      'and constrained state',
      constrainedState.toJSON()
    );
    SVG.showStatus('' + e);
    throw e;
  }

  // SVG.showStatus(`${result.iterations} iterations`);

  // Now we write the solution from the solver back into our variables and handles.
  const outputs = result.solution;
  for (const variable of variables) {
    if (!knownState.hasVar(variable) && constrainedState.hasVar(variable)) {
      variable.value = outputs.shift()!;
    }
  }
  for (const handle of handles) {
    const x =
      knownState.hasX(handle) || !constrainedState.hasX(handle)
        ? handle.position.x
        : handleGetsXFrom.has(handle)
        ? handleGetsXFrom.get(handle)!.value
        : outputs.shift()!;
    const y =
      knownState.hasY(handle) || !constrainedState.hasY(handle)
        ? handle.position.y
        : handleGetsYFrom.has(handle)
        ? handleGetsYFrom.get(handle)!.value
        : outputs.shift()!;
    handle.position = { x, y };
  }
}

function computeKnownState(constraints: Constraint[]) {
  const knownState = new StateSet();
  while (true) {
    let didSomething = false;
    for (const constraint of constraints) {
      if (constraint.propagateKnownState(knownState)) {
        didSomething = true;
      }
    }
    if (!didSomething) {
      break;
    }
  }
  return knownState;
}

// #endregion solving

// #region adding constraints

class ConstraintKeyGenerator {
  public readonly key: string;

  constructor(
    private readonly type: string,
    private readonly handleGroups: Handle[][],
    private readonly variableGroups: Variable[][]
  ) {
    this.key = this.generateKey();
  }

  getKeyWithDedupedHandlesAndVars() {
    return this.generateKey(true);
  }

  private generateKey(dedupHandlesAndVars = false) {
    const handleIdGroups = this.handleGroups
      .map(handleGroup =>
        handleGroup
          .map(handle => (dedupHandlesAndVars ? handle.id : handle.ownId))
          .sort()
          .join(',')
      )
      .map(handleIdGroup => `[${handleIdGroup}]`);
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
    return `${this.type}([${handleIdGroups}],[${variableIdGroups}])`;
  }
}

export type OwnedVariables<OwnedVariableNames extends string> = {
  [Key in OwnedVariableNames]: Variable;
};

export interface AddConstraintResult<OwnedVariableNames extends string> {
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
  readonly xs: Set<Handle>;
  readonly ys: Set<Handle>;
  readonly vars: Set<Variable>;

  constructor({
    xs,
    ys,
    vars,
  }: {
    xs: Handle[];
    ys: Handle[];
    vars: Variable[];
  }) {
    this.xs = new Set(xs.map(handle => handle.canonicalInstance));
    this.ys = new Set(ys.map(handle => handle.canonicalInstance));
    this.vars = new Set(vars.map(variable => variable.canonicalInstance));
  }

  overlapsWith(that: ManipulationSet) {
    for (const h of that.xs) {
      if (this.xs.has(h)) {
        return true;
      }
    }
    for (const h of that.ys) {
      if (this.ys.has(h)) {
        return true;
      }
    }
    for (const v of that.vars) {
      if (this.vars.has(v)) {
        return true;
      }
    }
    return false;
  }

  absorb(that: ManipulationSet) {
    for (const h of that.xs) {
      this.xs.add(h);
    }
    for (const h of that.ys) {
      this.ys.add(h);
    }
    for (const v of that.vars) {
      this.vars.add(v);
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
    public readonly handles: Handle[],
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
    for (const variable of Object.values(this.ownedVariables)) {
      (variable as Variable).remove();
    }
  }

  get key() {
    return this.keyGenerator.key;
  }

  getKeyWithDedupedHandlesAndVars() {
    return this.keyGenerator.getKeyWithDedupedHandlesAndVars();
  }

  abstract addConstrainedState(constrainedState: StateSet): void;

  /**
   * If this constraint can determine the values of any xs, ys, or variables
   * based on other state that is already known, it should set the values
   * of those things, add them to the known state set, and return `true`.
   * Otherwise, it should return `false`.
   */
  propagateKnownState(_knownState: StateSet): boolean {
    return false;
  }

  /**
   * Returns the current error for this constraint. (OK if it's negative.)
   * If this constraint owns a variable whose state is not constrained,
   * ignore the corresponding value in `variableValues` and instead set
   * the value of that variable to make the error equal to zero.
   */
  abstract getError(
    handlePositions: Position[],
    variableValues: number[],
    knownState: StateSet,
    constrainedState: StateSet
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
    return new ManipulationSet({
      xs: this.handles,
      ys: this.handles,
      vars: this.variables,
    });
  }
}

export function variable(value = 0): Variable {
  return new Variable(value);
}

export function constant(
  variable: Variable,
  value: number = variable.value
): AddConstraintResult<never> {
  return addConstraint(
    new ConstraintKeyGenerator('constant', [], [[variable]]),
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
    super([], [variable], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addVar(this.variable);
  }

  propagateKnownState(knownState: StateSet): boolean {
    if (!knownState.hasVar(this.variable)) {
      this.variable.value = this.value;
      knownState.addVar(this.variable);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], _values: number[]): number {
    throw new Error('Constant.getError() should never be called!');
  }

  onClash(constraint: this): AddConstraintResult<never>;
  onClash(value: number): AddConstraintResult<never>;
  onClash(constraintOrValue: this | number): AddConstraintResult<never> {
    this.value =
      constraintOrValue instanceof Constant
        ? constraintOrValue.value
        : constraintOrValue;
    return this.toAddConstraintResult();
  }
}

export function equals(a: Variable, b: Variable): AddConstraintResult<never> {
  return addConstraint(
    new ConstraintKeyGenerator('equals', [], [[a, b]]),
    keyGenerator => new Equals(a, b, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

class Equals extends Constraint<never> {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [a, b], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addVar(this.a);
    constrainedState.addVar(this.b);
  }

  propagateKnownState(knownState: StateSet): boolean {
    if (!knownState.hasVar(this.a) && knownState.hasVar(this.b)) {
      this.a.value = this.b.value;
      knownState.addVar(this.a);
      return true;
    } else if (knownState.hasVar(this.a) && !knownState.hasVar(this.b)) {
      this.b.value = this.a.value;
      knownState.addVar(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], values: number[]) {
    const [aValue, bValue] = values;
    return aValue - bValue;
  }

  onClash(): AddConstraintResult<never> {
    return this.toAddConstraintResult();
  }
}

/** a = b + c */
export function sum(
  a: Variable,
  b: Variable,
  c: Variable
): AddConstraintResult<never> {
  return addConstraint(
    new ConstraintKeyGenerator('sum', [], [[a], [b, c]]),
    keyGenerator => new Sum(a, b, c, keyGenerator),
    existingConstraint => existingConstraint.onClash(a, b, c)
  );
}

class Sum extends Constraint<never> {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    readonly c: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [a, b, c], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addVar(this.a);
    constrainedState.addVar(this.b);
    constrainedState.addVar(this.c);
  }

  propagateKnownState(knownState: StateSet): boolean {
    if (
      !knownState.hasVar(this.a) &&
      knownState.hasVar(this.b) &&
      knownState.hasVar(this.c)
    ) {
      this.a.value = this.b.value + this.c.value;
      knownState.addVar(this.a);
      return true;
    } else if (
      knownState.hasVar(this.a) &&
      !knownState.hasVar(this.b) &&
      knownState.hasVar(this.c)
    ) {
      this.b.value = this.a.value - this.c.value;
      knownState.addVar(this.b);
      return true;
    } else if (
      knownState.hasVar(this.a) &&
      knownState.hasVar(this.b) &&
      !knownState.hasVar(this.c)
    ) {
      this.c.value = this.a.value - this.b.value;
      knownState.addVar(this.c);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], [aValue, bValue, cValue]: number[]) {
    return aValue - (bValue + cValue);
  }

  onClash(a: Variable, b: Variable, c: Variable): AddConstraintResult<never>;
  onClash(newerConstraint: this): AddConstraintResult<never>;
  onClash(
    _newerConstraintOrA: this | Variable,
    _b?: Variable,
    _c?: Variable
  ): AddConstraintResult<never> {
    // TODO: implement this
    throw new Error('TODO');
  }
}

export function pin(
  handle: Handle,
  pos: Position = handle.position
): AddConstraintResult<never> {
  return addConstraint(
    new ConstraintKeyGenerator('pin', [[handle]], []),
    keyGenerator => new Pin(handle, pos, keyGenerator),
    existingConstraint => existingConstraint.onClash(pos)
  );
}

class Pin extends Constraint<never> {
  constructor(
    private readonly handle: Handle,
    public position: Position,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle], [], keyGenerator);
  }

  readonly ownedVariables = {};

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addX(this.handle);
    constrainedState.addY(this.handle);
  }

  propagateKnownState(knownState: StateSet): boolean {
    if (!knownState.hasX(this.handle) || !knownState.hasY(this.handle)) {
      this.handle.position = this.position;
      knownState.addX(this.handle);
      knownState.addY(this.handle);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], _values: number[]): number {
    throw new Error('Pin.getError() should never be called!');
  }

  onClash(constraint: this): AddConstraintResult<never>;
  onClash(position: Position): AddConstraintResult<never>;
  onClash(constraintOrPosition: this | Position): AddConstraintResult<never> {
    this.position =
      constraintOrPosition instanceof Pin
        ? constraintOrPosition.position
        : constraintOrPosition;
    return this.toAddConstraintResult();
  }
}

export function horizontal(a: Handle, b: Handle): AddConstraintResult<never> {
  const ay = property(a, 'y').variables.variable;
  const by = property(b, 'y').variables.variable;
  return equals(ay, by);
}

export function vertical(a: Handle, b: Handle): AddConstraintResult<never> {
  const ax = property(a, 'x').variables.variable;
  const bx = property(b, 'x').variables.variable;
  return equals(ax, bx);
}

export function distance(
  a: Handle,
  b: Handle
): AddConstraintResult<'distance'> {
  return addConstraint(
    new ConstraintKeyGenerator('distance', [[a, b]], []),
    keyGenerator => new Distance(a, b, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

export function equalDistance(
  a1: Handle,
  a2: Handle,
  b1: Handle,
  b2: Handle
): AddConstraintResult<never> {
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
      [a, b],
      [new Variable(Vec.dist(a.position, b.position))],
      keyGenerator
    );
  }

  readonly ownedVariables = { distance: this.distance };

  get distance() {
    return this.variables[0];
  }

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addX(this.a);
    constrainedState.addY(this.a);
    constrainedState.addX(this.b);
    constrainedState.addY(this.b);
  }

  getError(
    [aPos, bPos]: Position[],
    [length]: number[],
    _knownState: StateSet,
    constrainedState: StateSet
  ): number {
    const currDist = Vec.dist(aPos, bPos);
    if (!constrainedState.hasVar(this.distance)) {
      this.distance.value = currDist;
      return 0;
    } else {
      return currDist - length;
    }
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
    new ConstraintKeyGenerator('angle', [[a, b]], []),
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
      [a, b],
      [new Variable(Vec.angle(Vec.sub(b.position, a.position)))],
      keyGenerator
    );
  }

  readonly ownedVariables = { angle: this.angle };

  get angle() {
    return this.variables[0];
  }

  addConstrainedState(constrainedState: StateSet): void {
    constrainedState.addX(this.a);
    constrainedState.addY(this.a);
    constrainedState.addX(this.b);
    constrainedState.addY(this.b);
  }

  getError(
    [aPos, bPos]: Position[],
    [angle]: number[],
    knownState: StateSet,
    constrainedState: StateSet
  ): number {
    // The old way, which has problems b/c errors are in terms of angles.
    // const currentAngle = Vec.angle(Vec.sub(bPos, aPos));
    // return (currentAngle - angle) * 100;

    // The new way, implemented in terms of the minimum amount of displacement
    // required to satisfy the constraint.

    if (!constrainedState.hasVar(this.angle)) {
      this.angle.value = Vec.angle(Vec.sub(this.b.position, this.a.position));
      return 0;
    }

    const r = Vec.dist(bPos, aPos);
    let error = Infinity;

    if (!knownState.hasX(this.b) && !knownState.hasY(this.b)) {
      const x = aPos.x + r * Math.cos(angle);
      const y = aPos.y + r * Math.sin(angle);
      error = Math.min(error, Vec.dist(bPos, { x, y }));
    } else if (!knownState.hasX(this.b)) {
      const x = aPos.x + (bPos.y - aPos.y) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - bPos.x));
    } else if (!knownState.hasY(this.b)) {
      const y = aPos.y + (bPos.x - aPos.x) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - bPos.y));
    }

    if (!knownState.hasX(this.a) && !knownState.hasY(this.a)) {
      const x = bPos.x + r * Math.cos(angle + Math.PI);
      const y = bPos.y + r * Math.sin(angle + Math.PI);
      error = Math.min(error, Vec.dist(aPos, { x, y }));
    } else if (!knownState.hasX(this.a)) {
      const x = bPos.x + (aPos.y - bPos.y) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - aPos.x));
    } else if (!knownState.hasY(this.b)) {
      const y = bPos.y + (aPos.x - bPos.x) * Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(y - aPos.y));
    }

    if (!Number.isFinite(error)) {
      // We can't move anything, but we'll ignore that and return a "reasonable" error.
      // (This gets better results than returning zero.)

      error = Math.min(
        // error we'd get from moving b to satisfy the constraint
        Vec.dist(bPos, {
          x: aPos.x + r * Math.cos(angle),
          y: aPos.y + r * Math.sin(angle),
        }),
        // error we'd get from moving a to satisfy the constraint
        Vec.dist(aPos, {
          x: bPos.x + r * Math.cos(angle + Math.PI),
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

export function property(handle: Handle, property: 'x' | 'y') {
  return addConstraint(
    new ConstraintKeyGenerator('property-' + property, [[handle]], []),
    keyGenerator => new Property(handle, property, keyGenerator),
    existingConstraint => existingConstraint.onClash()
  );
}

class Property extends Constraint<'variable'> {
  constructor(
    public readonly handle: Handle,
    public property: 'x' | 'y',
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle], [new Variable(handle.position[property])], keyGenerator);
  }

  readonly ownedVariables = { variable: this.variable };

  get variable() {
    return this.variables[0];
  }

  addConstrainedState(constrainedState: StateSet): void {
    if (this.property === 'x') {
      constrainedState.addX(this.handle);
    } else {
      constrainedState.addY(this.handle);
    }
  }

  propagateKnownState(knownState: StateSet): boolean {
    switch (this.property) {
      case 'x':
        if (!knownState.hasX(this.handle) && knownState.hasVar(this.variable)) {
          this.handle.position = {
            x: this.variable.value,
            y: this.handle.position.y,
          };
          knownState.addX(this.handle);
          return true;
        } else if (
          knownState.hasX(this.handle) &&
          !knownState.hasVar(this.variable)
        ) {
          this.variable.value = this.handle.position.x;
          knownState.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      case 'y':
        if (!knownState.hasY(this.handle) && knownState.hasVar(this.variable)) {
          this.handle.position = {
            x: this.handle.position.x,
            y: this.variable.value,
          };
          knownState.addY(this.handle);
          return true;
        } else if (
          knownState.hasY(this.handle) &&
          !knownState.hasVar(this.variable)
        ) {
          this.variable.value = this.handle.position.y;
          knownState.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      default:
        throw new Error('unsupported property ' + this.property);
    }
  }

  getError(
    [handlePos]: Position[],
    [varValue]: number[],
    _knownState: StateSet,
    constrainedState: StateSet
  ) {
    const currValue = handlePos[this.property];
    if (!constrainedState.hasVar(this.variable)) {
      this.variable.value = currValue;
      return 0;
    } else {
      return currValue - varValue;
    }
  }

  getManipulationSet(): ManipulationSet {
    const handles = this.handles.map(h => h.canonicalInstance);
    return new ManipulationSet({
      xs: this.property === 'x' ? handles : [],
      ys: this.property === 'y' ? handles : [],
      vars: this.variables,
    });
  }

  onClash(): AddConstraintResult<'variable'>;
  onClash(that: this): AddConstraintResult<'variable'>;
  onClash(that?: this): AddConstraintResult<'variable'> {
    if (that && this.variable !== that.variable) {
      const eq = equals(this.variable, that.variable);
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

export function formula(
  args: Variable[],
  fn: (xs: number[]) => number
): AddConstraintResult<'result'> {
  const result = new Variable(fn(args.map(arg => arg.value)));
  return addConstraint(
    new ConstraintKeyGenerator('formula#' + generateId(), [], []),
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
    super([], [...args, result], keyGenerator);
  }

  readonly ownedVariables = { result: this.result };

  addConstrainedState(constrainedState: StateSet): void {
    for (const arg of this.args) {
      constrainedState.addVar(arg);
    }
  }

  propagateKnownState(knownState: StateSet): boolean {
    if (
      !knownState.hasVar(this.result) &&
      this.args.every(arg => knownState.hasVar(arg))
    ) {
      this.result.value = this.computeResult();
      knownState.addVar(this.result);
      return true;
    } else {
      return false;
    }
  }

  getError(
    _handlePositions: Position[],
    variableValues: number[],
    _knownState: StateSet,
    constrainedState: StateSet
  ): number {
    const currValue = this.computeResult(variableValues);
    if (!constrainedState.hasVar(this.result)) {
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

  pin(handle: Handle, pos: Position = handle.position) {
    return captureNewConstraints(tempConstraints, () => pin(handle, pos));
  },
};

// #endregion temporary constraints

// #region debugging

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allConstraints = Constraint.all;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allVariables = Variable.all;

// #endregion debugging
