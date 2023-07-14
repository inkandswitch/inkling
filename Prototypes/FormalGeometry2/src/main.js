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
  Vertical,
} from './lib/relax-pk';

import DrawSnap from './draw_snap';

// import numeric from 'numeric';
// console.log(numeric.uncmin(vs => Math.pow(vs[0] - 5, 2) + Math.pow(vs[1] - 3, 2), [0, 0]));

const draw = new DrawSnap();
window.draw = draw;

const canvas = new Canvas(document.body, ctx => {
  window.redraw = () => {
    ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
    draw.render(ctx);
  };
  window.redraw();
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

let nIterations;

function relax() {
  const r = new Relax();
  addHandOfGodConstraints(r);
  for (const c of draw.snapConstraints) {
    addSnapConstraints(r, c);
  }
  addScribbleConstraints(r);
  nIterations  = r.iterateForUpToMillis(150);
  window.rrr = r;
}

setInterval(
  () => console.log('nIterations', nIterations),
  1000
);

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

function addSnapConstraints(r, c) {
  if (c.type === 'vertical') {
    promotePointsInLine(c);
    r.add(new Vertical(c.a.pos, c.b.pos));
  } else if (c.type === 'horizontal') {
    promotePointsInLine(c);
    r.add(new Horizontal(c.a.pos, c.b.pos));
  } else if (c.type === 'length') {
    promotePointsInLine(c.a);
    promotePointsInLine(c.b);
    const v = new Var(c.a.a.pos.distanceTo(c.a.b.pos));
    r.add(new Length(c.a.a.pos, c.a.b.pos, v));
    r.add(new Length(c.b.a.pos, c.b.b.pos, v));
    } else if (c.type === 'minLength') {
    promotePointsInLine(c.a);
    r.add(new MinLength(c.a.a.pos, c.a.b.pos, c.b));
  } else if (c.type === 'angle') {
    promotePointsInLine(c.a);
    promotePointsInLine(c.b);
    r.add(new Orientation(c.a.a.pos, c.a.b.pos, c.b.a.pos, c.b.b.pos, Math.PI * c.angle / 180));
  } else {
    throw new Error('unsupported snap constraint ' + c.type);
  }
}

function addScribbleConstraints(r) {
  const vars = {};
  const debug = false;
  for (const c of draw.scribbleConstraints) {
    const line = c.input.line;
    promotePointsInLine(line);
    if (c.type === 'lengthLabel') {
      if (vars[c.name] == null) {
        const v = new Var(line.a.pos.distanceTo(line.b.pos));
        v.line = line;
        vars[c.name] = v;
        if (debug) console.log('var', c.name, v, 'for line', line, 'is initially', v.value);
      }
    }
  }
  for (const c of draw.scribbleConstraints) {
    const line = c.input.line;
    if (c.type === 'lengthLabel') {
      const v = vars[c.name];
      r.add(new Length(line.a.pos, line.b.pos, v));
      if (debug) console.log('line', line, 'has length', c.name, v);
    } else if (c.type === 'lengthConstant') {
      const v = new Var(c.value);
      r.add(new FixedVar(v, c.value));
      r.add(new Length(line.a.pos, line.b.pos, v));
    } else if (c.type === 'lengthFormula') {
      const depVars = c.depNames.map(x => vars[x]);
      if (depVars.some(e => e == null)) {
        // ignore this constraint b/c not all of the variables referenced are bound
        continue;
      }
      if (debug) console.log('la', line.a, 'lb', line.b);
      if (debug) console.log('dla', depVars[0].line.a, 'dlb', depVars[0].line.b);
      if (debug) console.log(line.a === depVars[0].line.a, line.b === depVars[0].line.b);
      if (debug) console.log('dvs', depVars);
      const ss = new SpreadsheetCell(
        {
          xs: [line.a.pos, line.b.pos, depVars[0].line.a.pos, depVars[0].line.b.pos],
          ys: [line.a.pos, line.b.pos, depVars[0].line.a.pos, depVars[0].line.b.pos],
          vars: depVars,
        },
        () => c.fn(vars)
      );
      if (debug) console.log(ss);
      r.add(ss);
      r.add(new Length(line.a.pos, line.b.pos, ss));
      for (let idx = 0; idx < 1000; idx++) {
        r.iterateForUpToMillis(15);
      }
      if (debug) window.redraw();
      if (debug) console.log(r.things);
      if (debug) throw new Error('pause');
    } else {
      throw new Error('unsupported scribble constraint ' + c.type);
    }
  }
}

function promotePointsInLine(l) {
  l.a.pos = toRPoint(l.a.pos);
  l.b.pos = toRPoint(l.b.pos);
}

function toRPoint(p) {
  return p instanceof RPoint ? p : new RPoint(p.x, p.y);
}