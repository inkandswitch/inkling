/**
 * Optimizations that I haven't implemented yet:
 * - equality constraints should be special,
 *   maybe we can keep track of the equivalence between the points,
 *   and keep a map from point -> delta
 *   and every time a delta is applied, we can apply it to all of them (or something)
 * - keep track of "dirty" dependencies, that way we don't have to do any work
 *   in calculateDeltas() if nothing has changed.
 *   (similar to Fisher's Continuously Evaluating Expression)
 * - fixed point and var constraints can get baked into knowns set?
 *   (would need to recompute it when a constraint changes, which could be messy)
 */

const PROPAGATE_KNOWNS = true;

// -------

// inteface Delta {
//   curb(knowns: { xs, ys, vs }): void;
//   isSignificant(epsilon: number): boolean;
//   apply(rho: number): void;
// }

// -------

export class Var {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return `var(${this.value})`;
  }
}

class VarDelta {
  constructor(v, amount, constraint) {
    this.v = v;
    this.amount = amount;
    this.constraint = constraint;
  }

  toString() {
    return `${this.v} += ${this.amount} from ${this.constraint}`;
  }

  curb(knowns) {
    if (knowns.vars.has(this.v)) {
      this.amount = 0;
    }
  }

  isSignificant(epsilon) {
    return Math.abs(this.amount) > epsilon;
  }

  apply(rho) {
    this.v.value += this.amount * rho;
  }

  draw(_rc) {
    // TODO
  }
}

// -------

export class Point {
  constructor(x, y, optColor) {
    this.x = x;
    this.y = y;
    if (optColor != null) {
      this.color = optColor;
    }
  }

  toString() {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
  }

  contains(p, rc) {
    const distSquared =
      Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2);
    return Math.pow(rc.pointRadius, 2) >= distSquared;
  }

  onClick(rc) {
    console.log('' + this);
    for (const t of relax.things) {
      if (t.involves != null && t.involves(this)) {
        console.log('* ' + t);
      }
    }
  }

  plus(that) {
    return new Point(
      this.x + that.x,
      this.y + that.y
    );
  }

  minus(that) {
    return new Point(
      this.x - that.x,
      this.y - that.y
    );
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distanceTo(that) {
    return this.minus(that).magnitude();
  }

  scaledBy(m) {
    return new Point(
      this.x * m,
      this.y * m
    );
  }

  rotatedBy(theta) {
    const t = theta * Math.PI / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    return new Point(
      this.x * c - this.y * s,
      this.x * s + this.y * c
    );
  }

  rotatedAroundBy(axis, theta) {
    return axis.plus(this.minus(axis).rotatedBy(theta));
  }

  angleWithXAxis() {
    return Math.atan2(this.y, this.x) * 180 / Math.PI;
  }

  angleWithYAxis() {
    return this.angleWithXAxis() - 90;
  }

  normalized() {
    return this.scaledBy(1 / this.magnitude());
  }

  dot(that) {
    return this.x * that.x + this.y * that.y;
  }

  clone() {
    return new Point(this.x, this.y);
  }

  draw(rc) {
    const oldFillStyle = rc.ctxt.fillStyle;
    rc.ctxt.fillStyle = this.isSelected ? 'yellow' : this.color ?? 'cornflowerblue';
    rc.ctxt.beginPath();
    rc.ctxt.arc(rc.toScreenX(this.x), rc.toScreenY(this.y), rc.pointRadius, 0, 2 * Math.PI);
    rc.ctxt.closePath();
    rc.ctxt.fill();
    if (this.selectionIndices && this.selectionIndices.length > 0) {
      rc.drawSelectionIndices(this);
    }
    rc.ctxt.fillStyle = oldFillStyle;
  }
}

class PointDelta {
  constructor(p, amount, constraint) {
    this.p = p;
    this.amount = amount;
    this.constraint = constraint;
  }

  toString() {
    return `${this.p} += ${this.amount} from ${this.constraint}`;
  }

  curb(knowns) {
    if (knowns.xs.has(this.p)) {
      this.amount.x = 0;
    }
    if (knowns.ys.has(this.p)) {
      this.amount.y = 0;
    }
  }

  isSignificant(epsilon) {
    return this.amount.magnitude() > epsilon;
  }

  apply(rho) {
    const d = this.amount.scaledBy(rho);
    this.p.x += d.x;
    this.p.y += d.y;
  }

  draw(rc) {
    const p1 = this.p;
    const p2 = p1.plus(this.amount);

    const x1 = rc.toScreenX(p1.x);
    const y1 = rc.toScreenY(p1.y);
    const x2 = rc.toScreenX(p2.x);
    const y2 = rc.toScreenY(p2.y);
    if (Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) < 0.5) {
      return;
    }

    const ctxt = rc.ctxt;
    const origStrokeStyle = ctxt.strokeStyle;
    ctxt.strokeStyle = 'rgba(255,0,0,0.5)'
    ctxt.beginPath();

    ctxt.moveTo(x1, y1);
    ctxt.lineTo(x2, y2);

    const headSize = rc.pointRadius * 0.8;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    ctxt.lineTo(x2 - headSize * Math.cos(angle - Math.PI / 6), y2 - headSize * Math.sin(angle - Math.PI / 6));
    ctxt.moveTo(x2, y2);
    ctxt.lineTo(x2 - headSize * Math.cos(angle + Math.PI / 6), y2 - headSize * Math.sin(angle + Math.PI / 6));

    ctxt.closePath();
    ctxt.stroke();
    ctxt.strokeStyle = origStrokeStyle;
  }
}

// -------

class Line {
  constructor(p1, p2, optColor) {
    this.p1 = p1;
    this.p2 = p2;
    if (optColor != null) {
      this.color = optColor;
    }
  }

