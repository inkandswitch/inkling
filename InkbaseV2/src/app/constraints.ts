import { GameObject } from './GameObject';
import SVG from './Svg';
import Handle, { aHandle } from './ink/Handle';
import { forDebugging, generateId, sets } from '../lib/helpers';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import { minimize } from '../lib/g9';

// #region variables

type VariableInfo = CanonicalVariableInfo | AbsorbedVariableInfo;

interface CanonicalVariableInfo {
  isCanonical: true;
  absorbedVariables: Set<Variable>;
}

interface AbsorbedVariableInfo {
  isCanonical: false;
  canonicalInstance: Variable;
  // canonicalInstance.value === offset.m * absorbedVariable.value + offset.b
  offset: { m: number; b: number };
}

export class Variable {
  static readonly all = new Set<Variable>();

  static create(value = 0, represents?: { object: object; property: string }) {
    return new Variable(value, represents);
  }

  readonly id = generateId();
  info: VariableInfo = {
    isCanonical: true,
    absorbedVariables: new Set(),
  };
  represents?: { object: object; property: string };

  private constructor(
    private _value: number = 0,
    represents?: { object: object; property: string }
  ) {
    this.represents = represents;
    Variable.all.add(this);
  }

  /** Removes this variable and any constraint that reference it. */
  remove() {
    if (!Variable.all.has(this)) {
      // needed to break cycles
      return;
    }

    Variable.all.delete(this);
    for (const constraint of Constraint.all) {
      if (constraint.variables.includes(this)) {
        // TODO: consider replacing variable w/ a "tombstone"
        constraint.remove();
      }
    }
  }

  get canonicalInstance(): Variable {
    return this.info.isCanonical ? this : this.info.canonicalInstance;
  }

  get offset() {
    return this.info.isCanonical ? { m: 1, b: 0 } : this.info.offset;
  }

  get value() {
    return this._value;
  }

  set value(newValue: number) {
    if (this.info.isCanonical) {
      this._value = newValue;
      for (const that of this.info.absorbedVariables) {
        const { m, b } = (that.info as AbsorbedVariableInfo).offset;
        that._value = (newValue - b) / m;
      }
    } else {
      this.info.canonicalInstance.value = this.toCanonicalValue(newValue);
    }
  }

  toCanonicalValue(value: number) {
    if (this.info.isCanonical) {
      return value;
    }

    const { m, b } = this.info.offset;
    return m * value + b;
  }

