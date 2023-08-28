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

  get value() {
    return this._value;
  }

  set value(newValue: number) {
    this._value = newValue;
    if (this.info.isCanonical) {
      for (const child of this.info.absorbedVariables) {
        child.value = newValue;
      }
    }
  }

  absorb(that: Variable) {
    if (!this.info.isCanonical) {
      this.info.canonicalInstance.absorb(that);
      return;
    }

    if (that.info.isCanonical) {
      for (const otherVariable of that.info.absorbedVariables) {
        this.absorb(otherVariable);
      }
      that.info = { isCanonical: false, canonicalInstance: this };
    } else {
      (
        that.info.canonicalInstance.info as CanonicalVariableInfo
      ).absorbedVariables.delete(that);
      that.info.canonicalInstance = this;
    }

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

  _clustersForSolver = new Set();

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

  for (let constraints of clusters) {
    let variables: Set<Variable>;
    ({ constraints, variables } =
      getDedupedConstraintsAndVariables(constraints));
    const handles = getHandlesIn(constraints);
    const things = [...variables, ...handles];
    _clustersForSolver?.add({
      constraints,
      things,
    });
  }

  console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

function getDedupedConstraintsAndVariables(constraints: Constraint[]) {
  let constraintByKey = new Map<string, Constraint>();
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

  constraints = Array.from(constraintByKey.values());

  const variables = dedupVariables(constraints);

  // Now discard VariableEqualsConstraints and variables that were "adopted" by other variables.
  constraints = constraints.filter(
    constraint => !(constraint instanceof VariableEqualsConstraint)
  );

  // ... and get rid of constraints that are now duplicates because of adoped variables.
  constraintByKey = new Map<string, Constraint>();
  for (const constraint of constraints) {
    constraintByKey.set(
      constraint.getKeyWithDedupedHandlesAndVars(),
      constraint
    );
  }
  constraints = Array.from(constraintByKey.values());

  return { constraints, variables };
}

function dedupVariables(constraints: Constraint[]) {
  // Gather all of the constrained variables.
  const variables = new Set<Variable>();
  for (const constraint of constraints) {
    for (const variable of constraint.variables) {
      variables.add(variable);
    }
  }

  // This is there the deduping happens.
  for (const constraint of constraints) {
    if (constraint instanceof VariableEqualsConstraint) {
      const { a, b } = constraint;
      a.absorb(b);
    }
  }
  for (const variable of variables) {
    if (!variable.info.isCanonical) {
      variables.delete(variable);
    }
  }

  return variables;
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
        variable = variable.canonicalInstance;
        const vi = varIdx.get(variable);
        return vi === undefined ? variable.value : currState[vi];
      });
      error += Math.pow(constraint.getError(positions, values), 2);
    }
    return error;
  }

  const oldError = computeTotalError(inputs);

  try {
    const result = numeric.uncmin(computeTotalError, inputs);
    if (result.f > oldError) {
      console.log(':(');
      return;
    }

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
      knowns
    );
    SVG.showStatus('' + e);
    // throw e;
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

// TODO: think about return value -- it's not so useful when onClash() happens
// b/c you cannot get to the new vars, etc.
function addConstraint<C extends Constraint>(
  keyGenerator: ConstraintKeyGenerator,
  createNew: (keyGenerator: ConstraintKeyGenerator) => C,
  onClash: (olderConstraint: C) => void
): C {
  let constraint = findConstraint<C>(keyGenerator.key);
  if (constraint) {
    onClash(constraint);
  } else {
    constraint = createNew(keyGenerator);
  }
  return constraint;
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
    variableValues: number[]
  ): number;

  abstract onClash(newerConstraint: this): void;

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

export function fixedValue(variable: Variable, value: number = variable.value) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedValue', [], [[variable]]),
    keyGenerator => new FixedValueConstraint(variable, value, keyGenerator),
    olderConstraint => olderConstraint.onClash(value)
  );
}

class FixedValueConstraint extends Constraint {
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

  getError(_positions: Position[], values: number[]) {
    const [currentValue] = values;
    return currentValue - this.value;
  }