  toString() {
    return `Line(${this.p1}, ${this.p2})`;
  }

  involves(thing) {
    return thing === this.p1 || thing === this.p2;
  }

  draw(rc) {
    const oldLineWidth = rc.ctxt.lineWidth;
    const oldStrokeStyle = rc.ctxt.strokeStyle;
    rc.ctxt.beginPath();
    rc.ctxt.moveTo(rc.toScreenX(this.p1.x), rc.toScreenY(this.p1.y));
    rc.ctxt.lineWidth = 3;
    rc.ctxt.strokeStyle = this.color ?? 'rgba(0,0,0,0.15)';
    rc.ctxt.lineTo(rc.toScreenX(this.p2.x), rc.toScreenY(this.p2.y));
    rc.ctxt.closePath();
    rc.ctxt.stroke();
    rc.ctxt.lineWidth = oldLineWidth;
    rc.ctxt.strokeStyle = oldStrokeStyle;
  }
}

// -------

// interface Thing {
//   involves(Thing): boolean; // optional
//   contains(Point, Canvas): boolean; // optional
//   beforeTick(Relax); // optional
//   propagateKnowns(knowns: { xs, ys, vars }): boolean; // optional
//   calculateDeltas(knowns: { xs, ys, vars }): Delta[]; // optional
//   afterTick(Relax); // optional
//   drawUnder(Canvas); // optional
//   drawOver(Canvas); // optional
// }

// -------

export default class Relax {
  rho = 0.25;
  epsilon = 0.001;
  things = new Set();
  points = new Set();
  lines = new Set();

  add(thing) {
    this.things.add(thing);
    if (thing instanceof Point) {
      this.points.add(thing);
    } else if (thing instanceof Line) {
      this.lines.add(thing);
    }
    return this;
  }

  find(thingPred) {
    for (const t of this.things) {
      if (thingPred(t)) {
        return t;
      }
    }
    return null;
  }

  findAll(thingPred) {
    const ans = [];
    for (const t of this.things) {
      if (thingPred(t)) {
        ans.push(t);
      }
    }
    return ans;
  }

  remove(unwantedThing) {
    this.things.delete(unwantedThing);
    if (unwantedThing instanceof Point) {
      this.points.delete(unwantedThing);
    } else if (unwantedThing instanceof Line) {
      this.lines.delete(unwantedThing);
    }
    // TODO: also remove things involving unwantedThing?
    return this;
  }

  clear() {
    this.things.clear();
    this.points.clear();
    this.lines.clear();
    return this;
  }

  // Every time a thing actually does something, we break out of the loop and start over.
  // This ensures that the non-finger constraints get their say first.
  // (Which avoids weirdness "in the middle".)
  propagateKnowns(knowns) {
    while (true) {
      let didSomething = false;
      for (const t of this.things) {
        if (t.propagateKnowns != null && t.propagateKnowns(knowns)) {
          didSomething = true;
          break;
        }
      }
      if (!didSomething) {
        break;
      }
    }
  }

  runOneIteration() {
    for (const t of this.things) {
      if (t.beforeTick != null) {
        t.beforeTick(this);
      }
    }

    const knowns = { xs: new Set(), ys: new Set(), vars: new Set() };
    if (PROPAGATE_KNOWNS) {
      this.propagateKnowns(knowns);
    }

    const allDeltas = [];
    for (const t of this.things) {
      if (t.calculateDeltas == null) {
        continue;
      }
      const deltas = t.calculateDeltas(knowns);
      for (const d of deltas) {
        d.curb(knowns);
      }
      if (deltas.some(d => d.isSignificant(this.epsilon))) {
        allDeltas.push(...deltas);
      }
    }

    let ans;
    if (allDeltas.length > 0) {
      for (const d of allDeltas) {
        d.apply(this.rho);
      }
      ans = true;
    } else {
      ans = false;
    }

    for (const t of this.things) {
      if (t.afterTick != null) {
        ans = t.afterTick(this) || ans;
      }
    }

    return ans;
  }

  iterateForUpToMillis(
    milliseconds,
    beforeEachIterationFn,
    afterEachIterationFn
  ) {
    let count = 0;
    const t0 = Date.now();
    Time.nowSeconds = t0 / 1_000;
    while (Date.now() - t0  < milliseconds) {
      if (beforeEachIterationFn) {
        beforeEachIterationFn(count + 1);
      }
      const changedSomething = this.runOneIteration(t0);
      if (afterEachIterationFn) {
        afterEachIterationFn(count + 1);
      }
      if (changedSomething) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}

// -------

class FixedVar {
  constructor(v, wanted) {
    this.v = v;
    this.wanted = wanted;
  }

  involves(_thing) {
    return false;
  }

  propagateKnowns(knowns) {
    if (!knowns.vars.has(this.v)) {
      this.v.value = this.wanted;
      knowns.vars.add(this.v);
      return true;
    } else {
      return false;
    }
  }

  calculateDeltas(_knowns) {
    return [new VarDelta(this.v, this.wanted - this.v.value, this)];
  }


  toString() {
    return `FixedVar(${this.v}, ${this.wanted})`;
  }
}

export class VarEquals {
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
  }

  involves(thing) {
    return thing === this.v1 || thing === this.v2;
  }

  propagateKnowns(knowns) {
    if (knowns.vars.has(this.v1) && !knowns.vars.has(this.v2)) {
      this.v2.value = this.v1.value;
      knowns.vars.add(this.v2);
      return true;
    } else if (knowns.vars.has(this.v2) && !knowns.vars.has(this.v1)) {
      this.v1.value = this.v2.value;
      knowns.vars.add(this.v1);
      return true;
    } else {
      return false;
    }
  }

  calculateDeltas(_knowns) {
    const diff = this.v2.value - this.v1.value;
    return [
      new VarDelta(this.v1, diff / 2, this),
      new VarDelta(this.v2, -diff / 2, this)
    ];
  }


  toString() {
    return `VarEquals(${this.v1}, ${this.v2})`;
  }
}

export class FixedPoint {
  constructor(p, wanted) {
    this.p = p;
    this.wanted = wanted;
  }

