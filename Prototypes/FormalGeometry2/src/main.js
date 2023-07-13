import engine from './engine';
import Canvas from './canvas';
import Relax, {
  FixedPoint,
  Horizontal,
  Length,
  MinLength,
  Orientation,
  Point as RPoint,
  Var,
  Vertical,
} from './lib/relax-pk';

import DrawSnap from './draw_snap';

// import numeric from 'numeric';
// console.log(numeric.uncmin(vs => Math.pow(vs[0] - 5, 2) + Math.pow(vs[1] - 3, 2), [0, 0]));

const draw = new DrawSnap();

const canvas = new Canvas(document.body, ctx => {
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
  draw.render(ctx);
});

canvas.canvas.addEventListener('touchstart', e => {
  // Hokey way to detect a press of the mode button while the
  // MultiGestureRecognizer is disabled.
  if (
    draw.mode === 'scribble' &&
    e.pageX <= 50 &&
    e.pageY <= 50
  ) {
    draw.toggleModes();
  }
});

engine((events) => {
  draw.update(events);
  relax();
  canvas.render();
});

function relax() {
  const r = new Relax();
  addHandOfGodConstraints(r);
  for (const c of draw.constraints) {
    addConstraints(r, c);
  }
  r.iterateForUpToMillis(15);
}

function addHandOfGodConstraints(r) {
  if (!draw.mode.startsWith('move') || !draw.dragging) {
    return;
  }

  function addFixedPointConstraint(dp) {
    const p = toRPoint(dp.pos);
    dp.pos = p;
    r.add(new FixedPoint(p, new RPoint(p.x, p.y)));
  }

  addFixedPointConstraint(draw.dragging);
  if (draw.mode === 'move-v2') {
    addFixedPointConstraint(draw.fixedPoint);
  }
}

function addConstraints(r, c) {
  if (c.type === 'vertical') {
    c.a.pos = toRPoint(c.a.pos);
    c.b.pos = toRPoint(c.b.pos);
    r.add(new Vertical(c.a.pos, c.b.pos));
  }

  if (c.type === 'horizontal') {
    c.a.pos = toRPoint(c.a.pos);
    c.b.pos = toRPoint(c.b.pos);
    r.add(new Horizontal(c.a.pos, c.b.pos));
  }

  if (c.type === 'length') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    c.b.a.pos = toRPoint(c.b.a.pos);
    c.b.b.pos = toRPoint(c.b.b.pos);
    const v = new Var(c.a.a.pos.distanceTo(c.a.b.pos));
    r.add(new Length(c.a.a.pos, c.a.b.pos, v));
    r.add(new Length(c.b.a.pos, c.b.b.pos, v));
  }

  if (c.type === 'minLength') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    r.add(new MinLength(c.a.a.pos, c.a.b.pos, c.b));
  }

  if (c.type === 'angle') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    c.b.a.pos = toRPoint(c.b.a.pos);
    c.b.b.pos = toRPoint(c.b.b.pos);
    r.add(new Orientation(c.a.a.pos, c.a.b.pos, c.b.a.pos, c.b.b.pos, Math.PI * c.angle / 180));
  }
}

function toRPoint(p) {
  return p instanceof RPoint ? p : new RPoint(p.x, p.y);
}