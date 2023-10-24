export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

type InitArgs<T extends Serializable> = {
  name: string;
  isValid: (value: Serializable) => value is T;
  def: T;
};

export default {
  init<T extends Serializable>({ name, isValid, def }: InitArgs<T>) {
    const result = this.get(name);
    return isValid(result) ? result : def;
  },

  set<T extends Serializable>(key: string, val: T) {
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): any {
    return JSON.parse(localStorage.getItem(key) || 'null');
  },
};