  involves(thing) {
    return thing === this.p;
  }

  propagateKnowns(knowns) {
    let ans = false;
    if (!knowns.xs.has(this.p)) {
      this.p.x = this.wanted.x;
      knowns.xs.add(this.p);
      ans = true;
    }
    if (!knowns.ys.has(this.p)) {
      this.p.y = this.wanted.y;
      knowns.ys.add(this.p);
      ans = true;
    }
    return ans;
  }

  calculateDeltas(_knowns) {
    return [new PointDelta(this.p, this.wanted.minus(this.p), this)];
  }

  toString() {
    return `FixedPoint(${this.p}, ${this.wanted})`;
  }

  drawOver(rc) {
    const ctxt = rc.ctxt;
    const origFillStyle = ctxt.fillStyle;
    ctxt.fillStyle = 'black';
    ctxt.beginPath();
    ctxt.arc(
      rc.toScreenX(this.wanted.x),
      rc.toScreenY(this.wanted.y),
      rc.pointRadius * 0.4,
      0,
      2 * Math.PI
    );
    ctxt.closePath();
    ctxt.fill();
    ctxt.fillStyle = origFillStyle;
  }
}

class ManyPointConstraint {
  constructor(ps) {
    this.ps = ps;
  }

  involves(thing) {
    return this.ps.includes(thing);
  }

  propagateKnowns(_knowns) {
    throw new Error('subclass responsibility');
  }

  calculateDeltas(_knowns) {
    throw new Error('subclass responsibility');
  }

  toString() {
    return `${this.constructor.name}(${this.ps.join(', ')})`;
  }
}

export class Horizontal extends ManyPointConstraint {
  constructor(...ps) {
    super(ps);
  }

  propagateKnowns(knowns) {
    const knownY = this.ps.find(p => knowns.ys.has(p))?.y;
    if (knownY == null) {
      return false;
    }
    let ans = false;
    for (const p of this.ps) {
      if (!knowns.ys.has(p)) {
        p.y = knownY;
        knowns.ys.add(p);
        ans = true;
      }
    }
    return ans;
  }

  calculateDeltas(_knowns) {
    const avgY = this.ps.map(p => p.y).reduce((a, b) => a + b) / this.ps.length;
    return this.ps.map(p => new PointDelta(p, new Point(0, avgY - p.y), this));
  }

  drawUnder(rc) {
    if (!rc.showConstraints) {
      return;
    }

    const ctxt = rc.ctxt;
    const avgY = this.ps.map(p => p.y).reduce((a, b) => a + b) / this.ps.length;

    const origGlobalAlpha = ctxt.globalAlpha;
    ctxt.globalAlpha = 0.125;
    const arr = [5, 10];
    ctxt.setLineDash(arr);
    ctxt.beginPath();
    ctxt.moveTo(0, rc.toScreenY(avgY));
    ctxt.lineTo(rc.canvas.width, rc.toScreenY(avgY));
    ctxt.closePath();
    ctxt.stroke();
    ctxt.globalAlpha = origGlobalAlpha;
    ctxt.setLineDash([]);
  }
}

export class Vertical extends ManyPointConstraint {
  constructor(...ps) {
    super(ps);
  }

  propagateKnowns(knowns) {
    const knownX = this.ps.find(p => knowns.xs.has(p))?.x;
    if (knownX == null) {
      return false;
    }
    let ans = false;
    for (const p of this.ps) {
      if (!knowns.xs.has(p)) {
        p.x = knownX;
        knowns.xs.add(p);
        ans = true;
      }
    }
    return ans;
  }

  calculateDeltas(_knowns) {
    const avgX = this.ps.map(p => p.x).reduce((a, b) => a + b) / this.ps.length;
    return this.ps.map(p => new PointDelta(p, new Point(avgX - p.x, 0), this));
  }

  drawUnder(rc) {
    if (!rc.showConstraints) {
      return;
    }

    const ctxt = rc.ctxt;
    const avgX = this.ps.map(p => p.x).reduce((a, b) => a + b) / this.ps.length;

    const origGlobalAlpha = ctxt.globalAlpha;
    ctxt.globalAlpha = 0.125;
    ctxt.setLineDash([5, 10]);
    ctxt.beginPath();
    ctxt.moveTo(rc.toScreenX(avgX), 0);
    ctxt.lineTo(rc.toScreenX(avgX), rc.canvas.height);
    ctxt.closePath();
    ctxt.stroke();
    ctxt.globalAlpha = origGlobalAlpha;
    ctxt.setLineDash([]);
  }
}

class TwoPointConstraint {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  involves(thing) {
    return thing === this.p1 || thing === this.p2;
  }

  propagateKnowns(_knowns) {
    throw new Error('subclass responsibility');
  }

  calculateDeltas(_knowns) {
    throw new Error('subclass responsibility');
  }

  toString() {
    return `${this.constructor.name}(${this.p1}, ${this.p2})`;
  }
}

// TODO: make optMinAmount into a variable
class Above extends TwoPointConstraint {
  constructor(p1, p2, optMinAmount) {
    super(p1, p2);
    this.minAmount = optMinAmount == null ? 0 : optMinAmount;
  }

  propagateKnowns(_knowns) {
    // this is an inequality, so we can't determine p2 from p1 and vice-versa
    return false;
  }

  calculateDeltas(_knowns) {
    const dy = this.p1.y - this.minAmount - this.p2.y;
    return dy > 0
      ? []
      : [
        new PointDelta(this.p1, new Point(0, -dy / 2), this),
        new PointDelta(this.p2, new Point(0, dy / 2), this)
      ];
  }

