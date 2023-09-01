import { minimize } from '../lib/g9';
import { Position } from '../lib/types';
import { generateId } from '../lib/helpers';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import Selection from './Selection';
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

class Variable {
  static readonly all: Variable[] = [];

  readonly id = generateId();

  info: VariableInfo = {
    isCanonical: true,
    absorbedVariables: new Set(),
  };

  constructor(private _value: number = 0) {
    Variable.all.push(this);
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

let allConstraints: Constraint[] = [];

// stuff for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allConstraints = allConstraints;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).allVariables = Variable.all;

// #region constraint and thing clusters for solver

// A group of constraints (and things that they operate on) that should be solved together.
interface ClusterForSolver {
  constraints: Constraint[];
  variables: Variable[];
  handles: Handle[];
  handleGetsXFrom: Map<Handle, Variable>;
  handleGetsYFrom: Map<Handle, Variable>;
  // constrainedState: StateSet;
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
  for (const constraint of allConstraints) {
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
      const {
        constraints,
        variables,
        handleGetsXFrom,
        handleGetsYFrom,
        // constrainedState,
      } = getDedupedConstraintsAndVariables(cluster.constraints);
      return {
        constraints,
        variables,
        handles: getHandlesIn(constraints),
        handleGetsXFrom,
        handleGetsYFrom,
        // constrainedState,
      };
    })
  );

  // for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clusters = _clustersForSolver;