  onClash(newerConstraintOrValue: this | number) {
    this.value =
      newerConstraintOrValue instanceof FixedValueConstraint
        ? newerConstraintOrValue.value
        : newerConstraintOrValue;
  }
}

export function variableEquals(a: Variable, b: Variable) {
  return addConstraint(
    new ConstraintKeyGenerator('variableEquals', [], [[a, b]]),
    keyGenerator => new VariableEqualsConstraint(a, b, keyGenerator),
    _olderConstraint => {}
  );
}

class VariableEqualsConstraint extends Constraint {
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

  onClash(_newerConstraint: this) {
    // no op
  }
}

/** a = b + c */
export function variablePlus(a: Variable, b: Variable, c: Variable) {
  return addConstraint(
    new ConstraintKeyGenerator('variablePlus', [], [[a, b, c]]),
    keyGenerator => new VariablePlusConstraint(a, b, c, keyGenerator),
    olderConstraint => olderConstraint.onClash(a, b, c)
  );
}

class VariablePlusConstraint extends Constraint {
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

  getError(_positions: Position[], values: number[]) {
    const [aValue, bValue, cValue] = values;
    return aValue - (bValue + cValue);
  }

  onClash(a: Variable, b: Variable, c: Variable): void;
  onClash(newerConstraint: this): void;
  onClash(_newerConstraintOrA: this | Variable, _b?: Variable, _c?: Variable) {
    // TODO: implement this
    throw new Error('TODO');
  }
}

export function fixedPosition(handle: Handle, pos: Position = handle.position) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedPosition', [[handle]], []),
    keyGenerator => new FixedPositionConstraint(handle, pos, keyGenerator),
    olderConstraint => olderConstraint.onClash(pos)
  );
}

class FixedPositionConstraint extends Constraint {
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

  getError(positions: Position[], _values: number[]) {
    const [handlePos] = positions;
    return Vec.dist(handlePos, this.position);
  }

  onClash(newerConstraintOrPosition: this | Position) {
    this.position =
      newerConstraintOrPosition instanceof FixedPositionConstraint
        ? newerConstraintOrPosition.position
        : newerConstraintOrPosition;
  }
}

export function horizontal(a: Handle, b: Handle) {
  return addConstraint(
    new ConstraintKeyGenerator('horizontal', [[a, b]], []),
    keyGenerator => new HorizontalConstraint(a, b, keyGenerator),
    _olderConstraint => {}
  );
}