  toString() {
    return `Above(${this.p1}, ${this.p2}, ${this.minAmount})`;
  }
}

export class Length extends TwoPointConstraint {
  constructor(p1, p2, length) {
    super(p1, p2);
    this.length = length;
  }

  beforeTick(relax) {
    delete this.fixedLengthConstraint;
    for (const t of relax.things) {
      if (t instanceof FixedVar && t.v === this.length) {
        this.fixedLengthConstraint = t;
      }
    }
  }

  propagateKnowns(knowns) {
    if (
      !knowns.vars.has(this.length) &&
      knowns.xs.has(this.p1) && knowns.ys.has(this.p1) &&
      knowns.xs.has(this.p2) && knowns.ys.has(this.p2)
    ) {
      this.length.value = this.p1.distanceTo(this.p2);
      knowns.vars.add(this.length);
      return true;
    } else {
      // if we know p1 and length, p2 could be anywhere along a circle
      // same for p2 and length.
      return false;
    }
    // TODO: If we know length, p1.x, p1.y, and p2.x we still can't
    // tell what p2.y should be (b/c there are two possible values).
    // Should think about coming up with a *directional* `Length`
    // constraint that doesn't have this problem.
  }

  calculateDeltas(_knowns) {
    // TODO: if this.length is known, don't generate a delta for it
    // TODO: if this.length and one of the points is known, only generate delta for other point
    // etc.
    const v12 = this.p2.minus(this.p1);
    const actualLength = v12.magnitude();
    const diff = (actualLength - this.length.value) / 3;
    const e12 = v12.normalized();
    return [
      new VarDelta(this.length, diff, this),
      new PointDelta(this.p1, e12.scaledBy(diff), this),
      new PointDelta(this.p2, e12.scaledBy(-diff), this)
    ];
  }

  toString() {
    return `Length(${this.p1}, ${this.p2}, ${this.length})`;
  }

  contains(p, rc) {
    if (!rc.showConstraints) {
      return false;
    }

    const xIsIn =
      this.p1.x - 10 < p.x && p.x < this.p2.x + 10 ||
      this.p2.x - 10 < p.x && p.x < this.p1.x + 10;

    const yIsIn =
      this.p1.y - 10 < p.y && p.y < this.p2.y + 10 ||
      this.p2.y - 10 < p.y && p.y < this.p1.y + 10;

    return xIsIn && yIsIn;
  }

  onClick(rc) {
    if (this.fixedLengthConstraint != null) {
      rc.remove(this.fixedLengthConstraint);
    } else {
      rc.addThing(new FixedVar(this.length, this.length.value));
    }
  }

  drawOver(rc) {
    if (!rc.showConstraints) {
      return;
    }

    const ctxt = rc.ctxt;
    const origLineWidth = ctxt.lineWidth;
    const origStrokeStyle = ctxt.strokeStyle;
    const origFillStyle = ctxt.fillStyle;
    const origFont = ctxt.font;
    const origTextAlign = ctxt.textAlign;
    const origTextBaseline = ctxt.textBaseline;

    ctxt.lineWidth = 1;
    ctxt.strokeStyle = ctxt.fillStyle = 'rgba(0,0,255,0.2)';
    ctxt.beginPath();

    const angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    const dist = 20;
    const p1x = this.p1.x - dist * Math.cos(angle + Math.PI / 2);
    const p1y = this.p1.y - dist * Math.sin(angle + Math.PI / 2);
    const p2x = this.p2.x - dist * Math.cos(angle + Math.PI / 2);
    const p2y = this.p2.y - dist * Math.sin(angle + Math.PI / 2);

    const textCenterX = rc.toScreenX((p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2));
    const textCenterY = rc.toScreenY((p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2));

    ctxt.moveTo(
      rc.toScreenX(p1x + 5 * Math.cos(angle + Math.PI / 2)),
      rc.toScreenY(p1y + 5 * Math.sin(angle + Math.PI / 2))
    );
    ctxt.lineTo(
      rc.toScreenX(p1x - 5 * Math.cos(angle + Math.PI / 2)),
      rc.toScreenY(p1y - 5 * Math.sin(angle + Math.PI / 2))
    );

    ctxt.moveTo(rc.toScreenX(p1x), rc.toScreenY(p1y));
    ctxt.lineTo(rc.toScreenX(p2x), rc.toScreenY(p2y));

    ctxt.moveTo(
      rc.toScreenX(p2x + 5 * Math.cos(angle + Math.PI / 2)),
      rc.toScreenY(p2y + 5 * Math.sin(angle + Math.PI / 2))
    );
    ctxt.lineTo(
      rc.toScreenX(p2x - 5 * Math.cos(angle + Math.PI / 2)),
      rc.toScreenY(p2y - 5 * Math.sin(angle + Math.PI / 2))
    );

    ctxt.closePath();
    ctxt.stroke();

    ctxt.textAlign = 'center';
    ctxt.textBaseline = 'middle';
    ctxt.font = '14pt PT-sans';
    ctxt.fillStyle = this.fixedLengthConstraint != null ? 'rgba(0,0,255,0.4)' : 'rgba(255,0,0,0.4)';
    ctxt.fillText(Math.round(this.length.value), textCenterX, textCenterY);

    ctxt.lineWidth = origLineWidth;
    ctxt.strokeStyle = origStrokeStyle;
    ctxt.fillStyle = origFillStyle;
    ctxt.font = origFont;
    ctxt.textAlign = origTextAlign;
    ctxt.textBaseline = origTextBaseline;
  }
}

export class MinLength extends TwoPointConstraint {
  constructor(p1, p2, length) {
    super(p1, p2);
    this.length = length;
  }