  console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

// TODO: this function works, but it's gross. Refactor.
function getDedupedConstraintsAndVariables(constraints: Constraint[]) {
  // console.log('orig constraints', constraints);
  let result: Omit<ClusterForSolver, 'handles'> | null = null;
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
  const constraintsToProcess = constraints.slice();
  while (constraintsToProcess.length > 0) {
    const constraint = constraintsToProcess.shift()!;
    const key = constraint.getKeyWithDedupedHandlesAndVars();
    const matchingConstraint = constraintByKey.get(key);
    if (matchingConstraint) {
      // console.log('clash!', key, constraint, matchingConstraint);
      temporarilyMakeNewConstraintsGoInto(constraintsToProcess, () =>
        matchingConstraint.onClash(constraint)
      );
    } else {
      constraintByKey.set(key, constraint);
    }
  }
  return Array.from(constraintByKey.values());
}

function dedupVariables(constraints: Constraint[]) {
  // Gather all of the constrained variables.
  const variables = new Set<Variable>();
  for (const constraint of constraints) {
    for (const variable of constraint.variables) {
      variables.add(variable);
    }
  }

  // Dedup variables based on VariableEquals
  const handleGetsXFrom = new Map<Handle, Variable>();
  const handleGetsYFrom = new Map<Handle, Variable>();
  let idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof VariableEquals)) {
      idx++;
      continue;
    }

    const { a, b } = constraint;
    a.absorb(b);
    constraints.splice(idx, 1);

    for (const c of constraints) {
      if (c instanceof PropertyPicker && c.variable.canonicalInstance === a) {
        (c.property === 'x' ? handleGetsXFrom : handleGetsYFrom).set(
          c.handle.canonicalInstance,
          a
        );
      }
    }
  }

  // Here's another kind of deduping that we can do for variables: when
  // we have VariablePlus(a, b, c) and FixedValue(c), variable a can absorb
  // b w/ an "offset" of c. (There's a lot more that we could do here, this
  // is just an initial experiment.)
  idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof VariablePlus)) {
      idx++;
      continue;
    }

    const { a, b, c: k } = constraint;
    const fixedValue = constraints.find(
      c =>
        c instanceof FixedValue &&
        c.variable.canonicalInstance === k.canonicalInstance
    ) as FixedValue;
    a.absorb(b, fixedValue.value);
    constraints.splice(idx, 1);
  }

  // Now discard variables that were absorbed by other variables.
  for (const variable of variables) {
    if (!variable.info.isCanonical) {
      variables.delete(variable);
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
 * they will go into `dest` instead of `allConstraints`.
 */
function temporarilyMakeNewConstraintsGoInto(
  dest: Constraint[],
  fn: () => void
) {
  // When new constraints are created, they normally go into `allConstraints`.
  // The creation of new constraints also makes us forget the set of clusters
  // of related constraints and things that we've cached for use w/ the solver
  // (`_clustersForSolver`). So first, we need to save both of those things.
  const clustersForSolver = _clustersForSolver;
  const realAllConstraints = allConstraints;

  // Now we temporarily make `dest` be `allConstraints`, so that new constraints
  // will go where we want.
  allConstraints = dest;
  try {
    fn();
  } finally {
    // Now that `fn` is done, restore things to the way they were before.
    allConstraints = realAllConstraints;
    _clustersForSolver = clustersForSolver;
  }
}

// #region solving

class StateSet {
  private readonly xs = new Set<Handle>();
  private readonly ys = new Set<Handle>();
  private readonly vars = new Set<Variable>();

  hasX(handle: Handle) {
    return this.xs.has(handle.canonicalInstance);
  }

  hasY(handle: Handle) {
    return this.ys.has(handle.canonicalInstance);
  }

  hasVar(variable: Variable) {
    return this.vars.has(variable.canonicalInstance);
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
      vars: Array.from(this.vars).map(v => ({ id: v.id, value: v.value })),
      xs: Array.from(this.xs).map(h => ({ id: h.id, x: h.position.x })),
      ys: Array.from(this.ys).map(h => ({ id: h.id, y: h.position.y })),
    };
  }
}

export function solve(selection: Selection) {
  const clusters = getClustersForSolver();
  for (const cluster of clusters) {
    solveCluster(selection, cluster);
  }
}

function solveCluster(selection: Selection, cluster: ClusterForSolver) {
  const oldNumConstraints = cluster.constraints.length;

  if (cluster.constraints.length === 0) {
    // nothing to solve!
    return;
  }

  // We temporarily add fixed position constraints for each selected handle.
  // This is the "finger of God" semantics that we've talked about.
  temporarilyMakeNewConstraintsGoInto(cluster.constraints, () => {
    for (const handle of selection.handles) {
      fixedPosition(handle);
    }
  });

  try {
    minimizeError(cluster);
  } finally {
    // Remove the temporary fixed position constraints that we added to `constraints`.
    cluster.constraints.length = oldNumConstraints;
  }
}

function minimizeError({
  constraints,
  variables,
  handles,
  handleGetsXFrom,
  handleGetsYFrom,
}: ClusterForSolver) {
  const knowns = computeKnowns(constraints);

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like fixed position
  // and fixed value constraints.
  const inputs: number[] = [];
  const inputDescriptions: string[] = [];
  const varIdx = new Map<Variable, number>();
  for (const variable of variables) {
    if (!knowns.hasVar(variable)) {
      varIdx.set(variable, inputs.length);
      inputs.push(variable.value);
      inputDescriptions.push(`var ${variable.id}`);
    }
  }
  const xIdx = new Map<Handle, number>();
  const yIdx = new Map<Handle, number>();
  for (const handle of handles) {
    if (knowns.hasX(handle)) {
      // no op
    } else if (handleGetsXFrom.has(handle)) {
      xIdx.set(handle, varIdx.get(handleGetsXFrom.get(handle)!)!);
    } else {
      xIdx.set(handle, inputs.length);
      inputs.push(handle.position.x);
      inputDescriptions.push(`x ${handle.id}`);
    }

    if (knowns.hasY(handle)) {
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
      if (
        constraint instanceof FixedValue ||
        constraint instanceof FixedPosition
      ) {
        // Ignore -- these guys already did their job in propagateKnowns().
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
      error += Math.pow(constraint.getError(positions, values, knowns), 2);
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
      'and knowns',
      knowns.toJSON()
    );
    SVG.showStatus('' + e);
    throw e;
  }

  // SVG.showStatus(`${result.iterations} iterations`);

  // Now we write the solution from the solver back into our variables and handles.
  const outputs = result.solution;
  for (const variable of variables) {
    if (!knowns.hasVar(variable)) {
      variable.value = outputs.shift()!;
    }
  }
  for (const handle of handles) {
    const x = knowns.hasX(handle)
      ? handle.position.x
      : handleGetsXFrom.has(handle)
      ? handleGetsXFrom.get(handle)!.value
      : outputs.shift()!;
    const y = knowns.hasY(handle)
      ? handle.position.y
      : handleGetsYFrom.has(handle)
      ? handleGetsYFrom.get(handle)!.value
      : outputs.shift()!;
    handle.position = { x, y };
  }
}

function computeKnowns(constraints: Constraint[]) {
  const knowns = new StateSet();
  while (true) {
    let didSomething = false;
    for (const constraint of constraints) {
      if (constraint.propagateKnowns(knowns)) {
        didSomething = true;
      }
    }
    if (!didSomething) {
      break;
    }
  }
  return knowns;
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

/**
 * Returns a constraint and a list of variables.
 * If there is no clash with an existing constraint, the constraint returned will be new,
 * and the variables will be that constraint's variables. Otherwise, the constraint
 * returned will be the existing constraint, but the variables will be that variables
 * that the new constraint would have had. The idea is that you can further constrain
 * those variables if you want.
 */
function addConstraint<C extends Constraint>(
  keyGenerator: ConstraintKeyGenerator,
  createNew: (keyGenerator: ConstraintKeyGenerator) => C,
  onClash: (olderConstraint: C) => Variable[]
): { constraint: C; variables: Variable[] } {
  let constraint = allConstraints.find(
    constraint => constraint.key === keyGenerator.key
  ) as C | undefined;
  let variables: Variable[];
  if (constraint) {
    variables = onClash(constraint);
  } else {
    constraint = createNew(keyGenerator);
    variables = constraint.variables;
  }
  return { constraint, variables };
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

abstract class Constraint {
  constructor(
    public readonly handles: Handle[],
    public readonly variables: Variable[],
    private readonly keyGenerator: ConstraintKeyGenerator
  ) {
    allConstraints.push(this);
    forgetClustersForSolver();
  }

  remove() {
    const idx = allConstraints.indexOf(this);
    if (idx >= 0) {
      allConstraints.splice(idx, 1);
      forgetClustersForSolver();
    }
  }

  get key() {
    return this.keyGenerator.key;
  }

  getKeyWithDedupedHandlesAndVars() {
    return this.keyGenerator.getKeyWithDedupedHandlesAndVars();
  }

  /**
   * If this constraint can determine the values of any xs, ys, or variables
   * based on other things that are already known, it should set the values
   * of those things, add them to the `knowns` object, and return `true`.
   * Otherwise, it should return `false`.
   */
  propagateKnowns(_knowns: StateSet): boolean {
    return false;
  }

  /** Returns the current error for this constraint. (OK if it's negative.) */
  abstract getError(
    handlePositions: Position[],
    variableValues: number[],
    knowns: StateSet
  ): number;

  abstract onClash(newerConstraint: this): Variable[];

  getManipulationSet(): ManipulationSet {
    return new ManipulationSet({
      xs: this.handles,
      ys: this.handles,
      vars: this.variables,
    });
  }
}

export function variable(value = 0) {
  return new Variable(value);
}

export function fixedValue(variable: Variable, value: number = variable.value) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedValue', [], [[variable]]),
    keyGenerator => new FixedValue(variable, value, keyGenerator),
    olderConstraint => olderConstraint.onClash(value)
  );
}

class FixedValue extends Constraint {
  constructor(
    public readonly variable: Variable,
    public value: number,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [variable], keyGenerator);
  }

  propagateKnowns(knowns: StateSet): boolean {
    if (!knowns.hasVar(this.variable)) {
      this.variable.value = this.value;
      knowns.addVar(this.variable);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], _values: number[]): number {
    throw new Error('FixedValueConstraint.getError() should never be called!');
  }

  onClash(newerConstraintOrValue: this | number) {
    this.value =
      newerConstraintOrValue instanceof FixedValue
        ? newerConstraintOrValue.value
        : newerConstraintOrValue;
    return this.variables;
  }
}

export function variableEquals(a: Variable, b: Variable) {
  return addConstraint(
    new ConstraintKeyGenerator('variableEquals', [], [[a, b]]),
    keyGenerator => new VariableEquals(a, b, keyGenerator),
    olderConstraint => olderConstraint.onClash(a, b)
  );
}

class VariableEquals extends Constraint {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [a, b], keyGenerator);
  }

  propagateKnowns(knowns: StateSet): boolean {
    if (!knowns.hasVar(this.a) && knowns.hasVar(this.b)) {
      this.a.value = this.b.value;
      knowns.addVar(this.a);
      return true;
    } else if (knowns.hasVar(this.a) && !knowns.hasVar(this.b)) {
      this.b.value = this.a.value;
      knowns.addVar(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], values: number[]) {
    const [aValue, bValue] = values;
    return aValue - bValue;
  }

  onClash(newerConstraint: this): Variable[];
  onClash(a: Variable, b: Variable): Variable[];
  onClash(_newerConstraintOrA: this | Variable, _b?: Variable) {
    // no op
    return this.variables;
  }
}

