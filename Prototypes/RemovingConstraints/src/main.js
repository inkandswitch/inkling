import engine from './engine';
import Canvas from './canvas';
import Relax, {
  Angle,
  FixedPoint,
  FixedVar,
  Horizontal,
  Length,
  MinLength,
  PointEquals,
  Orientation,
  SpreadsheetCell,
  Var,
  VarEquals,
  Vertical,
} from './lib/relax-pk';

import DrawSnap from './draw_snap';

const draw = new DrawSnap();

const canvas = new Canvas(document.body, ctx => {
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
  draw.render(ctx);
});

canvas.canvas.addEventListener('touchstart', e => {
  // Hokey way to detect a press of the mode button while the
  // MultiGestureRecognizer is disabled.
  if (draw.mode === 'scribble' && e.pageX <= 50 && e.pageY <= 50) {
    draw.toggleModes();
  }
});

engine((events) => {
  draw.update(events);
  relax();
  canvas.render();
});

const r = new Relax();

draw.removeBrokenConstraints = function() {
  const noKnowns = { xs: new Set(), ys: new Set(), vars: new Set() };
  for (const c of r.things) {
    if (
      c instanceof Horizontal ||
      c instanceof Vertical ||
      c instanceof Length ||
      c instanceof Orientation
    ) {
      const ds = c.calculateDeltas(noKnowns);
      const dAmounts = ds.map(d => d.getAmount());
      const totalAmount = dAmounts.reduce((x, y) => x + y, 0);
      console.log(c.toString(), totalAmount);
      if (totalAmount > 4) {
        r.remove(c);
        console.log('removed!');
      }
    }
  }
};

function relax() {
  const hgcs = addHandOfGodConstraints(r);
  for (const c of draw.snapConstraints) {
    addSnapConstraints(r, c);
  }
  draw.snapConstraints = [];
  addScribbleConstraints(r);
  if (!draw.freeMode) {
    r.iterateForUpToMillis(15);
  }
  hgcs.forEach(c => r.remove(c));
}

function addHandOfGodConstraints(r) {
  if (!draw.mode.startsWith('move') || !draw.dragging) {
    return [];
  }

  const cs = [];
  
  function addFixedPointConstraint(p) {
    const c = new FixedPoint(p, p.clone());
    r.add(c);
    cs.push(c);
  }

  addFixedPointConstraint(draw.dragging);
  if (draw.mode === 'move-v2') {
    addFixedPointConstraint(draw.fixedPoint);
  }

  return cs;
}

// TODO: ref-counted length and angle vars / constraints
// for each pair of points.
function addSnapConstraints(r, c) {
  if (c.type === 'vertical') {
    r.add(new Vertical(c.a, c.b));
  } else if (c.type === 'horizontal') {
    r.add(new Horizontal(c.a, c.b));
  } else if (c.type === 'length') {
    const v = new Var(c.a.a.distanceTo(c.a.b));
    r.add(new Length(c.a.a, c.a.b, v));
    r.add(new Length(c.b.a, c.b.b, v));
  } else if (c.type === 'minLength') {
    r.add(new MinLength(c.a.a, c.a.b, c.b));
  } else if (c.type === 'relAngle') {
    // TODO: get this right
    const p1 = c.a.a;
    const p2 = c.a.b;
    const a12 = new Var(p2.minus(p1).angleWithXAxis());
    const c12 = new Angle(p1, p2, a12);
    r.add(c12);
    const p3 = c.b.a;
    const p4 = c.b.b;
    const a34 = new Var(p4.minus(p3).angleWithXAxis());
    const c34 = new Angle(p3, p4, a34);
    r.add(c34);
    r.add(new VarEquals(a12, a34));
  } else if (c.type === 'coincident') {
    r.add(new PointEquals(c.a, c.b));
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
    const v = new Var(line.a.distanceTo(line.b));
    v.line = line;
    cachedRScribbleConstraints.push(new Length(line.a, line.b, v));
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
      new Length(line.a, line.b, v)
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
    cachedRScribbleConstraints.push(new Length(line.a, line.b, cell));
  });

  cachedScribbleConstraints = draw.scribbleConstraints;
  cachedRScribbleConstraints.forEach(c => r.add(c));
}