  propagateKnowns(_knowns) {
    return false;
  }

  calculateDeltas(_knowns) {
    const v12 = this.p2.minus(this.p1);
    const actualLength = v12.magnitude();
    if (actualLength >= this.length) {
      return [];
    }

    const diff = (actualLength - this.length) / 2;
    const e12 = v12.normalized();
    return [
      new PointDelta(this.p1, e12.scaledBy(diff), this),
      new PointDelta(this.p2, e12.scaledBy(-diff), this)
    ];
  }

  toString() {
    return `MinLength(${this.p1}, ${this.p2}, ${this.length})`;
  }
}

class PointEquals extends TwoPointConstraint {
  constructor(p1, p2) {
    super(p1, p2);
  }

  propagateKnowns(knowns) {
    let ans = false;

    // xs
    if (knowns.xs.has(this.p1) && !knowns.xs.has(this.p2)) {
      this.p2.x = this.p1.x;
      knowns.xs.add(this.p2);
      ans = true;
    } else if (knowns.xs.has(this.p2) && !knowns.xs.has(this.p1)) {
      this.p1.x = this.p2.x;
      knowns.xs.add(this.p1);
      ans = true;
    }

    // ys
    if (knowns.ys.has(this.p1) && !knowns.ys.has(this.p2)) {
      this.p2.y = this.p1.y;
      knowns.ys.add(this.p2);
      ans = true;
    } else if (knowns.ys.has(this.p2) && !knowns.ys.has(this.p1)) {
      this.p1.y = this.p2.y;
      knowns.ys.add(this.p1);
      ans = true;
    }

    return ans;
  }

  calculateDeltas(_knowns) {
    const diff = this.p2.minus(this.p1);
    return [
      new PointDelta(this.p1, diff.scaledBy(0.5), this),
      new PointDelta(this.p2, diff.scaledBy(-0.5), this)
    ];
  }
}

class ThreePointConstraint {
  constructor(p1, p2, p3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  involves(thing) {
    return thing === this.p1 || thing === this.p2 || thing === this.p3;
  }

  propagateKnowns(_knowns) {
    throw new Error('subclass responsibility');
  }

  calculateDeltas(_knowns) {
    throw new Error('subclass responsibility');
  }

  toString() {
    return `${this.constructor.name}(${this.p1}, ${this.p2}, ${this.p3})`;
  }
}

class FourPointConstraint {
  constructor(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  involves(thing) {
    return thing === this.p1 || thing === this.p2 || thing === this.p3 || thing === this.p4;
  }

  propagateKnowns(_knowns) {
    throw new Error('subclass responsibility');
  }

  calculateDeltas(_knowns) {
    throw new Error('subclass responsibility');
  }

  toString() {
    return `${this.constructor.name}(${this.p1}, ${this.p2}, ${this.p3}, ${this.p4})`;
  }
}

// Orientation constraint, i.e., "Maintain angle between p1->p2 and p3->p4 at theta."
export class Orientation extends FourPointConstraint {
  constructor(l1p1, l1p2, l2p1, l2p2, theta) {
    super(l1p1, l1p2, l2p1, l2p2);
    this.theta = theta;
  }

  propagateKnowns(_knowns) {
    return false;
  }

  calculateDeltas(_knowns) {
    const v12 = this.p2.minus(this.p1);
    const a12 = Math.atan2(v12.y, v12.x);
    const m12 = this.p1.plus(this.p2).scaledBy(0.5);

    const v34 = this.p4.minus(this.p3);
    const a34 = Math.atan2(v34.y, v34.x);
    const m34 = this.p3.plus(this.p4).scaledBy(0.5);

    const currTheta = (a12 - a34 + 2 * Math.PI) % (2 * Math.PI);
    const dTheta = (this.theta - currTheta) % (2 * Math.PI);
    // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
    // and seems to make sense) results in jumpy/unstable behavior.

    return [
      new PointDelta(this.p1, this.p1.rotatedAroundBy(m12, dTheta).minus(this.p1), this),
      new PointDelta(this.p2, this.p2.rotatedAroundBy(m12, dTheta).minus(this.p2), this),
      new PointDelta(this.p3, this.p3.rotatedAroundBy(m34, -dTheta).minus(this.p3), this),
      new PointDelta(this.p4, this.p4.rotatedAroundBy(m34, -dTheta).minus(this.p4), this),
    ];
  }

  currTheta() {
    const v12 = this.p2.minus(this.p1);
    const a12 = Math.atan2(v12.y, v12.x);

    const v34 = this.p4.minus(this.p3);
    const a34 = Math.atan2(v34.y, v34.x);

    return a12 - a34;
  }
}

// p1 + p2 = p3
class PointPlus extends ThreePointConstraint {
  constructor(p1, p2, p3) {
    super(p1, p2, p3);
  }

  propagateKnowns(knowns) {
    let ans = false;

    // xs
    if (knowns.xs.has(this.p1) && knowns.xs.has(this.p2) && !knowns.xs.has(this.p3)) {
      this.p3.x = this.p1.x + this.p2.x;
      knowns.xs.add(this.p3);
      ans = true;
    } else if (knowns.xs.has(this.p1) && knowns.xs.has(this.p3) && !knowns.xs.has(this.p2)) {
      this.p2.x = this.p3.x - this.p1.x;
      knowns.xs.add(this.p2);
      ans = true;
    } else if (knowns.xs.has(this.p2) && knowns.xs.has(this.p3) && !knowns.xs.has(this.p1)) {
      this.p1.x = this.p3.x - this.p2.x;
      knowns.xs.add(this.p1);
      ans = true;
    }

    // ys
    if (knowns.ys.has(this.p1) && knowns.ys.has(this.p2) && !knowns.ys.has(this.p3)) {
      this.p3.y = this.p1.y + this.p2.y;
      knowns.ys.add(this.p3);
      ans = true;
    } else if (knowns.ys.has(this.p1) && knowns.ys.has(this.p3) && !knowns.ys.has(this.p2)) {
      this.p2.y = this.p3.y - this.p1.y;
      knowns.ys.add(this.p2);
      ans = true;
    } else if (knowns.ys.has(this.p2) && knowns.ys.has(this.p3) && !knowns.ys.has(this.p1)) {
      this.p1.y = this.p3.y - this.p2.y;
      knowns.ys.add(this.p1);
      ans = true;
    }

    return ans;
  }

