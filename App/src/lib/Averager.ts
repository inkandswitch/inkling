// Averager
// Makes it easy to get the average of a series of numbers.
// Useful for, eg, smoothing positional input over successive frames.

export default class Averager {
  public result = 0
  private tally = 0

  // limit (required) — the number of values to retain and average
  // values (optional) — a seed array of values to start with
  constructor(public limit: number, public values: number[] = []) {
    if (limit <= 1) throw new Error("You shouldn't use Averager with such a small limit")
    this.reset(values)
  }

  public reset(values: number[] = []) {
    if (values.length > this.limit) throw new Error("Too many values passed to Averager")
    this.values = values
    this.tally = this.values.reduce((a: number, b: number) => a + b, 0)
    this.result = this.tally / Math.max(1, this.values.length)
  }

  public add(value: number) {
    if ("number" !== typeof value) throw new Error("Averager only accepts numbers")
    this.tally += value
    this.values.push(value)
    while (this.values.length > this.limit) this.tally -= this.values.shift() ?? 0
    this.result = this.tally / this.values.length
    return this.result
  }

  public reduce(fn: (a: number, b: number) => number, initial = 0) {
    return this.values.reduce(fn, initial)
  }
}
