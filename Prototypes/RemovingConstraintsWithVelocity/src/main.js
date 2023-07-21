import engine from './engine';
import Canvas from './canvas';
import Relax, {
  FixedPoint,
  FixedVar,
  Horizontal,
  Length,
  MinLength,
  Orientation,
  Point as RPoint,
  SpreadsheetCell,
  Var,
  VarEquals,
  Vertical,
} from './lib/relax-pk';

import DrawSnap from './draw_snap';

const draw = new DrawSnap();
window.draw = draw;

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

const r = new Relax();
window.r = r;

draw.onYank = function(p, v) {
  // console.log('p', p, 'v', v);

  if (Math.abs(v.y) < 1) {
    console.log('remove vertical!');
    for (const c of r.things) {
      if (c instanceof Vertical && c.involves(p)) {
        r.remove(c);
      }
    }
  }

  if (Math.abs(v.x) < 1) {
    console.log('remove horizontal!');
    for (const c of r.things) {
      if (c instanceof Horizontal && c.involves(p)) {
        r.remove(c);
      }
    }
  }

  // TODO: try something more sophisticated for orientation constraints
  // (this version is too loose)
  for (const c of r.things) {
    if (c instanceof Orientation && c.involves(p)) {
      console.log('remove orientation!');
      r.remove(c);
    }
  }

  const ANGLE_TOLERANCE = 35 * Math.PI / 180;
  const yankAngle1 = v.angleWithXAxis() + Math.PI; // puts it into (0, 2pi) range
  const yankAngle2 = v.scaledBy(-1).angleWithXAxis() + Math.PI; // same as above
  for (const c of r.things) {
    if (!(c instanceof Length && c.involves(p))) {
      continue;
    }
    const lineAngle = c.p2.minus(c.p1).angleWithXAxis() + Math.PI;
    if (
      Math.abs(yankAngle1 - lineAngle) <= ANGLE_TOLERANCE ||
      Math.abs(yankAngle2 - lineAngle) <= ANGLE_TOLERANCE
    ) {
      r.remove(c);
    }
  }

  // TODO: remove PointEquals constraints, too
  // (will take more work b/c they're not reified ATM)
};

function relax() {
  const hgcs = addHandOfGodConstraints(r);
  for (const c of draw.snapConstraints) {
    addSnapConstraints(r, c);
  }
  draw.snapConstraints = [];
  addScribbleConstraints(r);
  r.iterateForUpToMillis(15);
  hgcs.forEach(c => r.remove(c));
}

function addHandOfGodConstraints(r) {
  if (!draw.mode.startsWith('move') || !draw.dragging) {
    return [];
  }

  const cs = [];
  
  function addFixedPointConstraint(dp) {
    const p = dp.pos;
    const c = new FixedPoint(p, new RPoint(p.x, p.y));
    r.add(c);
    cs.push(c);
  }

  addFixedPointConstraint(draw.dragging);
  if (draw.mode === 'move-v2') {
    addFixedPointConstraint(draw.fixedPoint);
  }

  return cs;
}

function addSnapConstraints(r, c) {
  if (c.type === 'vertical') {
    r.add(new Vertical(c.a.pos, c.b.pos));
  } else if (c.type === 'horizontal') {
    r.add(new Horizontal(c.a.pos, c.b.pos));
  } else if (c.type === 'length') {
    const v = new Var(c.a.a.pos.distanceTo(c.a.b.pos));
    r.add(new Length(c.a.a.pos, c.a.b.pos, v));
    r.add(new Length(c.b.a.pos, c.b.b.pos, v));
    } else if (c.type === 'minLength') {
    r.add(new MinLength(c.a.a.pos, c.a.b.pos, c.b));
  } else if (c.type === 'angle') {
    r.add(new Orientation(c.a.a.pos, c.a.b.pos, c.b.a.pos, c.b.b.pos, Math.PI * c.angle / 180));
  } else {
    throw new Error('unsupported snap constraint ' + c.type);
  }
}

let cachedScribbleConstraints = [];
let cachedRScribbleConstraints = [];

function addScribbleConstraints(r) {
  if (draw.scribbleConstraints === cachedScribbleConstraints) {
    return;
  }

  console.log('scribble constraints changed!');

  cachedRScribbleConstraints.forEach(c => r.remove(c));
  cachedRScribbleConstraints = [];

  // length labels
  const varsByName = {};
  draw.scribbleConstraints.filter(c => c.type === 'lengthLabel').forEach(c => {
    const line = c.input.line;
    const v = new Var(line.a.pos.distanceTo(line.b.pos));
    v.line = line;
    cachedRScribbleConstraints.push(new Length(line.a.pos, line.b.pos, v));
    if (varsByName[c.name] == null) {
      varsByName[c.name] = [];
    }
    varsByName[c.name].push(v);
  });
  for (const vars of Object.values(varsByName)) {
    if (vars.length > 1) {
      cachedRScribbleConstraints.push(new VarEquals(...vars));
    }
  }

  // length constants
  draw.scribbleConstraints.filter(c => c.type === 'lengthConstant').forEach(c => {
    const line = c.input.line;
    const v = new Var(c.value);
    cachedRScribbleConstraints.push(
      new FixedVar(v, c.value),
      new Length(line.a.pos, line.b.pos, v)
    );
  });

  // length formulas
  draw.scribbleConstraints.filter(c => c.type === 'lengthFormula').forEach(c => {
    const line = c.input.line;
    if (c.depNames.length !== 1) {
      throw new Error('todo');
    }
    const varName = c.depNames[0];
    const modifiableVars = varsByName[varName];
    if (modifiableVars == null) {
      // name is not bound yet, so ignore this constraint
      return;
    }

    const modifiablePoints = [line.a, line.b];
    const otherLines = modifiableVars.map(v => v.line);
    otherLines.forEach(otherLine => modifiablePoints.push(otherLine.a, otherLine.b));

    const env = {};
    env[varName] = modifiableVars[0];
    const cell = new SpreadsheetCell(
      { xs: modifiablePoints, ys: modifiablePoints, vars: modifiableVars },
      () => c.fn(env)
    );
    cachedRScribbleConstraints.push(cell);
    cachedRScribbleConstraints.push(new Length(line.a.pos, line.b.pos, cell));
  });

  cachedScribbleConstraints = draw.scribbleConstraints;
  cachedRScribbleConstraints.forEach(c => r.add(c));
}
