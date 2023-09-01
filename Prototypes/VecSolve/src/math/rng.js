// LCG using GCC's constants
let m = 0x80000000; // 2**31;
let a = 1103515245;
let c = 12345;
let seed = 20; //Chosen by dice roll, guaranteed to be random
let state = seed;

export function seedRandom(s = 20) {
  seed = s;
  state = s;
}

export function randomInt() {
  state = (a * state + c) % m;
  return state;
}

export function randomFloat() {
  return randomInt() / (m - 1);
}

export function randomOffset(number, offset) {
  let a = (randomFloat()-0.5)*offset;
  return number + a 
}

export function deterministicRandomFloat(input) {
  return ((a * input + c) % m) / (m - 1);
}