/** a = b + c */
export function variablePlus(a: Variable, b: Variable, c: Variable) {
  return addConstraint(
    new ConstraintKeyGenerator('variablePlus', [], [[a, b, c]]),
    keyGenerator => new VariablePlus(a, b, c, keyGenerator),
    olderConstraint => olderConstraint.onClash(a, b, c)
  );
}

class VariablePlus extends Constraint {
  constructor(
    readonly a: Variable,
    readonly b: Variable,
    readonly c: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [a, b, c], keyGenerator);
  }

  propagateKnowns(knowns: StateSet): boolean {
    if (
      !knowns.hasVar(this.a) &&
      knowns.hasVar(this.b) &&
      knowns.hasVar(this.c)
    ) {
      this.a.value = this.b.value + this.c.value;
      knowns.addVar(this.a);
      return true;
    } else if (
      knowns.hasVar(this.a) &&
      !knowns.hasVar(this.b) &&
      knowns.hasVar(this.c)
    ) {
      this.b.value = this.a.value - this.c.value;
      knowns.addVar(this.b);
      return true;
    } else if (
      knowns.hasVar(this.a) &&
      knowns.hasVar(this.b) &&
      !knowns.hasVar(this.c)
    ) {
      this.c.value = this.a.value - this.b.value;
      knowns.addVar(this.c);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], [aValue, bValue, cValue]: number[]) {
    return aValue - (bValue + cValue);
  }

  onClash(a: Variable, b: Variable, c: Variable): Variable[];
  onClash(newerConstraint: this): Variable[];
  onClash(
    _newerConstraintOrA: this | Variable,
    _b?: Variable,
    _c?: Variable
  ): Variable[] {
    // TODO: implement this
    throw new Error('TODO');
  }
}