  calculateDeltas(_knowns) {
    const dx = this.p3.x - (this.p1.x + this.p2.x);
    const dy = this.p3.y - (this.p1.y + this.p2.y);
    return [
      new PointDelta(this.p1, new Point(+dx / 3, +dy / 3), this),
      new PointDelta(this.p2, new Point(+dx / 3, +dy / 3), this),
      new PointDelta(this.p3, new Point(-dx / 3, -dy / 3), this)
    ];
  }

  drawOver(rc) {
    if (!rc.showConstraints) {
      return;
    }

    const avgX = avg(this.p1.x, this.p2.x, this.p3.x);
    const avgY = avg(this.p1.y, this.p2.y, this.p3.y);

    const equalsX = avgX - 10;
    const plusX = avgX + 10;

    const ctxt = rc.ctxt;
    const origLineWidth = ctxt.lineWidth;
    const origStrokeStyle = ctxt.strokeStyle;
    const origFillStyle = ctxt.fillStyle;
    const origFont = ctxt.font;
    const origTextAlign = ctxt.textAlign;
    const origTextBaseline = ctxt.textBaseline;

    ctxt.lineWidth = 1;
    ctxt.strokeStyle = ctxt.fillStyle = 'rgba(255,255,0,1)';
    ctxt.beginPath();

    ctxt.moveTo(rc.toScreenX(plusX), rc.toScreenY(avgY));
    ctxt.lineTo(rc.toScreenX(this.p1.x), rc.toScreenY(this.p1.y));
    ctxt.moveTo(rc.toScreenX(plusX), rc.toScreenY(avgY));
    ctxt.lineTo(rc.toScreenX(this.p2.x), rc.toScreenY(this.p2.y));
    ctxt.moveTo(rc.toScreenX(equalsX), rc.toScreenY(avgY));
    ctxt.lineTo(rc.toScreenX(this.p3.x), rc.toScreenY(this.p3.y));

    ctxt.closePath();
    ctxt.stroke();

    ctxt.textAlign = 'center';
    ctxt.textBaseline = 'middle';
    ctxt.font = '14pt PT-sans';
    ctxt.fillStyle = 'black';
    ctxt.fillText('+', rc.toScreenX(plusX), rc.toScreenY(avgY));
    ctxt.fillText('=', rc.toScreenX(equalsX), rc.toScreenY(avgY));

    ctxt.lineWidth = origLineWidth;
    ctxt.strokeStyle = origStrokeStyle;
    ctxt.fillStyle = origFillStyle;
    ctxt.font = origFont;
    ctxt.textAlign = origTextAlign;
    ctxt.textBaseline = origTextBaseline;
  }
}

// p1 * n = p2
class PointTimes extends TwoPointConstraint {
  constructor(p1, n, p2) {
    super(p1, p2);
    this.n = n;
  }

  propagateKnowns(knowns) {
    let ans = false;

    // xs
    if (knowns.xs.has(this.p1) && knowns.vars.has(this.n) && !knowns.xs.has(this.p2)) {
      this.p2.x = this.p1.x * this.n.value;
      knowns.xs.add(this.p2);
      ans = true;
    } else if (knowns.xs.has(this.p1) && knowns.xs.has(this.p2) && !knowns.vars.has(this.n)) {
      this.n.value = this.p2.x / this.p1.x;
      knowns.vars.add(this.n);
      ans = true;
    } else if (knowns.vars.has(this.n) && knowns.xs.has(this.p2) && !knowns.xs.has(this.p1)) {
      this.p1.x = this.p2.x / this.n.value;
      knowns.xs.add(this.p1);
      ans = true;
    }

    // ys
    if (knowns.ys.has(this.p1) && knowns.vars.has(this.n) && !knowns.ys.has(this.p2)) {
      this.p2.y = this.p1.y * this.n.value;
      knowns.ys.add(this.p2);
      ans = true;
    } else if (knowns.ys.has(this.p1) && knowns.ys.has(this.p2) && !knowns.vars.has(this.n)) {
      this.n.value = this.p2.y / this.p1.y;
      knowns.vars.add(this.n);
      ans = true;
    } else if (knowns.vars.has(this.n) && knowns.ys.has(this.p2) && !knowns.ys.has(this.p1)) {
      this.p1.y = this.p2.y / this.n.value;
      knowns.ys.add(this.p1);
      ans = true;
    }

    return ans;
  }

  // TODO: change n, too!
  calculateDeltas(_knowns) {
    const xDiff = this.p2.x - this.n.value * this.p1.x;
    const yDiff = this.p2.y - this.n.value * this.p1.y;
    return [
      new PointDelta(this.p1, new Point(+xDiff / 2 / this.n.value, +yDiff / 2 / this.n.value), this),
      new PointDelta(this.p2, new Point(-xDiff / 2, -yDiff / 2), this)
    ];
  }
}

// -------

class Time {
  constructor(v) {
    this.v = v;
  }

  propagateKnowns(knowns) {
    if (!knowns.vars.has(this.v)) {
      this.v.value = Time.nowSeconds;
      knowns.vars.add(this.v);
      return true;
    } else {
      return false;
    }
  }