  // y.makeEqualTo(x, { m, b }) ==> y = m * x + b
  makeEqualTo(that: Variable, offset = { m: 1, b: 0 }) {
    if (this === that) {
      return;
    } else if (!this.info.isCanonical) {
      const { m: mThat, b: bThat } = offset;
      const { m: mThis, b: bThis } = this.offset;
      // this = mThat * that + bThat
      // this.CI = mThis * (mThat * that + bThat) + bThis
      // this.CI = mthis * mThat * that + mThis * bThat + bThis
      this.canonicalInstance.makeEqualTo(that, {
        m: mThis * mThat,
        b: mThis * bThat + bThis,
      });
      return;
    } else if (!that.info.isCanonical) {
      const { m: mThat, b: bThat } = that.offset;
      const { m, b } = offset;
      // that.CI = mThat * that + bThat  ==>  that = (that.CI - bThat) / mThat
      // this = m * that + b
      // this = m * (that.CI - bThat) / mThat + b = m / mThat * that.CI + b - bThat / mThat
      this.makeEqualTo(that.canonicalInstance, {
        m: m / mThat,
        b: b - bThat / mThat,
      });
      return;
    }

    const thatLockConstraint = that.lockConstraint;

    for (const otherVariable of that.info.absorbedVariables) {
      otherVariable.value = this.value;
      const otherVariableInfo = otherVariable.info as AbsorbedVariableInfo;
      otherVariableInfo.canonicalInstance = this;
      // m1 * (m2 * x + b2) + b1 = m1 * m2 * x + m1 * b2 + b1
      otherVariableInfo.offset = {
        m: offset.m * otherVariableInfo.offset.m,
        b: offset.m * otherVariableInfo.offset.b + offset.b,
      };
      this.info.absorbedVariables.add(otherVariable);
    }

    that.value = this.value;
    that.info = {
      isCanonical: false,
      canonicalInstance: this,
      offset: offset,
    };
    this.info.absorbedVariables.add(that);

    if (thatLockConstraint) {
      thatLockConstraint.remove();
      this.lock();
    }
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

  lock(value?: number) {
    constant(
      this.canonicalInstance,
      value !== undefined ? this.toCanonicalValue(value) : undefined
    );
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

export const variable = Variable.create;

// #endregion variables

// #region low-level constraints

abstract class LowLevelConstraint {
  readonly variables = [] as Variable[];
  readonly ownVariables = new Set<Variable>();

  /**
   * Add this constraint to the list of constraints. In case of clashes,
   * implementations of this method should not add this constraint. They should
   * instead create linear relationships between variables so that the behavior
   * of this constraint is maintained w/o duplication, which results in poorly-
   * behaved gradients.
   */
  abstract addTo(constraints: LowLevelConstraint[]): void;

  /**
   * If this constraint can determine the values of any variables based on
   * other state that is already known, it should set the values of those
   * variables and add them to `knowns`.
   */
  propagateKnowns(_knowns: Set<Variable>) {}

  /**
   * Returns the current error for this constraint. (OK if it's negative.)
   * If this constraint owns a "free" variable, i.e., one  whose value can be
   * determined locally, ignore the corresponding value in `variableValues` and
   * instead set the value of that variable to make the error equal to zero.
   */
  abstract getError(
    variableValues: number[],
    knowns: Set<Variable>,
    freeVariables: Set<Variable>
  ): number;
}

class Distance extends LowLevelConstraint {
  constructor(
    constraint: Constraint,
    public readonly a: Handle,
    public readonly b: Handle
  ) {
    super();
    this.variables.push(
      variable(Vec.dist(a.position, b.position), {
        object: constraint,
        property: 'distance',
      }),
      a.xVariable,
      a.yVariable,
      b.xVariable,
      b.yVariable
    );
    this.ownVariables.add(this.distance);
  }

  get distance() {
    return this.variables[0];
  }

  addTo(constraints: LowLevelConstraint[]) {
    for (const that of constraints) {
      if (!(that instanceof Distance)) {
        continue;
      }

      if (
        (handlesAreEqual(this.a, that.a) && handlesAreEqual(this.b, that.b)) ||
        (handlesAreEqual(this.a, that.b) && handlesAreEqual(this.b, that.a))
      ) {
        that.distance.makeEqualTo(this.distance);
        return;
      }
    }

    constraints.push(this);
  }

  propagateKnowns(knowns: Set<Variable>): void {
    if (
      !(
        knowns.has(this.a.xVariable.canonicalInstance) &&
        knowns.has(this.a.yVariable.canonicalInstance) &&
        knowns.has(this.b.xVariable.canonicalInstance) &&
        knowns.has(this.b.yVariable.canonicalInstance)
      )
    ) {
      return;
    }

    this.distance.value = Vec.dist(this.a, this.b);
    knowns.add(this.distance.canonicalInstance);
  }

  getError(
    [dist, ax, ay, bx, by]: number[],
    _knowns: Set<Variable>,
    freeVariables: Set<Variable>
  ): number {
    const aPos = { x: ax, y: ay };
    const bPos = { x: bx, y: by };
    const currDist = Vec.dist(aPos, bPos);
    if (freeVariables.has(this.distance.canonicalInstance)) {
      this.distance.value = currDist;
    }
    return currDist - dist;
  }
}

class Angle extends LowLevelConstraint {
  constructor(
    constraint: Constraint,
    public readonly a: Handle,
    public readonly b: Handle
  ) {
    super();
    this.variables.push(
      variable(Vec.angle(Vec.sub(b.position, a.position)), {
        object: constraint,
        property: 'distance',
      }),
      a.xVariable,
      a.yVariable,
      b.xVariable,
      b.yVariable
    );
    this.ownVariables.add(this.angle);
  }

  get angle() {
    return this.variables[0];
  }

  addTo(constraints: LowLevelConstraint[]) {
    for (const that of constraints) {
      if (!(that instanceof Angle)) {
        continue;
      }

      if (handlesAreEqual(this.a, that.a) && handlesAreEqual(this.b, that.b)) {
        that.angle.makeEqualTo(this.angle);
        return;
      }

      if (handlesAreEqual(this.a, that.b) && handlesAreEqual(this.b, that.a)) {
        that.angle.makeEqualTo(this.angle, { m: 1, b: Math.PI });
        return;
      }
    }

    constraints.push(this);
  }

  propagateKnowns(knowns: Set<Variable>): void {
    if (
      !(
        knowns.has(this.a.xVariable.canonicalInstance) &&
        knowns.has(this.a.yVariable.canonicalInstance) &&
        knowns.has(this.b.xVariable.canonicalInstance) &&
        knowns.has(this.b.yVariable.canonicalInstance)
      )
    ) {
      return;
    }

    this.angle.value = Vec.angle(Vec.sub(this.b, this.a));
    knowns.add(this.angle.canonicalInstance);
  }

  getError(
    [angle, ax, ay, bx, by]: number[],
    knowns: Set<Variable>,
    freeVariables: Set<Variable>
  ): number {
    // The old way, which has problems b/c errors are in terms of angles.
    // const aPos = { x: ax, y: ay };
    // const bPos = { x: bx, y: by };
    // const currAngle = Vec.angle(Vec.sub(bPos, aPos));
    // return (currAngle - angle) * 100;

    // The new way, implemented in terms of the minimum amount of displacement
    // required to satisfy the constraint.

    const aPos = { x: ax, y: ay };
    const bPos = { x: bx, y: by };
    if (freeVariables.has(this.angle.canonicalInstance)) {
      this.angle.value = Vec.angle(Vec.sub(bPos, aPos));
      return 0;
    }

    const r = Vec.dist(bPos, aPos);
    let error = Infinity;

    if (
      !knowns.has(this.b.xVariable.canonicalInstance) &&
      !knowns.has(this.b.yVariable.canonicalInstance)
    ) {
      const x = ax + r * Math.cos(angle);
      const y = ay + r * Math.sin(angle);
      error = Math.min(error, Vec.dist(bPos, { x, y }));
    } else if (!knowns.has(this.b.xVariable.canonicalInstance)) {
      const x = ax + (by - ay) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - bx));
    } else if (!knowns.has(this.b.yVariable.canonicalInstance)) {
      const y = ay + (bx - ax) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - by));
    }

