function norm2(x) {
  return Math.sqrt(x.reduce((a, b) => a + b * b, 0));
}
function identity(n) {
  const ret = Array(n);
  for (let i = 0; i < n; i++) {
    ret[i] = Array(n);
    for (let j = 0; j < n; j++) {
      ret[i][j] = +(i == j);
    }
  }
  return ret;
}
function neg(x) {
  return x.map((a) => -a);
}
function dot(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((x) => dot(x, b));
  }
  return a.reduce((x, y, i) => x + y * b[i], 0);
}
function sub(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c, i) => sub(c, b[i]));
  }
  return a.map((c, i) => c - b[i]);
}
function add(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c, i) => add(c, b[i]));
  }
  return a.map((c, i) => c + b[i]);
}
function div(a, b) {
  return a.map((c) => c.map((d) => d / b));
}
function mul(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c) => mul(c, b));
  }
  return a.map((c) => c * b);
}
function ten(a, b) {
  return a.map((c, i) => mul(b, c));
}
export function gradient(f, x) {
  const dim = x.length, f1 = f(x);
  if (isNaN(f1)) {
    throw new Error("The gradient at [" + x.join(" ") + "] is NaN!");
  }
  const {max, abs, min} = Math;
  const tempX = x.slice(0), grad = Array(dim);
  for (let i = 0; i < dim; i++) {
    let delta = max(1e-6 * f1, 1e-8);
    for (let k = 0; ; k++) {
      if (k == 20) {
        throw new Error("Gradient failed at index " + i + " of [" + x.join(" ") + "]");
      }
      tempX[i] = x[i] + delta;
      const f0 = f(tempX);
      tempX[i] = x[i] - delta;
      const f2 = f(tempX);
      tempX[i] = x[i];
      if (!(isNaN(f0) || isNaN(f2))) {
        grad[i] = (f0 - f2) / (2 * delta);
        const t0 = x[i] - delta;
        const t1 = x[i];
        const t2 = x[i] + delta;
        const d1 = (f0 - f1) / delta;
        const d2 = (f1 - f2) / delta;
        const err = min(max(abs(d1 - grad[i]), abs(d2 - grad[i]), abs(d1 - d2)), delta);
        const normalize = max(abs(grad[i]), abs(f0), abs(f1), abs(f2), abs(t0), abs(t1), abs(t2), 1e-8);
        if (err / normalize < 1e-3) {
          break;
        }
      }
      delta /= 16;
    }
  }
  return grad;
}
export function minimize(f, x0, maxit = 1e3, tol = 1e-8, end_on_line_search = false) {
  tol = Math.max(tol, 2e-16);
  const grad = (a) => gradient(f, a);
  x0 = x0.slice(0);
  let g0 = grad(x0);
  let f0 = f(x0);
  if (isNaN(f0)) {
    throw new Error("minimize: f(x0) is a NaN!");
  }
  const n = x0.length;
  let H1 = identity(n);
  for (var it = 0; it < maxit; it++) {
    if (!g0.every(isFinite)) {
      var msg = "Gradient has Infinity or NaN";
      break;
    }
    const step = neg(dot(H1, g0));
    if (!step.every(isFinite)) {
      var msg = "Search direction has Infinity or NaN";
      break;
    }
    const nstep = norm2(step);
    if (nstep < tol) {
      var msg = "Newton step smaller than tol";
      break;
    }
    let t = 1;
    const df0 = dot(g0, step);
    let x1 = x0;
    var s;
    for (; it < maxit && t * nstep >= tol; it++) {
      s = mul(step, t);
      x1 = add(x0, s);
      var f1 = f(x1);
      if (!(f1 - f0 >= 0.1 * t * df0 || isNaN(f1))) {
        break;
      }
      t *= 0.5;
    }
    if (t * nstep < tol && end_on_line_search) {
      var msg = "Line search step size smaller than tol";
      break;
    }
    if (it === maxit) {
      var msg = "maxit reached during line search";
      break;
    }
    const g1 = grad(x1);
    const y = sub(g1, g0);
    const ys = dot(y, s);
    const Hy = dot(H1, y);
    H1 = sub(add(H1, mul(ten(s, s), (ys + dot(y, Hy)) / (ys * ys))), div(add(ten(Hy, s), ten(s, Hy)), ys));
    x0 = x1;
    f0 = f1;
    g0 = g1;
  }
  return {
    solution: x0,
    f: f0,
    gradient: g0,
    invHessian: H1,
    iterations: it,
    message: msg
  };
}
