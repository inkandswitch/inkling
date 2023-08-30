import numeric from 'numeric';
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

    for (const otherVariable of that.info.absorbedVariables) {
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

type Thing = Handle | Variable;

// A group of constraints (and things that they operate on) that should be solved together.
interface ClusterForSolver {
  constraints: Constraint[];
  things: Thing[];
}

let _clustersForSolver: Set<ClusterForSolver> | null = null;

function getClustersForSolver(): Set<ClusterForSolver> {
  if (_clustersForSolver) {
    return _clustersForSolver;
  }

  for (const variable of Variable.all) {
    variable.resetInfo();
  }

  const clusters = new Set<Constraint[]>();
  for (const c of allConstraints) {
    const clustersToMerge: Constraint[][] = [];
    for (const cluster of clusters) {
      if (cluster.some(constraint => constraint.operatesOnSameThingAs(c))) {
        clusters.delete(cluster);
        clustersToMerge.push(cluster);
      }
    }
    const newCluster = clustersToMerge.flat();
    newCluster.push(c);
    clusters.add(newCluster);
  }

  _clustersForSolver = new Set(
    Array.from(clusters).map(cluster => {
      const { constraints, variables } =
        getDedupedConstraintsAndVariables(cluster);
      const handles = getHandlesIn(constraints);
      const things = [...variables, ...handles];
      return {
        constraints,
        things,
      };
    })
  );

  console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

function getDedupedConstraintsAndVariables(constraints: Constraint[]) {
  // console.log('orig constraints', constraints);
  while (true) {
    const oldNumConstraints = constraints.length;
    const result = dedupVariables(dedupConstraints(constraints));
    // console.log('new len', result.constraints.length, 'old', oldNumConstraints);
    if (result.constraints.length === oldNumConstraints) {
      return result;
    } else {
      constraints = result.constraints;
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

  // Dedup variables based on VariableEqualsConstraints
  let idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (constraint instanceof VariableEquals) {
      const { a, b } = constraint;
      a.absorb(b);
      // console.log(a.id, 'absorbed', b.id);
      constraints.splice(idx, 1);
    } else {
      idx++;
    }
  }

  // Here's another kind of deduping that we can do for variables: when
  // we have VariablePlusConstraint(a, b, c) and FixedValueConstraint(c),
  // variable a can absorb b w/ an "offset" of c. (There's a lot more that
  // we could do here, this is just an initial experiment.)
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
        c.variables[0].canonicalInstance === k.canonicalInstance
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

  return { variables, constraints };
}

function getHandlesIn(constraints: Constraint[]) {
  const handles = new Set<Handle>();
  for (const constraint of constraints) {
    for (const handle of constraint.handles) {
      handles.add(handle.canonicalInstance);
    }
  }
  return handles;
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

class Knowns {
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
    solveCluster(selection, cluster.constraints, cluster.things);
  }
}

function solveCluster(
  selection: Selection,
  constraints: Constraint[],
  things: Thing[]
) {
  const oldNumConstraints = constraints.length;

  if (constraints.length === 0) {
    return;
  }

  // We temporarily add fixed position constraints for each selected handle.
  // This is the "finger of God" semantics that we've talked about.
  temporarilyMakeNewConstraintsGoInto(constraints, () => {
    for (const handle of selection.handles) {
      fixedPosition(handle);
    }
  });

  try {
    minimizeError(constraints, things);
  } finally {
    // Remove the temporary fixed position constraints that we added to `constraints`.
    constraints.length = oldNumConstraints;
  }
}

function minimizeError(constraints: Constraint[], things: Thing[]) {
  const knowns = computeKnowns(constraints);

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like fixed position
  // and fixed value constraints.
  const inputs: number[] = [];
  const varIdx = new Map<Variable, number>();
  const xIdx = new Map<Handle, number>();
  const yIdx = new Map<Handle, number>();
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.hasVar(thing)) {
      varIdx.set(thing, inputs.length);
      inputs.push(thing.value);
    } else if (thing instanceof Handle) {
      if (!knowns.hasX(thing)) {
        xIdx.set(thing, inputs.length);
        inputs.push(thing.position.x);
      }
      if (!knowns.hasY(thing)) {
        yIdx.set(thing, inputs.length);
        inputs.push(thing.position.y);
      }
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

  let result: ReturnType<typeof numeric.uncmin>;
  try {
    result = numeric.uncmin(computeTotalError, inputs);
  } catch (e) {
    console.log(
      'minimizeError threw',
      e,
      'while working on cluster with',
      constraints,
      things,
      'with inputs',
      inputs,
      'and knowns',
      knowns.toJSON()
    );
    SVG.showStatus('' + e);
    // throw e;
    return;
  }

  // SVG.showStatus(`${result.iterations} iterations`);

  // Now we write the solution from the solver back into our handles and variables.
  const outputs = result.solution;
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.hasVar(thing)) {
      thing.value = outputs.shift()!;
    } else if (thing instanceof Handle) {
      const knowX = knowns.hasX(thing);
      const knowY = knowns.hasY(thing);
      if (knowX && knowY) {
        // no update required
        continue;
      }

      const x = knowX ? thing.position.x : outputs.shift()!;
      const y = knowY ? thing.position.y : outputs.shift()!;
      thing.position = { x, y };
    }
  }
}

function computeKnowns(constraints: Constraint[]) {
  const knowns = new Knowns();
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
  let constraint = findConstraint<C>(keyGenerator.key);
  let variables: Variable[];
  if (constraint) {
    variables = onClash(constraint);
  } else {
    constraint = createNew(keyGenerator);
    variables = constraint.variables;
  }
  return { constraint, variables };
}

function findConstraint<C extends Constraint>(key: string) {
  return allConstraints.find(constraint => constraint.key === key) as
    | C
    | undefined;
}

// #endregion adding constraints

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
  propagateKnowns(_knowns: Knowns): boolean {
    return false;
  }

  /** Returns the current error for this constraint. (OK if it's negative.) */
  abstract getError(
    handlePositions: Position[],
    variableValues: number[],
    knowns: Knowns
  ): number;

  abstract onClash(newerConstraint: this): Variable[];

  involves(thing: Variable | Handle): boolean {
    return thing instanceof Variable
      ? this.variables.some(
          cVar => cVar.canonicalInstance === thing.canonicalInstance
        )
      : this.handles.some(
          cHandle => cHandle.canonicalInstance === thing.canonicalInstance
        );
  }

  operatesOnSameThingAs(that: Constraint) {
    for (const handle of this.handles) {
      if (that.involves(handle)) {
        return true;
      }
    }
    for (const variable of this.variables) {
      if (that.involves(variable)) {
        return true;
      }
    }
    return false;
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
    private readonly variable: Variable,
    public value: number,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [variable], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
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

  propagateKnowns(knowns: Knowns): boolean {
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

  propagateKnowns(knowns: Knowns): boolean {
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

  propagateKnowns(knowns: Knowns): boolean {
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

export function length(
  a: Handle,
  b: Handle,
  length = new Variable(Vec.dist(a.position, b.position))
) {
  return addConstraint(
    new ConstraintKeyGenerator('length', [[a, b]], []),
    keyGenerator => {
      return new Length(a, b, length, keyGenerator);
    },
    olderConstraint => olderConstraint.onClash(length)
  );
}

class Length extends Constraint {
  constructor(
    public readonly a: Handle,
    public readonly b: Handle,
    public readonly length: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b], [length], keyGenerator);
  }

  getError([aPos, bPos]: Position[], [length]: number[]): number {
    return Vec.dist(aPos, bPos) - length;
  }

  onClash(newerConstraintOrLength: this | Variable): Variable[] {
    const thatLength =
      newerConstraintOrLength instanceof Length
        ? newerConstraintOrLength.length
        : newerConstraintOrLength;
    variableEquals(this.length, thatLength);
    return [thatLength];
  }
}

export function angle(
  a1: Handle,
  a2: Handle,
  angle = new Variable(Vec.angle(Vec.sub(a2.position, a1.position)))
) {
  return addConstraint(
    new ConstraintKeyGenerator('angle', [[a1, a2]], []),
    keyGenerator => new Angle(a1, a2, angle, keyGenerator),
    olderConstraint => olderConstraint.onClash(a1, a2, angle)
  );
}

class Angle extends Constraint {
  constructor(
    public readonly a1: Handle,
    public readonly a2: Handle,
    public readonly angle: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a1, a2], [angle], keyGenerator);
  }

  getError(
    [a1Pos, a2Pos]: Position[],
    [angle]: number[],
    knowns: Knowns
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
  onClash(a1: Handle, a2: Handle, angle: Variable): Variable[];
  onClash(newerConstraintOrA1: this | Handle, a2?: Handle, angle?: Variable) {
    let a1: Handle;
    let thatAngle: Variable;
    if (newerConstraintOrA1 instanceof Angle) {
      ({ a1, a2, angle: thatAngle } = newerConstraintOrA1);
    } else {
      a1 = newerConstraintOrA1;
      thatAngle = angle!;
    }

    if (this.a1 === a1 && this.a2 === a2) {
      // exactly the same thing!
      variableEquals(this.angle, thatAngle);
    } else {
      // same points but different order
      const diff = new Variable(this.angle.value - thatAngle.value);
      fixedValue(diff);
      variablePlus(this.angle, thatAngle, diff);
    }

    return [thatAngle];
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
    private property: 'x' | 'y',
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([handle], [new Variable(handle.position[property])], keyGenerator);
  }

  get variable() {
    return this.variables[0];
  }

  propagateKnowns(knowns: Knowns): boolean {
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