  calculateDeltas(_knowns) {
    const diff = Time.nowSeconds - this.v.value;
    return [new VarDelta(this.v, diff, this)];
  }
}

// -------

class Clock extends TwoPointConstraint {
  constructor(p1, p2, length, speed, nowSeconds) {
    super(p1, p2);
    this.length = length;
    this.speed = speed;
    this.nowSeconds = nowSeconds;
  }

  propagateKnowns(knowns) {
    if (!knowns.vars.has(this.nowSeconds)) {
      return false;
    }

    const theta = this.calculateTheta(this.nowSeconds.value);
    let ans = false;

    // xs
    if (knowns.xs.has(this.p1) && !knowns.xs.has(this.p2)) {
      this.p2.x = this.p1.x + this.length * Math.cos(theta);
      knowns.xs.add(this.p2);
      ans = true;
    }

    // xs
    if (knowns.ys.has(this.p1) && !knowns.ys.has(this.p2)) {
      this.p2.y = this.p1.y + this.length * Math.sin(theta);
      knowns.ys.add(this.p2);
      ans = true;
    }

    return ans;
  }

  calculateDeltas(_knowns) {
    const theta = this.calculateTheta(this.nowSeconds.value);
    const wantedX = this.p1.x + this.length * Math.cos(theta);
    const wantedY = this.p1.y + this.length * Math.sin(theta);
    return [
      new PointDelta(
        this.p2,
        new Point(
          wantedX - this.p2.x,
          wantedY - this.p2.y
        ),
        this
      )
    ];
  }

  calculateTheta(seconds) {
    return -seconds / (60 / this.speed) * 2 * Math.PI;
  }
}

// -------

class PropertyPicker {
  constructor(p, property, v) {
    if (property !== 'x' && property !== 'y') {
      throw new Error('PropertyPicker only supports x and y');
    }
    this.p = p;
    this.property = property;
    this.v = v;
  }

  involves(thing) {
    return thing === this.p || thing === this.v;
  }

  propagateKnowns(knowns) {
    if (this.property === 'x') {
      if (knowns.xs.has(this.p) && !knowns.vars.has(this.v)) {
        this.v.value = this.p.x;
        knowns.vars.add(this.v);
        return true;
      } else if (knowns.vars.has(this.v) && !knowns.xs.has(this.p)) {
        this.p.x = this.v.value;
        knowns.xs.add(this.p);
        return true;
      }
    } else if (this.property === 'y') {
      if (knowns.ys.has(this.p) && !knowns.vars.has(this.v)) {
        this.v.value = this.p.y;
        knowns.vars.add(this.v);
        return true;
      } else if (knowns.vars.has(this.v) && !knowns.ys.has(this.p)) {
        this.p.y = this.v.value;
        knowns.ys.add(this.p);
        return true;
      }
    }
    return false;
  }

  calculateDeltas(_knowns) {
    if (this.property === 'x') {
      const diff = this.v.value - this.p.x;
      return [
        new PointDelta(this.p, new Point(diff / 2, 0), this),
        new VarDelta(this.v, -diff / 2, this)
      ];
    } else if (this.property === 'y') {
      const diff = this.v.value - this.p.y;
      return [
        new PointDelta(this.p, new Point(0, diff / 2), this),
        new VarDelta(this.v, -diff / 2, this)
      ];
    } else {
      throw new Error('impossible');
    }
  }
}

// -------

class SpreadsheetCell extends Var {
  epsilon = 0.001;
  tinyDelta = 0.000001;
  maxIterations = 100;

  constructor(inputs /* { xs, ys, vars } */, computeValueFn) {
    super(0);
    this.inputs = inputs;
    this.computeValueFn = computeValueFn;
  }

  toString() {
    return `SpreadsheetCell(${this.value}, ${this.computeValueFn.toString().substring(6)})`;
  }

  involves(thing) {
    // TODO: this isn't always right, e.g., in the slider example
    return this.inputs.xs?.includes(thing)
      || this.inputs.ys?.includes(thing)
      || this.inputs.vars?.includes(thing);
  }

  propagateKnowns(knowns) {
    if (
      !knowns.vars.has(this) &&
      this.allKnown(this.inputs.xs, knowns.xs) &&
      this.allKnown(this.inputs.ys, knowns.ys) &&
      this.allKnown(this.inputs.vars, knowns.vars)
    ) {
      this.value = this.computeValue();
      knowns.vars.add(this);
      return true;
    } else {
      // TODO: use relaxation if result is known and all but one of the inputs are known
     return false;
    }
  }

  allKnown(inputs, knowns) {
    return inputs == null || inputs.every(input => knowns.has(input));
  }

  // Note: this method changes the values of the inputs.
  // It is the caller's responsibility to snapshot their values before calling this
  // method, and restore their values afterwards.
  currentValueHasNoSolution(realKnowns) {
    const knowns = {
      vars: {
        has: (v) => {
          return v === this || realKnowns.vars?.has(v);
        }
      },
      xs: {
        has: (p) => {
          return realKnowns.xs?.has(p);
        }
      },
      ys: {
        has: (p) => {
          return realKnowns.ys?.has(p);
        }
      }
    };
    const error = this.relax(knowns);
    return error > this.epsilon;
  }

