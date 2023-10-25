export default {
  init({name, isValid, def}) {
    const result = this.get(name);
    return isValid(result) ? result : def;
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key) || "null");
  }
};
