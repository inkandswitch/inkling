import Vec from "./vec";

const Vec3 = (x = 0, y = 0, z = 0) => {
  return { x, y, z };
};
export default Vec3;

Vec3.of = (s) => {
  return Vec3(s, s, s);
};

  
// Piecewise Vector Arithmetic ////////////////////////////////////////////////

Vec3.add = (a, b) => {
    return Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
};

Vec3.div = (a, b) => {
    return Vec3(a.x / b.x, a.y / b.y, a.z / b.z);
};

Vec3.mul = (a, b) => {
    return Vec3(a.x * b.x, a.y * b.y, a.z * b.z);
};

Vec3.sub = (a, b) => {
    return Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
};

// Vector-Scalar Arithmetic ///////////////////////////////////////////////////

Vec3.addS = (v, s) => {
    return Vec3.add(v, Vec3.of(s));
};

Vec3.divS = (v, s) => {
    return Vec3.div(v, Vec3.of(s));
};

Vec3.mulS = (v, s) => {
    return Vec3.mul(v, Vec3.of(s));
};

Vec3.subS = (v, s) => {
    return Vec3.sub(v, Vec3.of(s));
};

// Scalar-Vector Arithmetic ///////////////////////////////////////////////////

Vec3.Sadd = (s, v) => {
    return Vec3.add(Vec3.of(s), v);
};

Vec3.Sdiv = (s, v) => {
    return Vec3.div(Vec3.of(s), v);
};

Vec3.Smul = (s, v) => {
    return Vec3.mul(Vec3.of(s), v);
};

Vec3.Ssub = (s, v) => {
    return Vec3.sub(Vec3.of(s), v);
};

// Rotate
Vec3.rotX = (v, ang) => {
    return Vec3(
        v.x,
        v.y * Math.cos(ang) - v.z * Math.sin(ang),
        v.y * Math.sin(ang) + v.z * Math.cos(ang),
    )
}

Vec3.rotY = (v, ang) => {
    return Vec3(
        v.x * Math.cos(ang) - v.z * Math.sin(ang),
        v.y,
        v.x * Math.sin(ang) + v.z * Math.cos(ang)
    )
}

Vec3.rotZ = (v, ang) => {
    return Vec3(
        v.x * Math.cos(ang) - v.y * Math.sin(ang),
        v.x * Math.sin(ang) + v.y * Math.cos(ang),
        v.z
    )
}


Vec3.rotX90cw = (v) => {
    return Vec3(
        v.x,
        v.z,
        -v.y
    )
}

Vec3.dot = (a, b) => {
    return a.x * b.x + a.y * b.y + a.z * b.z;
};

Vec3.normalize = (v) => {
    return Vec3.divS(v, Vec3.len(v));
};

Vec3.len = (v) => {
    return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
};