export function fixedPosition(handle: Handle, pos: Position = handle.position) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedPosition', [[handle]], []),
    keyGenerator => new FixedPosition(handle, pos, keyGenerator),
    olderConstraint => olderConstraint.onClash(pos)
  );
}

class FixedPosition extends Constraint {
  constructor(
    private readonly handle: Handle,
    public position: Position,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle], [], keyGenerator);
  }

  propagateKnowns(knowns: StateSet): boolean {
    if (!knowns.hasX(this.handle) || !knowns.hasY(this.handle)) {
      this.handle.position = this.position;
      knowns.addX(this.handle);
      knowns.addY(this.handle);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], _values: number[]): number {
    throw new Error(
      'FixedPositionConstraint.getError() should never be called!'
    );
  }

  onClash(newerConstraintOrPosition: this | Position): Variable[] {
    this.position =
      newerConstraintOrPosition instanceof FixedPosition
        ? newerConstraintOrPosition.position
        : newerConstraintOrPosition;
    return this.variables;
  }
}

export function horizontal(a: Handle, b: Handle) {
  const ay = property(a, 'y').constraint.variable;
  const by = property(b, 'y').constraint.variable;
  return variableEquals(ay, by);
}

export function vertical(a: Handle, b: Handle) {
  const ax = property(a, 'x').constraint.variable;
  const bx = property(b, 'x').constraint.variable;
  return variableEquals(ax, bx);
}

export function length(a: Handle, b: Handle) {
  return addConstraint(
    new ConstraintKeyGenerator('length', [[a, b]], []),
    keyGenerator => {
      return new Length(a, b, keyGenerator);
    },
    olderConstraint => olderConstraint.onClash()
  );
}

class Length extends Constraint {
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

  get length() {
    return this.variables[0];
  }

  getError([aPos, bPos]: Position[], [length]: number[]): number {
    return Vec.dist(aPos, bPos) - length;
  }

  onClash(newerConstraint?: this): Variable[] {
    if (newerConstraint) {
      variableEquals(this.length, newerConstraint.length);
      return [newerConstraint.length];
    } else {
      return this.variables;
    }
  }
}

export function angle(a1: Handle, a2: Handle) {
  return addConstraint(
    new ConstraintKeyGenerator('angle', [[a1, a2]], []),
    keyGenerator => new Angle(a1, a2, keyGenerator),
    olderConstraint => olderConstraint.onClash(a1, a2)
  );
}

class Angle extends Constraint {
  constructor(
    public readonly a1: Handle,
    public readonly a2: Handle,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super(
      [a1, a2],
      [new Variable(Vec.angle(Vec.sub(a2.position, a1.position)))],
      keyGenerator
    );
  }

  get angle() {
    return this.variables[0];
  }