    if (
      !knowns.has(this.a.xVariable.canonicalInstance) &&
      !knowns.has(this.a.yVariable.canonicalInstance)
    ) {
      const x = bx + r * Math.cos(angle + Math.PI);
      const y = by + r * Math.sin(angle + Math.PI);
      error = Math.min(error, Vec.dist(aPos, { x, y }));
    } else if (!knowns.has(this.a.xVariable.canonicalInstance)) {
      const x = bx + (ay - by) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - ax));
    } else if (!knowns.has(this.a.yVariable.canonicalInstance)) {
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
          y: by + r * Math.sin(angle + Math.PI),
        })
      );
    }

    return error;
  }
}

class LLFormula extends LowLevelConstraint {
  readonly result: Variable;

  constructor(
    constraint: Constraint,
    readonly args: Variable[],
    private readonly fn: (xs: number[]) => number
  ) {
    super();
    this.result = variable(this.computeResult(), {
      object: constraint,
      property: 'result',
    });
    this.variables.push(...args, this.result);
    this.ownVariables.add(this.result);
  }

  addTo(constraints: LowLevelConstraint[]) {
    constraints.push(this);
  }

  propagateKnowns(knowns: Set<Variable>) {
    if (
      !knowns.has(this.result.canonicalInstance) &&
      this.args.every(arg => knowns.has(arg.canonicalInstance))
    ) {
      this.result.value = this.computeResult();
      knowns.add(this.result.canonicalInstance);
    }
  }

  getError(
    variableValues: number[],
    _knowns: Set<Variable>,
    freeVariables: Set<Variable>
  ): number {
    const currValue = this.computeResult(variableValues);
    if (freeVariables.has(this.result.canonicalInstance)) {
      this.result.value = currValue;
    }
    return currValue - this.result.value;
  }

  private computeResult(
    xs: number[] = this.args.map(arg => arg.value)
  ): number {
    return this.fn(xs);
  }
}

// #endregion low-level constraints

// #region high-level constraints

export abstract class Constraint {
  static readonly all = new Set<Constraint>();

  paused = false;
  readonly variables = [] as Variable[];
  readonly lowLevelConstraints = [] as LowLevelConstraint[];

  constructor() {
    Constraint.all.add(this);
    forgetClustersForSolver();
  }

