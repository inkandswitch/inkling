import SVG from "./Svg.js";
import {aHandle} from "./ink/Handle.js";
import {forDebugging, generateId, sets} from "../lib/helpers.js";
import {minimize} from "../lib/g9.js";
import {TAU} from "../lib/math.js";
import Vec from "../lib/vec.js";
const _Variable = class {
  constructor(_value = 0, represents) {
    this._value = _value;
    this.id = generateId();
    this.info = {
      isCanonical: true,
      absorbedVariables: new Set()
    };
    this.isScrubbing = false;
    this.represents = represents;
    _Variable.all.add(this);
  }
  static create(value = 0, represents) {
    return new _Variable(value, represents);
  }
  remove() {
    if (!_Variable.all.has(this)) {
      return;
    }
    _Variable.all.delete(this);
    for (const constraint of Constraint.all) {
      if (constraint.variables.includes(this)) {
        constraint.remove();
      }
    }
  }
  get isCanonicalInstance() {
    return this.info.isCanonical;
  }
  get canonicalInstance() {
    return this.info.isCanonical ? this : this.info.canonicalInstance;
  }
  get offset() {
    return this.info.isCanonical ? {m: 1, b: 0} : this.info.offset;
  }
  get value() {
    return this._value;
  }
  set value(newValue) {
    if (this.info.isCanonical) {
      this._value = newValue;
      for (const that of this.info.absorbedVariables) {
        const {m, b} = that.info.offset;
        that._value = (newValue - b) / m;
      }
    } else {
      this.info.canonicalInstance.value = this.toCanonicalValue(newValue);
    }
  }
  toCanonicalValue(value) {
    if (this.info.isCanonical) {
      return value;
    }
    const {m, b} = this.info.offset;
    return m * value + b;
  }
  makeEqualTo(that, offset = {m: 1, b: 0}) {
    if (this === that) {
      return;
    } else if (!this.info.isCanonical) {
      const {m: mThat, b: bThat} = offset;
      const {m: mThis, b: bThis} = this.offset;
      this.canonicalInstance.makeEqualTo(that, {
        m: mThis * mThat,
        b: mThis * bThat + bThis
      });
      return;
    } else if (!that.info.isCanonical) {
      const {m: mThat, b: bThat} = that.offset;
      const {m, b} = offset;
      this.makeEqualTo(that.canonicalInstance, {
        m: m / mThat,
        b: b - bThat / mThat
      });
      return;
    }
    const thatLockConstraint = that.lockConstraint;
    for (const otherVariable of that.info.absorbedVariables) {
      const otherVariableInfo = otherVariable.info;
      otherVariableInfo.canonicalInstance = this;
      otherVariableInfo.offset = {
        m: offset.m * otherVariableInfo.offset.m,
        b: offset.m * otherVariableInfo.offset.b + offset.b
      };
      this.info.absorbedVariables.add(otherVariable);
    }
    that.info = {
      isCanonical: false,
      canonicalInstance: this,
      offset
    };
    this.info.absorbedVariables.add(that);
    this.value = this.value;
    if (thatLockConstraint || this.isLocked) {
      this.lock();
    } else {
      this.unlock();
    }
  }
  promoteToCanonical() {
    if (this.info.isCanonical) {
    } else {
      this.info.canonicalInstance.breakOff(this);
    }
  }
  breakOff(that) {
    if (!this.info.isCanonical) {
      throw new Error("Handle.breakOff() called on absorbed variable");
    }
    if (!this.info.absorbedVariables.has(that)) {
      throw new Error("cannot break off a variable that has not been absorbed");
    }
    this.info.absorbedVariables.delete(that);
    that.info = {isCanonical: true, absorbedVariables: new Set()};
    if (this.isLocked) {
      that.lock();
    }
    forgetClustersForSolver();
  }
  get lockConstraint() {
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
  lock(value, scrub = false) {
    if (!this.info.isCanonical) {
      this.canonicalInstance.lock(value !== void 0 ? this.toCanonicalValue(value) : void 0, scrub);
      return;
    }
    if (value !== void 0) {
      this.value = value;
    }
    for (const variable2 of [this, ...this.info.absorbedVariables]) {
      constant(variable2);
      variable2.isScrubbing = scrub;
    }
  }
  unlock() {
    if (!this.info.isCanonical) {
      this.canonicalInstance.unlock();
      return;
    }
    for (const variable2 of [this, ...this.info.absorbedVariables]) {
      constant(variable2).remove();
      variable2.isScrubbing = false;
    }
  }
  toggleLock() {
    if (this.isLocked) {
      this.unlock();
    } else {
      this.lock();
    }
  }
  equals(that) {
    return this.canonicalInstance === that && this.offset.m === 1 && this.offset.b === 0 || that.canonicalInstance === this && that.offset.m === 1 && that.offset.b === 0 || this.canonicalInstance === that.canonicalInstance && this.offset.m === that.offset.m && this.offset.b === that.offset.b;
  }
  hasLinearRelationshipWith(that) {
    return this.canonicalInstance === that.canonicalInstance;
  }
};
export let Variable = _Variable;
Variable.all = new Set();
export const variable = Variable.create;
class LowLevelConstraint {
  constructor() {
    this.variables = [];
    this.ownVariables = new Set();
  }
  propagateKnowns(knowns) {
  }
}
class Distance extends LowLevelConstraint {
  constructor(constraint, a, b) {
    super();
    this.a = a;
    this.b = b;
    this.variables.push(variable(Vec.dist(a.position, b.position), {
      object: constraint,
      property: "distance"
    }), a.xVariable, a.yVariable, b.xVariable, b.yVariable);
    this.ownVariables.add(this.distance);
  }
  get distance() {
    return this.variables[0];
  }
  addTo(constraints) {
    for (const that of constraints) {
      if (that instanceof Distance && (this.a.equals(that.a) && this.b.equals(that.b) || this.a.equals(that.b) && this.b.equals(that.a))) {
        that.distance.makeEqualTo(this.distance);
        return;
      }
    }
    constraints.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.distance.canonicalInstance) && knowns.has(this.a.xVariable.canonicalInstance) && knowns.has(this.a.yVariable.canonicalInstance) && knowns.has(this.b.xVariable.canonicalInstance) && knowns.has(this.b.yVariable.canonicalInstance)) {
      this.distance.value = Vec.dist(this.a, this.b);
      knowns.add(this.distance.canonicalInstance);
    }
  }
  getError([dist, ax, ay, bx, by], knowns, freeVariables) {
    const aPos = {x: ax, y: ay};
    const bPos = {x: bx, y: by};
    const currDist = Vec.dist(aPos, bPos);
    if (freeVariables.has(this.distance.canonicalInstance)) {
      this.distance.value = currDist;
    }
    return currDist - dist;
  }
}
class Angle extends LowLevelConstraint {
  constructor(constraint, a, b) {
    super();
    this.a = a;
    this.b = b;
    this.variables.push(variable(Vec.angle(Vec.sub(b.position, a.position)), {
      object: constraint,
      property: "distance"
    }), a.xVariable, a.yVariable, b.xVariable, b.yVariable);
    this.ownVariables.add(this.angle);
  }
  get angle() {
    return this.variables[0];
  }
  addTo(constraints) {
    for (const that of constraints) {
      if (!(that instanceof Angle)) {
        continue;
      } else if (this.a.equals(that.a) && this.b.equals(that.b)) {
        that.angle.makeEqualTo(this.angle);
        return;
      } else if (this.a.equals(that.b) && this.b.equals(that.a)) {
        that.angle.makeEqualTo(this.angle, {m: 1, b: Math.PI});
        return;
      }
    }
    constraints.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.angle) && knowns.has(this.a.xVariable.canonicalInstance) && knowns.has(this.a.yVariable.canonicalInstance) && knowns.has(this.b.xVariable.canonicalInstance) && knowns.has(this.b.yVariable.canonicalInstance)) {
      updateAngle(this.angle, this.a, this.b);
      knowns.add(this.angle.canonicalInstance);
    }
  }
  getError([angle, ax, ay, bx, by], knowns, freeVariables) {
    const aPos = {x: ax, y: ay};
    const bPos = {x: bx, y: by};
    if (freeVariables.has(this.angle.canonicalInstance)) {
      updateAngle(this.angle, aPos, bPos);
      return 0;
    }
    const r = Vec.dist(bPos, aPos);
    let error = Infinity;
    if (!knowns.has(this.b.xVariable.canonicalInstance) && !knowns.has(this.b.yVariable.canonicalInstance)) {
      const x = ax + r * Math.cos(angle);
      const y = ay + r * Math.sin(angle);
      error = Math.min(error, Vec.dist(bPos, {x, y}));
    } else if (!knowns.has(this.b.xVariable.canonicalInstance)) {
      const x = ax + (by - ay) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - bx));
    } else if (!knowns.has(this.b.yVariable.canonicalInstance)) {
      const y = ay + (bx - ax) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - by));
    }
    if (!knowns.has(this.a.xVariable.canonicalInstance) && !knowns.has(this.a.yVariable.canonicalInstance)) {
      const x = bx + r * Math.cos(angle + Math.PI);
      const y = by + r * Math.sin(angle + Math.PI);
      error = Math.min(error, Vec.dist(aPos, {x, y}));
    } else if (!knowns.has(this.a.xVariable.canonicalInstance)) {
      const x = bx + (ay - by) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - ax));
    } else if (!knowns.has(this.a.yVariable.canonicalInstance)) {
      const y = by + (ax - bx) * Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(y - ay));
    }
    if (!Number.isFinite(error)) {
      error = Math.min(Vec.dist(bPos, {
        x: ax + r * Math.cos(angle),
        y: ay + r * Math.sin(angle)
      }), Vec.dist(aPos, {
        x: bx + r * Math.cos(angle + Math.PI),
        y: by + r * Math.sin(angle + Math.PI)
      }));
    }
    return error;
  }
}
function updateAngle(angleVar, aPos, bPos) {
  const currAngle = normalizeAngle(angleVar.value);
  const newAngle = normalizeAngle(Vec.angle(Vec.sub(bPos, aPos)));
  let diff = normalizeAngle(newAngle - currAngle);
  if (diff > Math.PI) {
    diff -= TAU;
  }
  angleVar.value += diff;
}
function normalizeAngle(angle) {
  return (angle % TAU + TAU) % TAU;
}
class LLFormula extends LowLevelConstraint {
  constructor(constraint, args, fn) {
    super();
    this.args = args;
    this.fn = fn;
    this.result = variable(this.computeResult(), {
      object: constraint,
      property: "result"
    });
    this.variables.push(...args, this.result);
    this.ownVariables.add(this.result);
  }
  addTo(constraints) {
    constraints.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.result.canonicalInstance) && this.args.every((arg) => knowns.has(arg.canonicalInstance))) {
      this.result.value = this.computeResult();
      knowns.add(this.result.canonicalInstance);
    }
  }
  getError(variableValues, knowns, freeVariables) {
    const currValue = this.computeResult(variableValues);
    if (freeVariables.has(this.result.canonicalInstance)) {
      this.result.value = currValue;
    }
    return currValue - this.result.value;
  }
  computeResult(xs = this.args.map((arg) => arg.value)) {
    return this.fn(xs);
  }
}
const _Constraint = class {
  constructor() {
    this._paused = false;
    this.variables = [];
    this.lowLevelConstraints = [];
    _Constraint.all.add(this);
    forgetClustersForSolver();
  }
  get paused() {
    return this._paused;
  }
  set paused(newValue) {
    if (newValue !== this._paused) {
      this._paused = newValue;
      forgetClustersForSolver();
    }
  }
  setUpVariableRelationships() {
  }
  propagateKnowns(knowns) {
    for (const llc of this.lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
  }
  getManipulationSet() {
    return new Set(this.variables.map((v) => v.canonicalInstance));
  }
  remove() {
    if (!_Constraint.all.has(this)) {
      return;
    }
    _Constraint.all.delete(this);
    for (const llc of this.lowLevelConstraints) {
      for (const v of llc.ownVariables) {
        v.remove();
      }
    }
    forgetClustersForSolver();
  }
};
export let Constraint = _Constraint;
Constraint.all = new Set();
const _Constant = class extends Constraint {
  constructor(variable2, value) {
    super();
    this.variable = variable2;
    this.value = value;
    this.variables.push(variable2);
  }
  static create(variable2, value = variable2.value) {
    let constant2 = _Constant.memo.get(variable2);
    if (constant2) {
      constant2.value = value;
    } else {
      constant2 = new _Constant(variable2, value);
      _Constant.memo.set(variable2, constant2);
    }
    return constant2;
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.variable.canonicalInstance)) {
      this.variable.value = this.value;
      knowns.add(this.variable.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }
  remove() {
    _Constant.memo.delete(this.variable);
    super.remove();
  }
};
export let Constant = _Constant;
Constant.memo = new Map();
export const constant = Constant.create;
class PinLikeConstraint extends Constraint {
  constructor(handle, position) {
    super();
    this.handle = handle;
    this.position = position;
    this.variables.push(handle.xVariable, handle.yVariable);
  }
  propagateKnowns(knowns) {
    const {xVariable: x, yVariable: y} = this.handle;
    if (!knowns.has(x.canonicalInstance) || !knowns.has(y.canonicalInstance)) {
      ({x: x.value, y: y.value} = this.position);
      knowns.add(x.canonicalInstance);
      knowns.add(y.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }
}
const _Pin = class extends PinLikeConstraint {
  static create(handle, position = handle.position) {
    let pin2 = _Pin.memo.get(handle);
    if (pin2) {
      pin2.position = position;
    } else {
      pin2 = new _Pin(handle, position);
      _Pin.memo.set(handle, pin2);
    }
    return pin2;
  }
  constructor(handle, position) {
    super(handle, position);
  }
  remove() {
    _Pin.memo.delete(this.handle);
    super.remove();
  }
};
export let Pin = _Pin;
Pin.memo = new Map();
export const pin = Pin.create;
const _Finger = class extends PinLikeConstraint {
  static create(handle, position = handle.position) {
    let finger2 = _Finger.memo.get(handle);
    if (finger2) {
      finger2.position = position;
    } else {
      finger2 = new _Finger(handle, position);
      _Finger.memo.set(handle, finger2);
    }
    return finger2;
  }
  constructor(handle, position) {
    super(handle, position);
  }
  remove() {
    _Finger.memo.delete(this.handle);
    super.remove();
  }
};
export let Finger = _Finger;
Finger.memo = new Map();
export const finger = Finger.create;
const _LinearRelationship = class extends Constraint {
  constructor(y, m, x, b) {
    super();
    this.y = y;
    this.m = m;
    this.x = x;
    this.b = b;
    this.variables.push(y, x);
  }
  static create(y, m, x, b) {
    if (m === 0) {
      throw new Error("tried to create a linear relationship w/ m = 0");
    }
    let lr = _LinearRelationship.memo.get(y)?.get(x);
    if (lr) {
      lr.m = m;
      lr.b = b;
      return lr;
    }
    lr = _LinearRelationship.memo.get(x)?.get(y);
    if (lr) {
      lr.m = 1 / m;
      lr.b = -b / m;
      return lr;
    }
    lr = new _LinearRelationship(y, m, x, b);
    if (!_LinearRelationship.memo.has(y)) {
      _LinearRelationship.memo.set(y, new Map());
    }
    _LinearRelationship.memo.get(y).set(x, lr);
    return lr;
  }
  setUpVariableRelationships() {
    this.y.makeEqualTo(this.x, {m: this.m, b: this.b});
  }
  remove() {
    const yDict = _LinearRelationship.memo.get(this.y);
    if (yDict) {
      yDict.delete(this.x);
      if (yDict.size === 0) {
        _LinearRelationship.memo.delete(this.y);
      }
    }
    const xDict = _LinearRelationship.memo.get(this.x);
    if (xDict) {
      xDict.delete(this.y);
      if (xDict.size === 0) {
        _LinearRelationship.memo.delete(this.x);
      }
    }
    super.remove();
  }
};
export let LinearRelationship = _LinearRelationship;
LinearRelationship.memo = new Map();
export const linearRelationship = LinearRelationship.create;
export const equals = (x, y) => linearRelationship(y, 1, x, 0);
const _Absorb = class extends Constraint {
  constructor(parent, child) {
    super();
    this.parent = parent;
    this.child = child;
    this.variables.push(parent.xVariable, parent.yVariable, child.xVariable, child.yVariable);
  }
  static create(parent, child) {
    if (_Absorb.memo.has(child)) {
      _Absorb.memo.get(child).remove();
    }
    const a = new _Absorb(parent, child);
    _Absorb.memo.set(child, a);
    return a;
  }
  setUpVariableRelationships() {
    this.parent.xVariable.makeEqualTo(this.child.xVariable);
    this.parent.yVariable.makeEqualTo(this.child.yVariable);
    this.parent._absorb(this.child);
  }
  remove() {
    _Absorb.memo.delete(this.child);
    super.remove();
  }
};
export let Absorb = _Absorb;
Absorb.memo = new Map();
export const absorb = Absorb.create;
const _PolarVector = class extends Constraint {
  constructor(a, b) {
    super();
    this.a = a;
    this.b = b;
    const dc = new Distance(this, a, b);
    this.lowLevelConstraints.push(dc);
    this.distance = dc.distance;
    const ac = new Angle(this, a, b);
    this.lowLevelConstraints.push(ac);
    this.angle = ac.angle;
    this.variables.push(a.xVariable, a.yVariable, b.xVariable, b.yVariable, this.distance, this.angle);
  }
  static create(a, b) {
    let pv = _PolarVector.memo.get(a)?.get(b);
    if (pv) {
      return pv;
    }
    pv = new _PolarVector(a, b);
    if (!_PolarVector.memo.get(a)) {
      _PolarVector.memo.set(a, new Map());
    }
    _PolarVector.memo.get(a).set(b, pv);
    return pv;
  }
  remove() {
    const aDict = _PolarVector.memo.get(this.a);
    aDict.delete(this.b);
    if (aDict.size === 0) {
      _PolarVector.memo.delete(this.a);
    }
    super.remove();
  }
};
export let PolarVector = _PolarVector;
PolarVector.memo = new Map();
export const polarVector = PolarVector.create;
export class Formula extends Constraint {
  static create(args, fn) {
    return new Formula(args, fn);
  }
  constructor(args, fn) {
    super();
    const fc = new LLFormula(this, args, fn);
    this.lowLevelConstraints.push(fc);
    this.result = fc.result;
    this.variables.push(...args, this.result);
  }
}
export const formula = Formula.create;
let clustersForSolver = null;
function getClustersForSolver(root) {
  if (clustersForSolver) {
    return clustersForSolver;
  }
  root.forEach({
    what: aHandle,
    recursive: true,
    do(handle) {
      handle._forgetAbsorbedHandles();
    }
  });
  for (const variable2 of Variable.all) {
    variable2.info = {isCanonical: true, absorbedVariables: new Set()};
  }
  const activeConstraints = [...Constraint.all].filter((constraint) => !constraint.paused);
  for (const constraint of activeConstraints) {
    constraint.setUpVariableRelationships();
  }
  clustersForSolver = computeClusters(activeConstraints);
  forDebugging("clusters", clustersForSolver);
  SVG.showStatus(`${clustersForSolver.size} clusters`);
  return clustersForSolver;
}
function computeClusters(activeConstraints) {
  const clusters = new Set();
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
      manipulationSet = new Set([...manipulationSet, ...cluster.manipulationSet].map((v) => v.canonicalInstance));
      clusters.delete(cluster);
    }
    clusters.add({constraints, lowLevelConstraints, manipulationSet});
  }
  return sets.map(clusters, ({constraints, lowLevelConstraints}) => createClusterForSolver(constraints, lowLevelConstraints));
}
function createClusterForSolver(constraints, lowLevelConstraints) {
  const knowns = computeKnowns(constraints, lowLevelConstraints);
  const variables = new Set();
  for (const constraint of constraints) {
    for (const variable2 of constraint.variables) {
      if (!knowns.has(variable2.canonicalInstance)) {
        variables.add(variable2.canonicalInstance);
      }
    }
  }
  const freeVariableCandidates = new Set();
  for (const llc of lowLevelConstraints) {
    for (const variable2 of llc.ownVariables) {
      if (!knowns.has(variable2.canonicalInstance)) {
        freeVariableCandidates.add(variable2.canonicalInstance);
      }
    }
  }
  const freeVarCandidateCounts = new Map();
  for (const llc of lowLevelConstraints) {
    for (const variable2 of llc.variables) {
      if (!freeVariableCandidates.has(variable2.canonicalInstance)) {
        continue;
      }
      const n = freeVarCandidateCounts.get(variable2.canonicalInstance) ?? 0;
      freeVarCandidateCounts.set(variable2.canonicalInstance, n + 1);
    }
  }
  const freeVariables = new Set();
  for (const [variable2, count] of freeVarCandidateCounts.entries()) {
    if (count === 1) {
      freeVariables.add(variable2.canonicalInstance);
    }
  }
  return {
    constraints,
    lowLevelConstraints,
    variables: Array.from(variables),
    freeVariables
  };
}
function forgetClustersForSolver() {
  clustersForSolver = null;
}
export function solve(root) {
  const clusters = getClustersForSolver(root);
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}
function solveCluster(cluster) {
  const {constraints, lowLevelConstraints, variables} = cluster;
  let {freeVariables} = cluster;
  if (constraints.length === 0) {
    return;
  }
  const knowns = computeKnowns(constraints, lowLevelConstraints);
  const handlesWithFingers = getHandlesWithFingers(constraints);
  for (const pv of constraints) {
    if (pv instanceof PolarVector && handlesWithFingers.has(pv.a.canonicalInstance) && handlesWithFingers.has(pv.b.canonicalInstance)) {
      for (const k of constraints) {
        if (k instanceof Constant && (k.variable.hasLinearRelationshipWith(pv.distance) || k.variable.hasLinearRelationshipWith(pv.angle))) {
          k.value = k.variable.value;
        }
      }
    }
  }
  let gizmoHack = false;
  for (const pv of constraints) {
    if (pv instanceof PolarVector && pv.angle.isScrubbing && freeVariables.has(pv.distance.canonicalInstance)) {
      gizmoHack = true;
      knowns.add(pv.distance.canonicalInstance);
    }
  }
  if (gizmoHack) {
    freeVariables = new Set([...freeVariables].filter((fv) => !knowns.has(fv.canonicalInstance)));
  }
  const inputs = [];
  const varIdx = new Map();
  for (const variable2 of variables) {
    if (variable2.isCanonicalInstance && !knowns.has(variable2) && !freeVariables.has(variable2)) {
      varIdx.set(variable2, inputs.length);
      inputs.push(variable2.value);
    }
  }
  function computeTotalError(currState) {
    let error = 0;
    for (const llc of lowLevelConstraints) {
      const values = llc.variables.map((variable2) => {
        const {m, b} = variable2.offset;
        variable2 = variable2.canonicalInstance;
        const vi = varIdx.get(variable2);
        return ((vi === void 0 ? variable2.value : currState[vi]) - b) / m;
      });
      error += Math.pow(llc.getError(values, knowns, freeVariables), 2);
    }
    return error;
  }
  if (inputs.length === 0) {
    computeTotalError(inputs);
    return;
  }
  let result;
  try {
    result = minimize(computeTotalError, inputs, 1e3, 1e-3);
  } catch (e) {
    console.log("minimizeError threw", e, "while working on cluster", cluster, "with knowns", knowns);
    SVG.showStatus("" + e);
    throw e;
  }
  forDebugging("solverResult", result);
  forDebugging("solverResultMessages", (messages) => {
    if (!messages) {
      messages = new Set();
    }
    messages.add(result.message);
    return messages;
  });
  if (!result || result.message?.includes("maxit")) {
    return;
  }
  const outputs = result.solution;
  for (const variable2 of variables) {
    if (variable2.isCanonicalInstance && !knowns.has(variable2) && !freeVariables.has(variable2)) {
      variable2.value = outputs.shift();
    }
  }
}
function computeKnowns(constraints, lowLevelConstraints) {
  const knowns = new Set();
  while (true) {
    const oldNumKnowns = knowns.size;
    for (const constraint of constraints) {
      if (constraint instanceof Finger) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const constraint of constraints) {
      if (constraint instanceof PolarVector) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const constraint of constraints) {
      if (!(constraint instanceof Finger || constraint instanceof PolarVector)) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const llc of lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
    if (knowns.size === oldNumKnowns) {
      break;
    }
  }
  return knowns;
}
function getHandlesWithFingers(constraints) {
  const handlesWithFingers = new Set();
  for (const constraint of constraints) {
    if (constraint instanceof Finger) {
      handlesWithFingers.add(constraint.handle.canonicalInstance);
    }
  }
  return handlesWithFingers;
}
