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

const initializedNames = new Set();

export default {
  init<T extends Serializable>({ name, isValid, def }: InitArgs<T>) {
    // This check is meant to avoid accidental redundant calls.
    // If you find a case where doing redundant calls makes sense,
    // feel free to remove this check, and replace it with a check
    // to ensure the redundant calls have the same isValid type.
    if (initializedNames.has(name)) {
      throw new Error(
        `Store.init() was called more than once for name: ${name}`
      );
    }
    initializedNames.add(name);

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
