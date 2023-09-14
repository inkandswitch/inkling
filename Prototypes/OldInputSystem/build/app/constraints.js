import {minimize} from "../lib/g9.js";
import {generateId, removeOne} from "../lib/helpers.js";
import Vec from "../lib/vec.js";
import SVG from "./Svg.js";
const _Variable = class {
  constructor(_value = 0) {
    this._value = _value;
    this.id = generateId();
    this.info = {
      isCanonical: true,
      absorbedVariables: new Set()
    };
    this.wasRemoved = false;
    _Variable.all.add(this);
  }
  remove() {
    if (this.wasRemoved) {
      return;
    }
    _Variable.all.delete(this);
    this.wasRemoved = true;
    for (const constraint of Constraint.all) {
      if (constraint.variables.includes(this)) {
        constraint.remove();
      }
    }
  }
  get canonicalInstance() {
    return this.info.isCanonical ? this : this.info.canonicalInstance;
  }
  get valueOffset() {
    return this.info.isCanonical ? 0 : this.info.valueOffset;
  }
  get value() {
    return this._value;
  }
  set value(newValue) {
    if (this.info.isCanonical) {
      this._value = newValue;
      for (const child of this.info.absorbedVariables) {
        const valueOffset = child.info.valueOffset;
        child._value = newValue - valueOffset;
      }
    } else {
      this.info.canonicalInstance.value = newValue + this.info.valueOffset;
    }
  }
  absorb(that, valueOffset = 0) {
    if (this === that) {
      return;
    } else if (!this.info.isCanonical || !that.info.isCanonical) {
      this.canonicalInstance.absorb(that.canonicalInstance, valueOffset);
      return;
    }
    for (const otherVariable of that.info.absorbedVariables) {
      otherVariable.value = this.value;
      const otherVariableInfo = otherVariable.info;
      otherVariableInfo.canonicalInstance = this;
      otherVariableInfo.valueOffset += valueOffset;
      this.info.absorbedVariables.add(otherVariable);
    }
    that.value = this.value;
    that.info = {
      isCanonical: false,
      canonicalInstance: this,
      valueOffset
    };
    this.info.absorbedVariables.add(that);
  }
  resetInfo() {
    if (this.info.isCanonical) {
      this.info.absorbedVariables.clear();
    } else {
      this.info = {
        isCanonical: true,
        absorbedVariables: new Set()
      };
    }
  }
};
export let Variable = _Variable;
Variable.all = new Set();
let _clustersForSolver = null;
function getClustersForSolver() {
  if (_clustersForSolver) {
    return _clustersForSolver;
  }
  for (const variable2 of Variable.all) {
    variable2.resetInfo();
  }
  const clusters = new Set();
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
    clusters.add({constraints, manipulationSet});
  }
  _clustersForSolver = new Set(Array.from(clusters).map((cluster) => {
    const origConstraints = cluster.constraints;
    const {constraints, variables, handleGetsXFrom, handleGetsYFrom} = getDedupedConstraintsAndVariables(origConstraints);
    const constrainedState = new StateSet();
    for (const constraint of [...origConstraints, ...constraints]) {
      constraint.addConstrainedState(constrainedState);
    }
    return {
      constraints,
      variables,
      handles: getHandlesIn(constraints),
      handleGetsXFrom,
      handleGetsYFrom,
      constrainedState
    };
  }));
  window.clusters = _clustersForSolver;
  SVG.showStatus(`${clusters.size} clusters`);
  return _clustersForSolver;
}
function getDedupedConstraintsAndVariables(constraints) {
  let result = null;
  while (true) {
    const oldNumConstraints = result ? result.constraints.length : constraints.length;
    const handleGetsXFrom = result ? result.handleGetsXFrom : new Map();
    const handleGetsYFrom = result ? result.handleGetsYFrom : new Map();
    result = dedupVariables(dedupConstraints(constraints));
    for (const [handle, variable2] of handleGetsXFrom) {
      if (!result.handleGetsXFrom.has(handle)) {
        result.handleGetsXFrom.set(handle, variable2);
      }
    }
    for (const [handle, variable2] of handleGetsYFrom) {
      if (!result.handleGetsYFrom.has(handle)) {
        result.handleGetsYFrom.set(handle, variable2);
      }
    }
    if (result.constraints.length === oldNumConstraints) {
      return result;
    }
  }
}
function dedupConstraints(constraints) {
  const constraintByKey = new Map();
  const constraintsToProcess = new Set(constraints);
  while (true) {
    const constraint = removeOne(constraintsToProcess);
    if (!constraint) {
      break;
    }
    const key = constraint.getKeyWithDedupedHandlesAndVars();
    const matchingConstraint = constraintByKey.get(key);
    if (matchingConstraint) {
      captureNewConstraints(constraintsToProcess, () => matchingConstraint.onClash(constraint));
    } else {
      constraintByKey.set(key, constraint);
    }
  }
  return Array.from(constraintByKey.values());
}
function dedupVariables(constraints) {
  let idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof Equals)) {
      idx++;
      continue;
    }
    const {a, b} = constraint;
    a.absorb(b);
    constraints.splice(idx, 1);
  }
  const handleGetsXFrom = new Map();
  const handleGetsYFrom = new Map();
  for (const c of constraints) {
    if (c instanceof Property) {
      (c.property === "x" ? handleGetsXFrom : handleGetsYFrom).set(c.handle.canonicalInstance, c.variable.canonicalInstance);
    }
  }
  idx = 0;
  while (idx < constraints.length) {
    const constraint = constraints[idx];
    if (!(constraint instanceof Sum)) {
      idx++;
      continue;
    }
    const {a, b, c: k} = constraint;
    const constant2 = constraints.find((c) => c instanceof Constant && c.variable.canonicalInstance === k.canonicalInstance);
    a.absorb(b, constant2.value);
    constraints.splice(idx, 1);
  }
  const variables = new Set();
  for (const constraint of constraints) {
    for (const variable2 of constraint.variables) {
      variables.add(variable2.canonicalInstance);
    }
  }
  return {
    variables: Array.from(variables),
    constraints,
    handleGetsXFrom,
    handleGetsYFrom
  };
}
function getHandlesIn(constraints) {
  const handles = new Set();
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
function captureNewConstraints(dest, fn) {
  newConstraintAccumulator = dest;
  try {
    return fn();
  } finally {
    newConstraintAccumulator = void 0;
  }
}
class StateSet {
  constructor() {
    this.xs = new Set();
    this.ys = new Set();
    this.vars = new Set();
  }
  hasX(handle) {
    return this.xs.has(handle.canonicalInstance);
  }
  hasY(handle) {
    return this.ys.has(handle.canonicalInstance);
  }
  hasVar(variable2) {
    return this.vars.has(variable2.canonicalInstance);
  }
  addX(handle) {
    this.xs.add(handle.canonicalInstance);
  }
  addY(handle) {
    this.ys.add(handle.canonicalInstance);
  }
  addVar(variable2) {
    this.vars.add(variable2.canonicalInstance);
  }
  toJSON() {
    return {
      vars: Array.from(this.vars).map((v) => ({id: v.id, value: v.value})),
      xs: Array.from(this.xs).map((h) => ({id: h.id, x: h.position.x})),
      ys: Array.from(this.ys).map((h) => ({id: h.id, y: h.position.y}))
    };
  }
}
export function solve() {
  const clusters = getClustersForSolver();
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}
function solveCluster({
  constraints,
  variables,
  handles,
  handleGetsXFrom,
  handleGetsYFrom,
  constrainedState
}) {
  if (constraints.length === 0) {
    return;
  }
  const knownState = computeKnownState(constraints);
  const inputs = [];
  const inputDescriptions = [];
  const varIdx = new Map();
  for (const variable2 of variables) {
    if (!knownState.hasVar(variable2) && constrainedState.hasVar(variable2)) {
      varIdx.set(variable2, inputs.length);
      inputs.push(variable2.value);
      inputDescriptions.push(`var ${variable2.id}`);
    }
  }
  const xIdx = new Map();
  const yIdx = new Map();
  for (const handle of handles) {
    if (knownState.hasX(handle) || !constrainedState.hasX(handle)) {
    } else if (handleGetsXFrom.has(handle)) {
      xIdx.set(handle, varIdx.get(handleGetsXFrom.get(handle)));
    } else {
      xIdx.set(handle, inputs.length);
      inputs.push(handle.position.x);
      inputDescriptions.push(`x ${handle.id}`);
    }
    if (knownState.hasY(handle) || !constrainedState.hasY(handle)) {
    } else if (handleGetsYFrom.has(handle)) {
      yIdx.set(handle, varIdx.get(handleGetsYFrom.get(handle)));
    } else {
      yIdx.set(handle, inputs.length);
      inputs.push(handle.position.y);
      inputDescriptions.push(`y ${handle.id}`);
    }
  }
  function computeTotalError(currState) {
    let error = 0;
    for (const constraint of constraints) {
      if (constraint instanceof Constant || constraint instanceof Pin) {
        continue;
      }
      const positions = constraint.handles.map((handle) => {
        handle = handle.canonicalInstance;
        const xi = xIdx.get(handle);
        const yi = yIdx.get(handle);
        if (xi === void 0 && yi === void 0) {
          return handle.position;
        } else {
          return {
            x: xi === void 0 ? handle.position.x : currState[xi],
            y: yi === void 0 ? handle.position.y : currState[yi]
          };
        }
      });
      const values = constraint.variables.map((variable2) => {
        const valueOffset = variable2.valueOffset;
        variable2 = variable2.canonicalInstance;
        const vi = varIdx.get(variable2);
        return (vi === void 0 ? variable2.value : currState[vi]) - valueOffset;
      });
      error += Math.pow(constraint.getError(positions, values, knownState, constrainedState), 2);
    }
    return error;
  }
  let result;
  try {
    result = minimize(computeTotalError, inputs);
  } catch (e) {
    console.log("minimizeError threw", e, "while working on cluster with", constraints, variables, handles, "with inputs", inputs.map((input, idx) => ({input, is: inputDescriptions[idx]})), "known state", knownState.toJSON(), "and constrained state", constrainedState.toJSON());
    SVG.showStatus("" + e);
    throw e;
  }
  const outputs = result.solution;
  for (const variable2 of variables) {
    if (!knownState.hasVar(variable2) && constrainedState.hasVar(variable2)) {
      variable2.value = outputs.shift();
    }
  }
  for (const handle of handles) {
    const x = knownState.hasX(handle) || !constrainedState.hasX(handle) ? handle.position.x : handleGetsXFrom.has(handle) ? handleGetsXFrom.get(handle).value : outputs.shift();
    const y = knownState.hasY(handle) || !constrainedState.hasY(handle) ? handle.position.y : handleGetsYFrom.has(handle) ? handleGetsYFrom.get(handle).value : outputs.shift();
    handle.position = {x, y};
  }
}
function computeKnownState(constraints) {
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
class ConstraintKeyGenerator {
  constructor(type, handleGroups, variableGroups) {
    this.type = type;
    this.handleGroups = handleGroups;
    this.variableGroups = variableGroups;
    this.key = this.generateKey();
  }
  getKeyWithDedupedHandlesAndVars() {
    return this.generateKey(true);
  }
  generateKey(dedupHandlesAndVars = false) {
    const handleIdGroups = this.handleGroups.map((handleGroup) => handleGroup.map((handle) => dedupHandlesAndVars ? handle.id : handle.ownId).sort().join(",")).map((handleIdGroup) => `[${handleIdGroup}]`);
    const variableIdGroups = this.variableGroups.map((variableGroup) => variableGroup.map((variable2) => dedupHandlesAndVars ? variable2.canonicalInstance.id : variable2.id).sort().join(",")).map((variableIdGroup) => `[${variableIdGroup}]`);
    return `${this.type}([${handleIdGroups}],[${variableIdGroups}])`;
  }
}
function addConstraint(keyGenerator, createNew, onClash) {
  const constraint = Constraint.find((constraint2) => constraint2.key === keyGenerator.key);
  return constraint ? onClash(constraint) : createNew(keyGenerator).toAddConstraintResult();
}
class ManipulationSet {
  constructor({
    xs,
    ys,
    vars
  }) {
    this.xs = new Set(xs.map((handle) => handle.canonicalInstance));
    this.ys = new Set(ys.map((handle) => handle.canonicalInstance));
    this.vars = new Set(vars.map((variable2) => variable2.canonicalInstance));
  }
  overlapsWith(that) {
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
  absorb(that) {
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
let newConstraintAccumulator;
const _Constraint = class {
  constructor(handles, variables, keyGenerator) {
    this.handles = handles;
    this.variables = variables;
    this.keyGenerator = keyGenerator;
    this.wasRemoved = false;
    _Constraint.all.add(this);
    newConstraintAccumulator?.add(this);
    forgetClustersForSolver();
  }
  static find(pred) {
    for (const constraint of _Constraint.all) {
      if (pred(constraint)) {
        return constraint;
      }
    }
    return void 0;
  }
  remove() {
    if (this.wasRemoved) {
      return;
    }
    if (_Constraint.all.delete(this)) {
      forgetClustersForSolver();
    }
    this.wasRemoved = true;
    for (const variable2 of Object.values(this.ownedVariables)) {
      variable2.remove();
    }
  }
  get key() {
    return this.keyGenerator.key;
  }
  getKeyWithDedupedHandlesAndVars() {
    return this.keyGenerator.getKeyWithDedupedHandlesAndVars();
  }
  propagateKnownState(_knownState) {
    return false;
  }
  toAddConstraintResult() {
    return {
      constraints: [this],
      variables: this.ownedVariables,
      remove: () => this.remove()
    };
  }
  getManipulationSet() {
    return new ManipulationSet({
      xs: this.handles,
      ys: this.handles,
      vars: this.variables
    });
  }
};
let Constraint = _Constraint;
Constraint.all = new Set();
export function variable(value = 0) {
  return new Variable(value);
}
export function constant(variable2, value = variable2.value) {
  return addConstraint(new ConstraintKeyGenerator("constant", [], [[variable2]]), (keyGenerator) => new Constant(variable2, value, keyGenerator), (existingConstraint) => existingConstraint.onClash(value));
}
class Constant extends Constraint {
  constructor(variable2, value, keyGenerator) {
    super([], [variable2], keyGenerator);
    this.variable = variable2;
    this.value = value;
    this.ownedVariables = {};
  }
  addConstrainedState(constrainedState) {
    constrainedState.addVar(this.variable);
  }
  propagateKnownState(knownState) {
    if (!knownState.hasVar(this.variable)) {
      this.variable.value = this.value;
      knownState.addVar(this.variable);
      return true;
    } else {
      return false;
    }
  }
  getError(_positions, _values) {
    throw new Error("Constant.getError() should never be called!");
  }
  onClash(constraintOrValue) {
    this.value = constraintOrValue instanceof Constant ? constraintOrValue.value : constraintOrValue;
    return this.toAddConstraintResult();
  }
}
export function equals(a, b) {
  return addConstraint(new ConstraintKeyGenerator("equals", [], [[a, b]]), (keyGenerator) => new Equals(a, b, keyGenerator), (existingConstraint) => existingConstraint.onClash());
}
class Equals extends Constraint {
  constructor(a, b, keyGenerator) {
    super([], [a, b], keyGenerator);
    this.a = a;
    this.b = b;
    this.ownedVariables = {};
  }
  addConstrainedState(constrainedState) {
    constrainedState.addVar(this.a);
    constrainedState.addVar(this.b);
  }
  propagateKnownState(knownState) {
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
  getError(_positions, values) {
    const [aValue, bValue] = values;
    return aValue - bValue;
  }
  onClash() {
    return this.toAddConstraintResult();
  }
}
export function sum(a, b, c) {
  return addConstraint(new ConstraintKeyGenerator("sum", [], [[a], [b, c]]), (keyGenerator) => new Sum(a, b, c, keyGenerator), (existingConstraint) => existingConstraint.onClash(a, b, c));
}
class Sum extends Constraint {
  constructor(a, b, c, keyGenerator) {
    super([], [a, b, c], keyGenerator);
    this.a = a;
    this.b = b;
    this.c = c;
    this.ownedVariables = {};
  }
  addConstrainedState(constrainedState) {
    constrainedState.addVar(this.a);
    constrainedState.addVar(this.b);
    constrainedState.addVar(this.c);
  }
  propagateKnownState(knownState) {
    if (!knownState.hasVar(this.a) && knownState.hasVar(this.b) && knownState.hasVar(this.c)) {
      this.a.value = this.b.value + this.c.value;
      knownState.addVar(this.a);
      return true;
    } else if (knownState.hasVar(this.a) && !knownState.hasVar(this.b) && knownState.hasVar(this.c)) {
      this.b.value = this.a.value - this.c.value;
      knownState.addVar(this.b);
      return true;
    } else if (knownState.hasVar(this.a) && knownState.hasVar(this.b) && !knownState.hasVar(this.c)) {
      this.c.value = this.a.value - this.b.value;
      knownState.addVar(this.c);
      return true;
    } else {
      return false;
    }
  }
  getError(_positions, [aValue, bValue, cValue]) {
    return aValue - (bValue + cValue);
  }
  onClash(_newerConstraintOrA, _b, _c) {
    throw new Error("TODO");
  }
}
export function pin(handle, pos = handle.position) {
  return addConstraint(new ConstraintKeyGenerator("pin", [[handle]], []), (keyGenerator) => new Pin(handle, pos, keyGenerator), (existingConstraint) => existingConstraint.onClash(pos));
}
class Pin extends Constraint {
  constructor(handle, position, keyGenerator) {
    super([handle], [], keyGenerator);
    this.handle = handle;
    this.position = position;
    this.ownedVariables = {};
  }
  addConstrainedState(constrainedState) {
    constrainedState.addX(this.handle);
    constrainedState.addY(this.handle);
  }
  propagateKnownState(knownState) {
    if (!knownState.hasX(this.handle) || !knownState.hasY(this.handle)) {
      this.handle.position = this.position;
      knownState.addX(this.handle);
      knownState.addY(this.handle);
      return true;
    } else {
      return false;
    }
  }
  getError(_positions, _values) {
    throw new Error("Pin.getError() should never be called!");
  }
  onClash(constraintOrPosition) {
    this.position = constraintOrPosition instanceof Pin ? constraintOrPosition.position : constraintOrPosition;
    return this.toAddConstraintResult();
  }
}
export function horizontal(a, b) {
  const ay = property(a, "y").variables.variable;
  const by = property(b, "y").variables.variable;
  return equals(ay, by);
}
export function vertical(a, b) {
  const ax = property(a, "x").variables.variable;
  const bx = property(b, "x").variables.variable;
  return equals(ax, bx);
}
export function distance(a, b) {
  return addConstraint(new ConstraintKeyGenerator("distance", [[a, b]], []), (keyGenerator) => new Distance(a, b, keyGenerator), (existingConstraint) => existingConstraint.onClash());
}
export function equalDistance(a1, a2, b1, b2) {
  const {distance: distanceA} = distance(a1, a2).variables;
  const {distance: distanceB} = distance(b1, b2).variables;
  return equals(distanceA, distanceB);
}
class Distance extends Constraint {
  constructor(a, b, keyGenerator) {
    super([a, b], [new Variable(Vec.dist(a.position, b.position))], keyGenerator);
    this.a = a;
    this.b = b;
    this.ownedVariables = {distance: this.distance};
  }
  get distance() {
    return this.variables[0];
  }
  addConstrainedState(constrainedState) {
    constrainedState.addX(this.a);
    constrainedState.addY(this.a);
    constrainedState.addX(this.b);
    constrainedState.addY(this.b);
  }
  getError([aPos, bPos], [length], _knownState, constrainedState) {
    const currDist = Vec.dist(aPos, bPos);
    if (!constrainedState.hasVar(this.distance)) {
      this.distance.value = currDist;
      return 0;
    } else {
      return currDist - length;
    }
  }
  onClash(that) {
    if (that) {
      const eq = equals(this.distance, that.distance);
      return {
        constraints: [that, ...eq.constraints],
        variables: that.ownedVariables,
        remove() {
          that.remove();
          eq.remove();
        }
      };
    } else {
      return this.toAddConstraintResult();
    }
  }
}
export function angle(a, b) {
  return addConstraint(new ConstraintKeyGenerator("angle", [[a, b]], []), (keyGenerator) => new Angle(a, b, keyGenerator), (existingConstraint) => existingConstraint.onClash(a, b));
}
export function fixedAngle(a1, a2, b1, b2, angleValue) {
  const {
    constraints: [angleAConstraint],
    variables: {angle: angleA}
  } = angle(a1, a2);
  const {
    constraints: [angleBConstraint],
    variables: {angle: angleB}
  } = angle(b1, b2);
  const diff = variable(angleValue);
  const s = sum(angleA, angleB, diff);
  const k = constant(diff);
  return {
    constraints: [
      angleAConstraint,
      angleBConstraint,
      ...s.constraints,
      ...k.constraints
    ],
    variables: {diff},
    remove() {
      s.remove();
      k.remove();
    }
  };
}
class Angle extends Constraint {
  constructor(a, b, keyGenerator) {
    super([a, b], [new Variable(Vec.angle(Vec.sub(b.position, a.position)))], keyGenerator);
    this.a = a;
    this.b = b;
    this.ownedVariables = {angle: this.angle};
  }
  get angle() {
    return this.variables[0];
  }
  addConstrainedState(constrainedState) {
    constrainedState.addX(this.a);
    constrainedState.addY(this.a);
    constrainedState.addX(this.b);
    constrainedState.addY(this.b);
  }
  getError([aPos, bPos], [angle2], knownState, constrainedState) {
    if (!constrainedState.hasVar(this.angle)) {
      this.angle.value = Vec.angle(Vec.sub(this.b.position, this.a.position));
      return 0;
    }
    const r = Vec.dist(bPos, aPos);
    let error = Infinity;
    if (!knownState.hasX(this.b) && !knownState.hasY(this.b)) {
      const x = aPos.x + r * Math.cos(angle2);
      const y = aPos.y + r * Math.sin(angle2);
      error = Math.min(error, Vec.dist(bPos, {x, y}));
    } else if (!knownState.hasX(this.b)) {
      const x = aPos.x + (bPos.y - aPos.y) / Math.tan(angle2);
      error = Math.min(error, Math.abs(x - bPos.x));
    } else if (!knownState.hasY(this.b)) {
      const y = aPos.y + (bPos.x - aPos.x) * Math.tan(angle2);
      error = Math.min(error, Math.abs(y - bPos.y));
    }
    if (!knownState.hasX(this.a) && !knownState.hasY(this.a)) {
      const x = bPos.x + r * Math.cos(angle2 + Math.PI);
      const y = bPos.y + r * Math.sin(angle2 + Math.PI);
      error = Math.min(error, Vec.dist(aPos, {x, y}));
    } else if (!knownState.hasX(this.a)) {
      const x = bPos.x + (aPos.y - bPos.y) / Math.tan(angle2 + Math.PI);
      error = Math.min(error, Math.abs(x - aPos.x));
    } else if (!knownState.hasY(this.b)) {
      const y = bPos.y + (aPos.x - bPos.x) * Math.tan(angle2 + Math.PI);
      error = Math.min(error, Math.abs(y - aPos.y));
    }
    if (!Number.isFinite(error)) {
      error = Math.min(Vec.dist(bPos, {
        x: aPos.x + r * Math.cos(angle2),
        y: aPos.y + r * Math.sin(angle2)
      }), Vec.dist(aPos, {
        x: bPos.x + r * Math.cos(angle2 + Math.PI),
        y: Math.sin(angle2 + Math.PI)
      }));
    }
    return error;
  }
  onClash(thatOrA, b) {
    if (thatOrA instanceof Angle) {
      const that = thatOrA;
      if (this.a === that.a && this.b === that.b) {
        const eq = equals(this.angle, that.angle);
        return {
          constraints: [that, ...eq.constraints],
          variables: that.ownedVariables,
          remove() {
            that.remove();
            eq.remove();
          }
        };
      } else {
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
          }
        };
      }
    } else {
      const a = thatOrA;
      b = b;
      const angle2 = new Variable(Vec.angle(Vec.sub(b.position, a.position)));
      if (this.a === a && this.b === b) {
        const eq = equals(this.angle, angle2);
        return {
          constraints: eq.constraints,
          variables: {angle: angle2},
          remove() {
            eq.remove();
          }
        };
      } else {
        const diff = new Variable(this.angle.value - angle2.value);
        const k = constant(diff);
        const s = sum(this.angle, angle2, diff);
        return {
          constraints: [...k.constraints, ...s.constraints],
          variables: {angle: angle2},
          remove() {
            k.remove();
            s.remove();
          }
        };
      }
    }
  }
}
export function polarVector(a, b) {
  const {
    constraints: [angleConstraint],
    variables: {angle: angleVariable}
  } = angle(a, b);
  const {
    constraints: [lengthConstraint],
    variables: {distance: distanceVariable}
  } = distance(a, b);
  return {
    constraints: [angleConstraint, lengthConstraint],
    variables: {angle: angleVariable, distance: distanceVariable},
    remove() {
      angleConstraint.remove();
      lengthConstraint.remove();
    }
  };
}
export function property(handle, property2) {
  return addConstraint(new ConstraintKeyGenerator("property-" + property2, [[handle]], []), (keyGenerator) => new Property(handle, property2, keyGenerator), (existingConstraint) => existingConstraint.onClash());
}
class Property extends Constraint {
  constructor(handle, property2, keyGenerator) {
    super([handle], [new Variable(handle.position[property2])], keyGenerator);
    this.handle = handle;
    this.property = property2;
    this.ownedVariables = {variable: this.variable};
  }
  get variable() {
    return this.variables[0];
  }
  addConstrainedState(constrainedState) {
    if (this.property === "x") {
      constrainedState.addX(this.handle);
    } else {
      constrainedState.addY(this.handle);
    }
  }
  propagateKnownState(knownState) {
    switch (this.property) {
      case "x":
        if (!knownState.hasX(this.handle) && knownState.hasVar(this.variable)) {
          this.handle.position = {
            x: this.variable.value,
            y: this.handle.position.y
          };
          knownState.addX(this.handle);
          return true;
        } else if (knownState.hasX(this.handle) && !knownState.hasVar(this.variable)) {
          this.variable.value = this.handle.position.x;
          knownState.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      case "y":
        if (!knownState.hasY(this.handle) && knownState.hasVar(this.variable)) {
          this.handle.position = {
            x: this.handle.position.x,
            y: this.variable.value
          };
          knownState.addY(this.handle);
          return true;
        } else if (knownState.hasY(this.handle) && !knownState.hasVar(this.variable)) {
          this.variable.value = this.handle.position.y;
          knownState.addVar(this.variable);
          return true;
        } else {
          return false;
        }
      default:
        throw new Error("unsupported property " + this.property);
    }
  }
  getError([handlePos], [varValue], _knownState, constrainedState) {
    const currValue = handlePos[this.property];
    if (!constrainedState.hasVar(this.variable)) {
      this.variable.value = currValue;
      return 0;
    } else {
      return currValue - varValue;
    }
  }
  getManipulationSet() {
    const handles = this.handles.map((h) => h.canonicalInstance);
    return new ManipulationSet({
      xs: this.property === "x" ? handles : [],
      ys: this.property === "y" ? handles : [],
      vars: this.variables
    });
  }
  onClash(that) {
    if (that && this.variable !== that.variable) {
      const eq = equals(this.variable, that.variable);
      return {
        constraints: [that, ...eq.constraints],
        variables: that.ownedVariables,
        remove() {
          that.remove();
          eq.remove();
        }
      };
    } else {
      return this.toAddConstraintResult();
    }
  }
}
export function formula(args, fn) {
  const result = new Variable(fn(args.map((arg) => arg.value)));
  return addConstraint(new ConstraintKeyGenerator("formula#" + generateId(), [], []), (keyGenerator) => new Formula(args, result, fn, keyGenerator), (existingConstraint) => existingConstraint.onClash());
}
class Formula extends Constraint {
  constructor(args, result, fn, keyGenerator) {
    super([], [...args, result], keyGenerator);
    this.args = args;
    this.result = result;
    this.fn = fn;
    this.ownedVariables = {result: this.result};
  }
  addConstrainedState(constrainedState) {
    for (const arg of this.args) {
      constrainedState.addVar(arg);
    }
  }
  propagateKnownState(knownState) {
    if (!knownState.hasVar(this.result) && this.args.every((arg) => knownState.hasVar(arg))) {
      this.result.value = this.computeResult();
      knownState.addVar(this.result);
      return true;
    } else {
      return false;
    }
  }
  getError(_handlePositions, variableValues, _knownState, constrainedState) {
    const currValue = this.computeResult(variableValues);
    if (!constrainedState.hasVar(this.result)) {
      this.result.value = currValue;
      return 0;
    } else {
      return currValue - this.result.value;
    }
  }
  onClash(_that) {
    throw new Error("Formula.onClash() should never be called!");
  }
  computeResult(xs = this.args.map((arg) => arg.value)) {
    return this.fn(xs);
  }
}
const tempConstraints = new Set();
export const now = {
  clear() {
    for (const constraint of tempConstraints) {
      tempConstraints.delete(constraint);
      constraint.remove();
    }
  },
  constant(variable2, value = variable2.value) {
    return captureNewConstraints(tempConstraints, () => constant(variable2, value));
  },
  equals(a, b) {
    return captureNewConstraints(tempConstraints, () => equals(a, b));
  },
  sum(a, b, c) {
    return captureNewConstraints(tempConstraints, () => sum(a, b, c));
  },
  pin(handle, pos = handle.position) {
    return captureNewConstraints(tempConstraints, () => pin(handle, pos));
  },
  horizontal(a, b) {
    return captureNewConstraints(tempConstraints, () => horizontal(a, b));
  },
  vertical(a, b) {
    return captureNewConstraints(tempConstraints, () => vertical(a, b));
  },
  distance(a, b) {
    return captureNewConstraints(tempConstraints, () => distance(a, b));
  },
  equalDistance(a1, a2, b1, b2) {
    return captureNewConstraints(tempConstraints, () => equalDistance(a1, a2, b1, b2));
  },
  angle(a, b) {
    return captureNewConstraints(tempConstraints, () => angle(a, b));
  },
  fixedAngle(a1, a2, b1, b2, angleValue) {
    return captureNewConstraints(tempConstraints, () => fixedAngle(a1, a2, b1, b2, angleValue));
  },
  polarVector(a, b) {
    return captureNewConstraints(tempConstraints, () => polarVector(a, b));
  },
  property(handle, p) {
    return captureNewConstraints(tempConstraints, () => property(handle, p));
  },
  formula(args, fn) {
    return captureNewConstraints(tempConstraints, () => formula(args, fn));
  }
};
window.allConstraints = Constraint.all;
window.allVariables = Variable.all;
