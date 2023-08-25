import numeric from 'numeric';
import { Position } from '../lib/types';
import { generateId } from '../lib/helpers';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import Selection from './Selection';

class Variable {
  static readonly all: Variable[] = [];

  readonly id = generateId();

  constructor(public value: number = 0) {
    Variable.all.push(this);
  }
}

let allConstraints: Constraint[] = [];

// #region constraints for solver

let _constraintsForSolver: Constraint[] | null = null;

function getConstraintsForSolver() {
  if (_constraintsForSolver) {
    return _constraintsForSolver;
  }

  const constraintByKey = new Map<string, Constraint>();
  const constraintsToProcess = allConstraints.slice();
  while (constraintsToProcess.length > 0) {
    const constraint = constraintsToProcess.shift()!;
    const key = constraint.getKeyWithCanonicalHandleIds();
    const matchingConstraint = constraintByKey.get(key);
    if (matchingConstraint) {
      temporarilyMakeNewConstraintsGoInto(constraintsToProcess, () =>
        matchingConstraint.onClash(constraint)
      );
    } else {
      constraintByKey.set(key, constraint);
    }
  }

  _constraintsForSolver = Array.from(constraintByKey.values());
  console.log('constraints', allConstraints);
  console.log('for solver', _constraintsForSolver);
  return _constraintsForSolver;
}

function forgetConstraintsForSolver() {
  _constraintsForSolver = null;
}

export function onHandlesReconfigured() {
  forgetConstraintsForSolver();
}

// #endregion constraints for solver

/**
 * Calls `fn`, and if that results in the creation of new constraints,
 * they will go into `dest` instead of `allConstraints`.
 */
function temporarilyMakeNewConstraintsGoInto(
  dest: Constraint[],
  fn: () => void
) {
  // When new constraints are created, they normally go into `allConstraints`.
  // The creation of new constraints also makes us forget the set of
  // constraints that we've cached for use w/ the solver (`_constraintsForSolver`).
  // So first, we need to save both of those things.
  const constraintsForSolver = _constraintsForSolver;
  const realAllConstraints = allConstraints;

  // Now we temporarily make `dest` be `allConstraints`, so that new constraints
  // will go where we want.
  allConstraints = dest;
  try {
    fn();
  } finally {
    // Now that `fn` is done, restore things to the way they were before.
    allConstraints = realAllConstraints;
    _constraintsForSolver = constraintsForSolver;
  }
}

// #region solving

interface Knowns {
  xs: Set<Handle>;
  ys: Set<Handle>;
  variables: Set<Variable>;
}

export function solve(selection: Selection) {
  const constraintsForSolver = getConstraintsForSolver();
  const oldNumConstraints = constraintsForSolver.length;

  // We temporarily add fixed position constraints for each selected handle.
  // This is the "finger of God" semantics that we've talked about.
  temporarilyMakeNewConstraintsGoInto(constraintsForSolver, () => {
    for (const handle of selection.handles) {
      fixedPosition(handle);
    }
  });

  try {
    minimizeError(constraintsForSolver);
  } finally {
    // Remove the temporary fixed position constraints that we added to
    // `constraintsForSolver`.
    constraintsForSolver.length = oldNumConstraints;
  }
}

function minimizeError(constraints: Constraint[]) {
  const things = [...Variable.all, ...Handle.all];
  const knowns = computeKnowns(constraints);

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like fixed position
  // and fixed value constraints.
  const inputs: number[] = [];
  const varIdx = new Map<Variable, number>();
  const xIdx = new Map<Handle, number>();
  const yIdx = new Map<Handle, number>();
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.variables.has(thing)) {
      varIdx.set(thing, inputs.length);
      inputs.push(thing.value);
    } else if (thing instanceof Handle) {
      if (!knowns.xs.has(thing)) {
        xIdx.set(thing, inputs.length);
        inputs.push(thing.position.x);
      }
      if (!knowns.ys.has(thing)) {
        yIdx.set(thing, inputs.length);
        inputs.push(thing.position.y);
      }
    }
  }

  // This is where we actually run the solver.
  const result = numeric.uncmin((currState: number[]) => {
    let error = 0;
    for (const constraint of constraints) {
      const positions = constraint.handles.map(handle => {
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
        const vi = varIdx.get(variable);
        return vi === undefined ? variable.value : currState[vi];
      });
      error += Math.pow(constraint.getError(positions, values), 2);
    }
    return error;
  }, inputs);

  // Now we write the solution from the solver back into our handles and variables.
  const outputs = result.solution;
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.variables.has(thing)) {
      thing.value = outputs.shift()!;
    } else if (thing instanceof Handle) {
      const knowX = knowns.xs.has(thing);
      const knowY = knowns.ys.has(thing);
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
  const knowns: Knowns = {
    xs: new Set(),
    ys: new Set(),
    variables: new Set(),
  };
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
    private readonly variableGroups: Variable[][],
    private readonly constantGroups: number[][]
  ) {
    this.key = this.generateKey();
  }

  getKeyWithCanonicalHandleIds() {
    return this.generateKey(true);
  }

  private generateKey(useCanonicalHandleIds = false) {
    const handleIdGroups = this.handleGroups
      .map(handleGroup =>
        handleGroup
          .map(handle => (useCanonicalHandleIds ? handle.id : handle.ownId))
          .sort()
          .join(',')
      )
      .map(handleIdGroup => `[${handleIdGroup}]`);
    const variableIdGroups = this.variableGroups
      .map(variableGroup =>
        variableGroup
          .map(variable => variable.id)
          .sort()
          .join(',')
      )
      .map(variableIdGroup => `[${variableIdGroup}]`);
    const constantGroups = this.constantGroups
      .map(constantGroup => constantGroup.sort().join(','))
      .map(constantGroup => `[${constantGroup}]`);
    return `${this.type}(${handleIdGroups},${variableIdGroups},${constantGroups})`;
  }
}

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
    public readonly constants: number[],
    private readonly keyGenerator: ConstraintKeyGenerator
  ) {
    allConstraints.push(this);
    forgetConstraintsForSolver();
  }

  remove() {
    const idx = allConstraints.indexOf(this);
    if (idx >= 0) {
      allConstraints.splice(idx, 1);
      forgetConstraintsForSolver();
    }
  }

  get key() {
    return this.keyGenerator.key;
  }

  getKeyWithCanonicalHandleIds() {
    return this.keyGenerator.getKeyWithCanonicalHandleIds();
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
      ? this.variables.includes(thing)
      : this.handles.some(
          cHandle => cHandle.canonicalInstance === thing.canonicalInstance
        );
  }
}

