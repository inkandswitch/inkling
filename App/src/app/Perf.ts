import Averager from "../lib/Averager"
import Config from "./Config"

const elm: HTMLElement = document.createElement("div")
elm.id = "perf"
document.body.append(elm)

let start = 0
let frameTime = new Averager(10)
const msToPct = (60 / 1000) * 100
const window: number[] = []
const windowSize = 3 * 60 // collect n seconds worth of history for our percentile figures
let peak = 0

const numericSort = (a: number, b: number) => a - b

export function startPerf() {
  if (Config.renderDebugPerf) {
    frameTime.add(performance.now() - start)
    start = performance.now()
  }
}

export function endPerf() {
  if (Config.renderDebugPerf) {
    const end = performance.now()

    // What percentage of our tick time did we spend between the call to start() and end()?
    const percentage = (end - start) * msToPct

    // Add this value to our history window
    window.unshift(percentage)

    // Remove the oldest value from our window
    window.splice(windowSize)

    // Keep track of the highest value we've ever seen (not windowed)
    if (percentage > peak) peak = percentage

    // Compute the 75th and 100th percentile values of the window
    const sorted = window.toSorted(numericSort)
    const p75 = sorted[Math.ceil(sorted.length * 0.75) - 1]
    const p100 = sorted[sorted.length - 1]

    // Get the outstanding writes
    // const writes = core.getOutstandingWrites()

    const fps = Math.round(1000 / frameTime.result)

    // Display the stats
    elm.innerText = `${p75 | 0}% • ${p100 | 0}% • ${peak | 0}% ◼ ${fps}fps`
  }
}
