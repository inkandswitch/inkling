export type Storable = null | boolean | number | string | Storable[] | { [key: string]: Storable }

type InitArgs<T extends Storable> = {
  name: string
  isValid: (value: Storable) => value is T
  def: T
}

const initializedNames = new Set()

export default {
  init<T extends Storable>({ name, isValid, def }: InitArgs<T>) {
    // This check is meant to avoid accidental redundant calls.
    // If you find a case where doing redundant calls makes sense,
    // feel free to remove this check, and replace it with a check
    // to ensure the redundant calls have the same isValid type.
    if (initializedNames.has(name)) {
      throw new Error(`Store.init() was called more than once for name: ${name}`)
    }
    initializedNames.add(name)

    const result = this.get(name)
    return isValid(result) ? result : def
  },

  set<T extends Storable>(key: string, val: T) {
    localStorage.setItem(key, JSON.stringify(val))
    return val
  },

  get(key: string): any {
    return JSON.parse(localStorage.getItem(key) || "null")
  }
}