  /**
   * In this constraint system, equality is not a constraint but rather a
   * relationship between two variables that is maintained by unifying the two
   * variables. This method should be overridden by constraints that need to
   * set up equalities between variables and/or, more generally, linear
   * relationships between variables. This is done by calling Variable's
   * makeEqualTo() method. E.g., y.makeEqualTo(x, { m: 3, b: 1 }) sets up
   * the linear relationship y = 3 * x + b.
   */
  setUpVariableRelationships() {}

  /**
   * If this constraint can determine the values of any variables based on
   * other state that is already known, it should set the values of those
   * variables and add them to `knowns`.
   *
   * Subclasses may override this method, but should always call
   * super.addKnowns(knowns) at the end!
   */
  propagateKnowns(knowns: Set<Variable>) {
    for (const llc of this.lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
  }

  /** Returns the set of (canonical) variables that are referenced by this constraint. */
  getManipulationSet(): Set<Variable> {
    return new Set(this.variables.map(v => v.canonicalInstance));
  }

  public remove() {
    if (!Constraint.all.has(this)) {
      // needed to break cycles
      return;
    }

    Constraint.all.delete(this);
    for (const llc of this.lowLevelConstraints) {
      for (const v of llc.ownVariables) {
        // this will result in other constraints that involve this variable
        // being removed as well
        v.remove();
      }
    }
    forgetClustersForSolver();
  }
}

class Constant extends Constraint {
  private static readonly memo = new Map<Variable, Constant>();

  static create(variable: Variable, value: number = variable.value) {
    let constant = Constant.memo.get(variable);
    if (constant) {
      constant.value = value;
    } else {
      constant = new Constant(variable, value);
      Constant.memo.set(variable, constant);
    }
    return constant;
  }

  private constructor(
    public readonly variable: Variable,
    public value: number
  ) {
    super();
    this.variables.push(variable);
  }