  relax(knowns) {
    let idx = 0, error;
    while (true) {
      error = this.calculateError();
      if (idx++ >= this.maxIterations || error <= this.epsilon) {
        break;
      }

      let numNonZeroDeltaAmounts = 0;
      const calculateDeltaAmounts = (things, property, knowns) => {
        if (things == null) {
          return null;
        }
        const deltaAmounts = [];
        for (const thing of things) {
          if (knowns && knowns.has(thing)) {
            deltaAmounts.push(0);
            continue;
          }
          const m = this.derivativeOfErrorWrt(thing, property);
          const b = error - m * thing[property];
          const newValue = -b / m;
          const deltaAmount = isFinite(newValue) ? newValue - thing[property] : 0;
          if (deltaAmount !== 0) {
            numNonZeroDeltaAmounts++;
          }
          deltaAmounts.push(deltaAmount);
        }

        return deltaAmounts;
      };

      const deltaAmounts = {
        xs: calculateDeltaAmounts(this.inputs.xs, 'x', knowns.xs),
        ys: calculateDeltaAmounts(this.inputs.ys, 'y', knowns.ys),
        vars: calculateDeltaAmounts(this.inputs.vars, 'value', knowns.vars),
        self: calculateDeltaAmounts([this], 'value', knowns.vars)[0]
      };

      if (numNonZeroDeltaAmounts === 0) {
        error = this.calculateError();
        break;
      }

      deltaAmounts.xs?.forEach((dx, idx) => this.inputs.xs[idx].x += dx / numNonZeroDeltaAmounts);
      deltaAmounts.ys?.forEach((dy, idx) => this.inputs.ys[idx].y += dy / numNonZeroDeltaAmounts);
      deltaAmounts.vars?.forEach((dv, idx) => this.inputs.vars[idx].value += dv / numNonZeroDeltaAmounts);
      this.value += deltaAmounts.self / numNonZeroDeltaAmounts;
    }
    return error;
  }

  calculateDeltas(knowns) {
    const snapshot = this.snapshotInputs();
    const origValue = this.value;
    const restoreState = () => {
      this.restoreInputs(snapshot);
      this.value = origValue;
    }

    const noSolution = this.currentValueHasNoSolution(knowns);
    restoreState();
    if (noSolution) {
      // Don't mess around b/c that will result in jank!
      return [];
    }

    const error = this.relax(knowns);
    if (error > this.epsilon) {
      // Didn't find a good solution, so we'll just try to fix the output.
      if (knowns.vars?.has(this)) {
        // ... but if we're not allowed to change the output, just give up.
        restoreState();
        return [];
      } else {
        const newValue = this.computeValue();
        restoreState();
        return [new VarDelta(this, newValue - this.value, this)];
      }
    }
    
    const newValues = {
      self: this.value,
      xs: this.inputs.xs?.map(p => p.x),
      ys: this.inputs.ys?.map(p => p.y),
      vars: this.inputs.vars?.map(v => v.value)
    };
    restoreState();
    const deltas = [new VarDelta(this, newValues.self - this.value, this)];
    if (newValues.xs) {
      deltas.push(
        ...newValues.xs.map(
          (newValue, idx) =>
            new PointDelta(
              this.inputs.xs[idx],
              new Point(newValue - this.inputs.xs[idx].x, 0),
              this
            )
        )
      );
    }
    if (newValues.ys) {
      deltas.push(
        ...newValues.ys.map(
          (newValue, idx) =>
            new PointDelta(
              this.inputs.ys[idx],
              new Point(0, newValue - this.inputs.ys[idx].y),
              this
            )
        )
      );
    }
    if (newValues.vars) {
      deltas.push(
        ...newValues.vars.map(
          (newValue, idx) =>
            new VarDelta(
              this.inputs.vars[idx],
              newValue - this.inputs.vars[idx].value,
              this
            )
        )
      );
    }
    return deltas;
  }

  derivativeOfErrorWrt(thing, property) {
    const origValue = thing[property];

    const calcDerivative = (x0, x1) => {
      thing[property] = x0;
      const y0 = this.calculateError();
      thing[property] = x1;
      const y1 = this.calculateError();
      thing[property] = origValue;
      return (y1 - y0) / (x1 - x0);
    }

    let m = calcDerivative(origValue - this.tinyDelta, origValue + this.tinyDelta);
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue, origValue + this.tinyDelta);
    }
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue - this.tinyDelta, origValue);
    }
    return m;
  }

  calculateError() {
    return Math.abs(this.computeValue() - this.value);
  }

  computeValue(setValue) {
    const v = this.computeValueFn();
    if (setValue) {
      this.value = v;
    }
    return v;
  }

  snapshotInputs() {
    return {
      xs: this.inputs.xs?.map(p => p.x),
      ys: this.inputs.ys?.map(p => p.y),
      vars: this.inputs.vars?.map(v => v.value)
    };
  }

  restoreInputs(snapshot) {
    this.inputs.xs?.forEach((p, idx) => {
      p.x = snapshot.xs[idx];
    });
    this.inputs.ys?.forEach((p, idx) => {
      p.y = snapshot.ys[idx];
    });
    this.inputs.vars?.forEach((v, idx) => v.value = snapshot.vars[idx]);
  }
}

// -------

class MidPoint extends ThreePointConstraint {
  constructor(p1, pm, p3, optFract) {
    super(p1, pm, p3);
    const fract = optFract ?? 0.5;
    const pmX = new SpreadsheetCell(
      { xs: [p1, p3] },
      () =>  p1.x + fract * (p3.x - p1.x)
    );
    const pmY = new SpreadsheetCell(
      { ys: [p1, p3] },
      () => p1.y +fract * (p3.y - p1.y)
    );
    this.constraints = [
      pmX, new PropertyPicker(pm, 'x', pmX),
      pmY, new PropertyPicker(pm, 'y', pmY)
    ];
  }

  propagateKnowns(knowns) {
    let ans = false;
    for (const c of this.constraints) {
      ans = c.propagateKnowns(knowns) || ans;
    }
    return ans;
  }

  calculateDeltas(knowns) {
    return this.constraints.flatMap(c => c.calculateDeltas(knowns));
  }
}

function avg(...xs) {
  return xs.reduce((a, b) => a + b) / xs.length;
}