class HorizontalConstraint extends Constraint {
  constructor(
    private readonly a: Handle,
    private readonly b: Handle,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.hasY(this.a) && knowns.hasY(this.b)) {
      this.a.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.addY(this.a);
      return true;
    } else if (knowns.hasY(this.a) && !knowns.hasY(this.b)) {
      this.b.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.addY(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(positions: Position[], _values: number[]) {
    const [aPos, bPos] = positions;
    return aPos.y - bPos.y;
  }

  onClash(_newerConstraint: this) {
    // no op
  }
}

export function vertical(a: Handle, b: Handle) {
  return addConstraint(
    new ConstraintKeyGenerator('vertical', [[a, b]], []),
    keyGenerator => new VerticalConstraint(a, b, keyGenerator),
    _olderConstraint => {}
  );
}

class VerticalConstraint extends Constraint {
  constructor(
    private readonly a: Handle,
    private readonly b: Handle,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.hasX(this.a) && knowns.hasX(this.b)) {
      this.a.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.addX(this.a);
      return true;
    } else if (knowns.hasX(this.a) && !knowns.hasX(this.b)) {
      this.b.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.addX(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(positions: Position[], _values: number[]) {
    const [aPos, bPos] = positions;
    return aPos.x - bPos.x;
  }

  onClash(_newerConstraint: this) {
    // no op
  }
}

export function length(a: Handle, b: Handle, length?: Variable) {
  return addConstraint(
    new ConstraintKeyGenerator('length', [[a, b]], []),
    keyGenerator => {
      if (!length) {
        length = new Variable(Vec.dist(a.position, b.position));
      }
      return new LengthConstraint(a, b, length, keyGenerator);
    },
    olderConstraint => {
      if (length) {
        olderConstraint.onClash(length);
      }
    }
  );
}

class LengthConstraint extends Constraint {
  constructor(
    public readonly a: Handle,
    public readonly b: Handle,
    public readonly length: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a, b], [length], keyGenerator);
  }

  getError(positions: Position[], values: number[]): number {
    const [aPos, bPos] = positions;
    const [length] = values;
    return Vec.dist(aPos, bPos) - length;
  }

  onClash(newerConstraintOrLength: this | Variable) {
    const thatLength =
      newerConstraintOrLength instanceof LengthConstraint
        ? newerConstraintOrLength.length
        : newerConstraintOrLength;
    variableEquals(this.length, thatLength);
  }
}

export function angle(
  a1: Handle,
  a2: Handle,
  b1: Handle,
  b2: Handle,
  angle?: Variable
) {
  return addConstraint(
    new ConstraintKeyGenerator('angle', [[a1, a2, b1, b2]], []),
    keyGenerator => {
      if (!angle) {
        angle = new Variable(
          computeAngle(a1.position, a2.position, b1.position, b2.position) ?? 0
        );
      }
      return new AngleConstraint(a1, a2, b1, b2, angle, keyGenerator);
    },
    olderConstraint => {
      if (angle) {
        olderConstraint.onClash(a1, a2, b1, b2, angle);
      }
    }
  );
}

class AngleConstraint extends Constraint {
  constructor(
    public readonly a1: Handle,
    public readonly a2: Handle,
    public readonly b1: Handle,
    public readonly b2: Handle,
    public readonly angle: Variable,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([a1, a2, b1, b2], [angle], keyGenerator);
  }

  // private element: SVGElement | null = null;

  getError(positions: Position[], values: number[]): number {
    const [a1Pos, a2Pos, b1Pos, b2Pos] = positions;
    const [angle] = values;
    const currentAngle = computeAngle(a1Pos, a2Pos, b1Pos, b2Pos);
    const error = currentAngle === null ? 0 : (currentAngle - angle) * 100;
    // if (!this.element || !this.element.parentElement) {
    //   this.element = SVG.now('text', {
    //     x: 20,
    //     y: window.innerHeight - 5,
    //     content: `ca = ${currentAngle}, e = ${error}`,
    //   });
    // } else {
    //   SVG.update(this.element, {
    //     content: `ca = ${currentAngle}, e = ${error}`,
    //   });
    // }
    return error;
  }

  onClash(newerConstraint: this): void;
  onClash(
    a1: Handle,
    a2: Handle,
    b1: Handle,
    b2: Handle,
    angle: Variable
  ): void;
  onClash(
    newerConstraintOrA1: this | Handle,
    a2?: Handle,
    b1?: Handle,
    b2?: Handle,
    angle?: Variable
  ) {
    let a1: Handle;
    if (newerConstraintOrA1 instanceof AngleConstraint) {
      ({ a1, a2, b1, b2, angle } = newerConstraintOrA1);
    } else {
      a1 = newerConstraintOrA1;
    }

    if (this.a1 === a1 && this.a2 === a2 && this.b1 === b1 && this.b2 === b2) {
      // exactly the same thing!
      variableEquals(this.angle, angle!);
    } else {
      // same points but different order
      const thatAngle =
        computeAngle(a1.position, a2!.position, b1!.position, b2!.position) ??
        0;
      const diff = new Variable(this.angle.value - thatAngle);
      fixedValue(diff);
      variablePlus(this.angle, angle!, diff);
    }
  }
}

export function computeAngle(
  a1Pos: Position,
  a2Pos: Position,
  b1Pos: Position,
  b2Pos: Position
): number | null {
  const va = Vec.sub(a2Pos, a1Pos);
  const vb = Vec.sub(b2Pos, b1Pos);
  return Vec.len(va) < 1 || Vec.len(vb) < 1
    ? null
    : Vec.angleBetweenClockwise(va, vb);
}

// TODO: PropertyPickerConstraint
// (handle: Handle, property: 'x' | 'y', variable: Variable)