  propagateKnowns(knowns: Set<Variable>): void {
    if (!knowns.has(this.variable.canonicalInstance)) {
      this.variable.value = this.value;
      knowns.add(this.variable.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }

  public remove() {
    Constant.memo.delete(this.variable);
    super.remove();
  }
}

export const constant = Constant.create;

class Pin extends Constraint {
  private static readonly memo = new Map<Handle, Pin>();

  static create(handle: Handle, position: Position = handle.position) {
    let pin = Pin.memo.get(handle);
    if (pin) {
      pin.position = position;
    } else {
      pin = new Pin(handle, position);
      Pin.memo.set(handle, pin);
    }
    return pin;
  }

  private constructor(
    public readonly handle: Handle,
    public position: Position
  ) {
    super();
    this.variables.push(handle.xVariable, handle.yVariable);
  }

  propagateKnowns(knowns: Set<Variable>): void {
    const { xVariable: x, yVariable: y } = this.handle;
    if (!knowns.has(x.canonicalInstance) || !knowns.has(y.canonicalInstance)) {
      ({ x: x.value, y: y.value } = this.position);
      knowns.add(x.canonicalInstance);
      knowns.add(y.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }

  public remove() {
    Pin.memo.delete(this.handle);
    super.remove();
  }
}

export const pin = Pin.create;

class LinearRelationship extends Constraint {
  private static readonly memo = new Map<
    Variable,
    Map<Variable, LinearRelationship>
  >();

  static create(y: Variable, m: number, x: Variable, b: number) {
    if (m === 0) {
      throw new Error('tried to create a linear relationship w/ m = 0');
    }

    let lr = LinearRelationship.memo.get(y)?.get(x);
    if (lr) {
      lr.m = m;
      lr.b = b;
      return lr;
    }

    lr = LinearRelationship.memo.get(x)?.get(y);
    if (lr) {
      lr.m = 1 / m;
      lr.b = -b / m;
      return lr;
    }

    lr = new LinearRelationship(y, m, x, b);
    if (!LinearRelationship.memo.has(y)) {
      LinearRelationship.memo.set(y, new Map());
    }
    LinearRelationship.memo.get(y)!.set(x, lr);
    return lr;
  }

  private constructor(
    readonly y: Variable,
    private m: number,
    readonly x: Variable,
    private b: number
  ) {
    super();
    this.variables.push(y, x);
  }

  setUpVariableRelationships() {
    this.y.makeEqualTo(this.x, { m: this.m, b: this.b });
  }

  public remove() {
    const yDict = LinearRelationship.memo.get(this.y);
    if (yDict) {
      yDict.delete(this.x);
      if (yDict.size === 0) {
        LinearRelationship.memo.delete(this.y);
      }
    }

    const xDict = LinearRelationship.memo.get(this.x);
    if (xDict) {
      xDict.delete(this.y);
      if (xDict.size === 0) {
        LinearRelationship.memo.delete(this.x);
      }
    }

    super.remove();
  }
}

export const linearRelationship = LinearRelationship.create;

export const equals = (x: Variable, y: Variable) =>
  linearRelationship(y, 1, x, 0);

class Absorb extends Constraint {
  // child handle -> Absorb constraint
  private static readonly memo = new Map<Handle, Absorb>();

  static create(parent: Handle, child: Handle) {
    if (Absorb.memo.has(child)) {
      Absorb.memo.get(child)!.remove();
    }

    const a = new Absorb(parent, child);
    Absorb.memo.set(child, a);
    return a;
  }

  private constructor(
    readonly parent: Handle,
    readonly child: Handle
  ) {
    super();
    this.variables.push(
      parent.xVariable,
      parent.yVariable,
      child.xVariable,
      child.yVariable
    );
  }

  setUpVariableRelationships(): void {
    this.parent.xVariable.makeEqualTo(this.child.xVariable);
    this.parent.yVariable.makeEqualTo(this.child.yVariable);
    this.parent._absorb(this.child);
  }

  public remove() {
    Absorb.memo.delete(this.child);
    super.remove();
  }
}

export const absorb = Absorb.create;

class PolarVector extends Constraint {
  private static readonly memo = new Map<Handle, Map<Handle, PolarVector>>();

  static create(a: Handle, b: Handle) {
    let pv = PolarVector.memo.get(a)?.get(b);
    if (pv) {
      return pv;
    }

    pv = new PolarVector(a, b);
    if (!PolarVector.memo.get(a)) {
      PolarVector.memo.set(a, new Map());
    }
    PolarVector.memo.get(a)!.set(b, pv);
    return pv;
  }

  readonly distance: Variable;
  readonly angle: Variable;

  private constructor(
    readonly a: Handle,
    readonly b: Handle
  ) {
    super();

    const dc = new Distance(this, a, b);
    this.lowLevelConstraints.push(dc);
    this.distance = dc.distance;

    const ac = new Angle(this, a, b);
    this.lowLevelConstraints.push(ac);
    this.angle = ac.angle;

    this.variables.push(
      a.xVariable,
      a.yVariable,
      b.xVariable,
      b.yVariable,
      this.distance,
      this.angle
    );
  }

  public remove() {
    const aDict = PolarVector.memo.get(this.a)!;
    aDict.delete(this.b);
    if (aDict.size === 0) {
      PolarVector.memo.delete(this.a);
    }
    super.remove();
  }
}

export const polarVector = PolarVector.create;

class Formula extends Constraint {
  static create(args: Variable[], fn: (xs: number[]) => number) {
    return new Formula(args, fn);
  }

  readonly result: Variable;

  private constructor(args: Variable[], fn: (xs: number[]) => number) {
    super();
    const fc = new LLFormula(this, args, fn);
    this.lowLevelConstraints.push(fc);
    this.result = fc.result;
    this.variables.push(...args, this.result);
  }
}

export const formula = Formula.create;

// #endregion high-level constraints

// #region solver

/**
 * A group of constraints and variables that they operate on that should be solved together.
 */
interface ClusterForSolver {
  constraints: Constraint[];
  lowLevelConstraints: LowLevelConstraint[];
  variables: Variable[];
  // Set of variables that are "free". The value of each of these variables can be set by
  // their owning low-level constraint's `getError` method in order to make the error due
  // to that constraint equal to zero.
  freeVariables: Set<Variable>;
}

let _clustersForSolver: Set<ClusterForSolver> | null = null;

function getClustersForSolver(root: GameObject): Set<ClusterForSolver> {
  if (_clustersForSolver) {
    return _clustersForSolver;
  }

  // break up all relationships between handles ...
  root.forEach({
    what: aHandle,
    recursive: true,
    do(handle) {
      handle._forgetAbsorbedHandles();
    },
  });
  // ... and variables
  for (const variable of Variable.all) {
    variable.info = { isCanonical: true, absorbedVariables: new Set() };
  }

  // ignore constraints that are paused
  const activeConstraints = [...Constraint.all].filter(
    constraint => !constraint.paused
  );

  // set up updated relationships among handles and variables
  for (const constraint of activeConstraints) {
    constraint.setUpVariableRelationships();
  }

  const clusters = computeClusters(activeConstraints);

  _clustersForSolver = new Set(
    Array.from(clusters).map(({ constraints, lowLevelConstraints }) => {
      const knowns = computeKnowns(constraints, lowLevelConstraints);

      const variables = new Set<Variable>();
      for (const constraint of constraints) {
        for (const variable of constraint.variables) {
          if (!knowns.has(variable.canonicalInstance)) {
            variables.add(variable.canonicalInstance);
          }
        }
      }

      const freeVariableCandidates = new Set<Variable>();
      for (const llc of lowLevelConstraints) {
        for (const variable of llc.ownVariables) {
          if (!knowns.has(variable.canonicalInstance)) {
            freeVariableCandidates.add(variable.canonicalInstance);
          }
        }
      }

      const freeVarCandidateCounts = new Map<Variable, number>();
      for (const llc of lowLevelConstraints) {
        for (const variable of llc.variables) {
          if (!freeVariableCandidates.has(variable.canonicalInstance)) {
            continue;
          }

          const n = freeVarCandidateCounts.get(variable.canonicalInstance) ?? 0;
          freeVarCandidateCounts.set(variable.canonicalInstance, n + 1);
        }
      }

      const freeVariables = new Set<Variable>();
      for (const [variable, count] of freeVarCandidateCounts.entries()) {
        if (count === 1) {
          freeVariables.add(variable.canonicalInstance);
        }
      }

      return {
        constraints,
        lowLevelConstraints,
        variables: Array.from(variables),
        freeVariables,
      };
    })
  );

  forDebugging('clusters', _clustersForSolver);

  // console.log('clusters', _clustersForSolver);
  SVG.showStatus(`${clusters.size} clusters`);

  return _clustersForSolver;
}

function computeClusters(
  activeConstraints: Constraint[]
): Set<ClusterForSolver> {
  interface Cluster {
    constraints: Constraint[];
    lowLevelConstraints: LowLevelConstraint[];
    manipulationSet: Set<Variable>;
  }
  const clusters = new Set<Cluster>();
  for (const constraint of activeConstraints) {
    const constraints = [constraint];
    const lowLevelConstraints = [...constraint.lowLevelConstraints];
    let manipulationSet = constraint.getManipulationSet();
    for (const cluster of clusters) {
      if (!sets.overlap(cluster.manipulationSet, manipulationSet)) {
        continue;
      }

      constraints.push(...cluster.constraints);
      for (const llc of cluster.lowLevelConstraints) {
        llc.addTo(lowLevelConstraints);
      }

      // this step must be done *after* adding the LLCs b/c that operation creates new
      // linear relationships among variables (i.e., variables are absorbed as a result)
      manipulationSet = new Set(
        [...manipulationSet, ...cluster.manipulationSet].map(
          v => v.canonicalInstance
        )
      );

      clusters.delete(cluster);
    }
    clusters.add({ constraints, lowLevelConstraints, manipulationSet });
  }
  return sets.map(clusters, ({ constraints, lowLevelConstraints }) =>
    createClusterForSolver(constraints, lowLevelConstraints)
  );
}

function createClusterForSolver(
  constraints: Constraint[],
  lowLevelConstraints: LowLevelConstraint[]
): ClusterForSolver {
  const knowns = computeKnowns(constraints, lowLevelConstraints);

  const variables = new Set<Variable>();
  for (const constraint of constraints) {
    for (const variable of constraint.variables) {
      if (!knowns.has(variable.canonicalInstance)) {
        variables.add(variable.canonicalInstance);
      }
    }
  }

  const freeVariableCandidates = new Set<Variable>();
  for (const llc of lowLevelConstraints) {
    for (const variable of llc.ownVariables) {
      if (!knowns.has(variable.canonicalInstance)) {
        freeVariableCandidates.add(variable.canonicalInstance);
      }
    }
  }

  const freeVarCandidateCounts = new Map<Variable, number>();
  for (const llc of lowLevelConstraints) {
    for (const variable of llc.variables) {
      if (!freeVariableCandidates.has(variable.canonicalInstance)) {
        continue;
      }

      const n = freeVarCandidateCounts.get(variable.canonicalInstance) ?? 0;
      freeVarCandidateCounts.set(variable.canonicalInstance, n + 1);
    }
  }

  const freeVariables = new Set<Variable>();
  for (const [variable, count] of freeVarCandidateCounts.entries()) {
    if (count === 1) {
      freeVariables.add(variable.canonicalInstance);
    }
  }

  return {
    constraints,
    lowLevelConstraints,
    variables: Array.from(variables),
    freeVariables,
  };
}

function forgetClustersForSolver() {
  _clustersForSolver = null;
}

export function solve(root: GameObject) {
  const clusters = getClustersForSolver(root);
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}

function solveCluster(cluster: ClusterForSolver) {
  const { constraints, lowLevelConstraints, variables, freeVariables } =
    cluster;

  if (constraints.length === 0) {
    // nothing to solve!
    return;
  }

  const knowns = computeKnowns(constraints, lowLevelConstraints);

  // Update any constant constraints whose values were overridden by propagation of knowns.
  // (See `Distance` and `Angle` `propagateKnowns()` for examples of why this is necessary.)
  for (const constraint of constraints) {
    if (
      constraint instanceof Constant &&
      knowns.has(constraint.variable.canonicalInstance)
    ) {
      constraint.value = constraint.variable.value;
    }
  }

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like pin and
  // constant constraints.
  const inputs: number[] = [];
  const varIdx = new Map<Variable, number>();
  for (const variable of variables) {
    if (
      !knowns.has(variable.canonicalInstance) &&
      !freeVariables.has(variable.canonicalInstance)
    ) {
      varIdx.set(variable, inputs.length);
      inputs.push(variable.value);
    }
  }

  // This is where we actually run the solver.

  function computeTotalError(currState: number[]) {
    let error = 0;
    for (const llc of lowLevelConstraints) {
      const values = llc.variables.map(variable => {
        const { m, b } = variable.offset;
        variable = variable.canonicalInstance;
        const vi = varIdx.get(variable);
        return ((vi === undefined ? variable.value : currState[vi]) - b) / m;
      });
      error += Math.pow(llc.getError(values, knowns, freeVariables), 2);
    }
    return error;
  }

  let result: ReturnType<typeof minimize>;
  try {
    result = minimize(computeTotalError, inputs, 1_000, 1e-3);
  } catch (e) {
    console.log(
      'minimizeError threw',
      e,
      'while working on cluster',
      cluster,
      'with knowns',
      knowns
    );
    SVG.showStatus('' + e);
    throw e;
  }

  // SVG.showStatus(`${result.iterations} iterations`);
  forDebugging('solverResult', result);
  forDebugging('solverResultMessages', (messages?: Set<string>) => {
    if (!messages) {
      messages = new Set();
    }
    messages.add(result.message);
    return messages;
  });
  if (!result || result.message?.includes('maxit')) {
    console.error(
      'solveCluster gave up with result',
      result,
      'while working on',
      cluster
    );
    const lastConstraint = constraints[constraints.length - 1];
    lastConstraint.paused = true;
    console.log('paused', lastConstraint, 'to see if it helps');
    return;
  }

  // Now we write the solution from the solver back into our variables and handles.
  const outputs = result.solution;
  for (const variable of variables) {
    if (
      !knowns.has(variable.canonicalInstance) &&
      !freeVariables.has(variable.canonicalInstance)
    ) {
      variable.value = outputs.shift()!;
    }
  }
}

function computeKnowns(
  constraints: Constraint[],
  lowLevelConstraints: LowLevelConstraint[]
) {
  const knowns = new Set<Variable>();
  for (const constraint of constraints) {
    constraint.propagateKnowns(knowns);
  }

  while (true) {
    const oldNumKnowns = knowns.size;
    for (const llc of lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
    if (knowns.size === oldNumKnowns) {
      break;
    }
  }
  return knowns;
}

// #endregion solver

// #region helpers

function variablesAreEqual(x: Variable, y: Variable) {
  return (
    (x.canonicalInstance === y && x.offset.m === 1 && x.offset.b === 0) ||
    (y.canonicalInstance === x && y.offset.m === 1 && y.offset.b === 0) ||
    (x.canonicalInstance === y.canonicalInstance &&
      x.offset.m === y.offset.m &&
      x.offset.b === y.offset.b)
  );
}

function handlesAreEqual(a: Handle, b: Handle) {
  return (
    variablesAreEqual(a.xVariable, b.xVariable) &&
    variablesAreEqual(a.yVariable, b.yVariable)
  );
}

// #endregion helpers