  getError(
    [a1Pos, a2Pos]: Position[],
    [angle]: number[],
    knowns: StateSet
  ): number {
    // The old way, which has problems b/c errors are in terms of angles.
    // const currentAngle = Vec.angle(Vec.sub(a2Pos, a1Pos));
    // return (currentAngle - angle) * 100;

    // The new way, implemented in terms of the minimum amount of displacement
    // required to satisfy the constraint.

    const r = Vec.dist(a2Pos, a1Pos);
    let error = Infinity;

    if (!knowns.hasX(this.a2) && !knowns.hasY(this.a2)) {
      const x = a1Pos.x + r * Math.cos(angle);
      const y = a1Pos.y + r * Math.sin(angle);
      error = Math.min(error, Vec.dist(a2Pos, { x, y }));
    } else if (!knowns.hasX(this.a2)) {
      const x = a1Pos.x + (a2Pos.y - a1Pos.y) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - a2Pos.x));
    } else if (!knowns.hasY(this.a2)) {
      const y = a1Pos.y + (a2Pos.x - a1Pos.x) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - a2Pos.y));
    }

    if (!knowns.hasX(this.a1) && !knowns.hasY(this.a1)) {
      const x = a2Pos.x + r * Math.cos(angle + Math.PI);
      const y = a2Pos.y + r * Math.sin(angle + Math.PI);
      error = Math.min(error, Vec.dist(a1Pos, { x, y }));
    } else if (!knowns.hasX(this.a1)) {
      const x = a2Pos.x + (a1Pos.y - a2Pos.y) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - a1Pos.x));
    } else if (!knowns.hasY(this.a2)) {
      const y = a2Pos.y + (a1Pos.x - a2Pos.x) * Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(y - a1Pos.y));
    }

    if (!Number.isFinite(error)) {
      // Can't move anything, but we'll return error that we'd get from moving a2.
      // (This gets better results than returning zero.)
      const x = a2Pos.x + r * Math.cos(angle + Math.PI);
      const y = a2Pos.y + r * Math.sin(angle + Math.PI);
      error = Vec.dist(a1Pos, { x, y });
    }

    return error;
  }

  onClash(newerConstraint: this): Variable[];
  onClash(a1: Handle, a2: Handle): Variable[];
  onClash(newerConstraintOrA1: this | Handle, a2?: Handle) {
    let a1: Handle, angle: Variable | undefined;
    if (newerConstraintOrA1 instanceof Angle) {
      ({ a1, a2, angle } = newerConstraintOrA1);
    } else {
      a1 = newerConstraintOrA1;
      a2 = a2!; // help the type checker understand that this is not undefined
    }

    if (this.a1 === a1 && this.a2 === a2) {
      // exactly the same thing!
      if (angle) {
        variableEquals(this.angle, angle);
      } else {
        angle = this.angle;
      }
    } else {
      // same points but different order
      if (!angle) {
        angle = new Variable(Vec.angle(Vec.sub(a2.position, a1.position)));
      }
      const diff = new Variable(this.angle.value - angle.value);
      fixedValue(diff);
      variablePlus(this.angle, angle, diff);
    }

    return [angle];
  }
}

export function property(handle: Handle, property: 'x' | 'y') {
  return addConstraint(
    new ConstraintKeyGenerator('property-' + property, [[handle]], []),
    keyGenerator => new PropertyPicker(handle, property, keyGenerator),
    olderConstraint => olderConstraint.onClash()
  );
}

class PropertyPicker extends Constraint {
  constructor(
    public readonly handle: Handle,
    public property: 'x' | 'y',
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle], [new Variable(handle.position[property])], keyGenerator);
  }

  get variable() {
    return this.variables[0];
  }

  propagateKnowns(knowns: StateSet): boolean {
    switch (this.property) {
      case 'x':
        if (!knowns.hasX(this.handle) && knowns.hasVar(this.variable)) {
          this.handle.position = {
            x: this.variable.value,
            y: this.handle.position.y,
          };
          knowns.addX(this.handle);
          return true;
        } else if (knowns.hasX(this.handle) && !knowns.hasVar(this.variable)) {
          this.variable.value = this.handle.position.x;
          knowns.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      case 'y':
        if (!knowns.hasY(this.handle) && knowns.hasVar(this.variable)) {
          this.handle.position = {
            x: this.handle.position.x,
            y: this.variable.value,
          };
          knowns.addY(this.handle);
          return true;
        } else if (knowns.hasY(this.handle) && !knowns.hasVar(this.variable)) {
          this.variable.value = this.handle.position.y;
          knowns.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      default:
        throw new Error('unsupported property ' + this.property);
    }
  }

  getError([handlePos]: Position[], [varValue]: number[]) {
    return handlePos[this.property] - varValue;
  }

  getManipulationSet(): ManipulationSet {
    const handles = this.handles.map(h => h.canonicalInstance);
    return new ManipulationSet({
      xs: this.property === 'x' ? handles : [],
      ys: this.property === 'y' ? handles : [],
      vars: this.variables,
    });
  }

  onClash(): Variable[];
  onClash(newerConstraint: this): Variable[];
  onClash(newerConstraint?: this) {
    if (newerConstraint && this.variable !== newerConstraint.variable) {
      variableEquals(this.variable, newerConstraint.variable);
      return newerConstraint.variables;
    } else {
      return this.variables;
    }
  }
}