export function fixedValue(variable: Variable, value: number = variable.value) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedValue', [], [[variable]], []),
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
    super([], [variable], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.variables.has(this.variable)) {
      this.variable.value = this.value;
      knowns.variables.add(this.variable);
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

/** a = b + k */
export function variableEquals(a: Variable, b: Variable, k = 0) {
  return addConstraint(
    new ConstraintKeyGenerator('variableEquals', [], [[a, b]], [[k]]),
    keyGenerator => new VariableEqualsConstraint(a, b, k, keyGenerator),
    _olderConstraint => {}
  );
}

class VariableEqualsConstraint extends Constraint {
  constructor(
    private readonly a: Variable,
    private readonly b: Variable,
    private readonly k: number,
    keyGenerator: ConstraintKeyGenerator
  ) {
    super([], [a, b], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.variables.has(this.a) && knowns.variables.has(this.b)) {
      this.a.value = this.b.value + this.k;
      knowns.variables.add(this.a);
      return true;
    } else if (knowns.variables.has(this.a) && !knowns.variables.has(this.b)) {
      this.b.value = this.a.value - this.k;
      knowns.variables.add(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], values: number[]) {
    const [aValue, bValue] = values;
    return aValue - (bValue + this.k);
  }

  onClash(_newerConstraint: this) {
    // no op
  }
}

export function fixedPosition(handle: Handle, pos: Position = handle.position) {
  return addConstraint(
    new ConstraintKeyGenerator('fixedPosition', [[handle]], [], []),
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
    super([handle], [], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.xs.has(this.handle) || !knowns.ys.has(this.handle)) {
      this.handle.position = this.position;
      knowns.xs.add(this.handle);
      knowns.ys.add(this.handle);
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
    new ConstraintKeyGenerator('horizontal', [[a, b]], [], []),
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
    super([a, b], [], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.ys.has(this.a) && knowns.ys.has(this.b)) {
      this.a.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.ys.add(this.a);
      return true;
    } else if (knowns.ys.has(this.a) && !knowns.ys.has(this.b)) {
      this.b.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.ys.add(this.b);
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
    new ConstraintKeyGenerator('vertical', [[a, b]], [], []),
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
    super([a, b], [], [], keyGenerator);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.xs.has(this.a) && knowns.xs.has(this.b)) {
      this.a.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.xs.add(this.a);
      return true;
    } else if (knowns.xs.has(this.a) && !knowns.xs.has(this.b)) {
      this.b.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.xs.add(this.b);
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
    new ConstraintKeyGenerator('length', [[a, b]], [], []),
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
    super([a, b], [length], [], keyGenerator);
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
    new ConstraintKeyGenerator(
      'angle',
      [
        [a1, a2],
        [b1, b2],
      ],
      [],
      []
    ),
    keyGenerator => {
      if (!angle) {
        angle = new Variable(
          AngleConstraint.computeAngle(
            a1.position,
            a2.position,
            b1.position,
            b2.position
          ) ?? 0
        );
      }
      return new AngleConstraint(a1, a2, b1, b2, angle, keyGenerator);
    },
    _olderConstraint => {
      throw new Error('TODO');
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
    super([a1, a2, b1, b2], [angle], [], keyGenerator);
  }

  getError(positions: Position[], values: number[]): number {
    const [a1Pos, a2Pos, b1Pos, b2Pos] = positions;
    const [angle] = values;
    const currentAngle = AngleConstraint.computeAngle(
      a1Pos,
      a2Pos,
      b1Pos,
      b2Pos
    );
    return currentAngle === null ? angle : currentAngle - angle;
  }

  onClash(_newerConstraint: this): void {
    throw new Error('TODO');
  }

  static computeAngle(
    a1Pos: Position,
    a2Pos: Position,
    b1Pos: Position,
    b2Pos: Position
  ): number | null {
    const va = Vec.sub(a2Pos, a1Pos);
    const vb = Vec.sub(b2Pos, b1Pos);
    return Vec.len(va) < 5 || Vec.len(vb) < 5
      ? null
      : Vec.angleBetweenClockwise(va, vb);
  }
}
