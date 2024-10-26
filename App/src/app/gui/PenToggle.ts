import { Position } from "../../lib/types"
import SVG from "../Svg"
import { GameObject } from "../GameObject"
import Vec from "../../lib/vec"
import { TAU, lerpN, rand, randInt } from "../../lib/math"
import Config from "../Config"

const radius = 20
const padding = 30

export type SerializedPenToggle = {
  type: "PenToggle"
  position: Position
}

export const aPenToggle = (gameObj: GameObject) => (gameObj instanceof PenToggle ? gameObj : null)

export default class PenToggle extends GameObject {
  static active = false

  static toggle(doToggle = !PenToggle.active) {
    PenToggle.active = doToggle
    document.documentElement.toggleAttribute("pen-mode", PenToggle.active)
  }

  private readonly element: SVGElement
  active = false

  serialize(): SerializedPenToggle {
    return {
      type: "PenToggle",
      position: this.position
    }
  }

  static deserialize(v: SerializedPenToggle): PenToggle {
    return new PenToggle(v.position)
  }

  constructor(public position = { x: padding, y: padding }) {
    super()

    this.element = SVG.add("g", SVG.guiElm, {
      ...this.getAttrs() // This avoids an unstyled flash on first load
    })

    SVG.add("circle", this.element, {
      r: 10
    })
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point)
  }

  remove() {
    this.element.remove()
  }

  private getAttrs() {
    const classes: string[] = ["pen-toggle"]
    this.position = { x: window.innerWidth / 2, y: 20 }

    if (PenToggle.active) {
      classes.push("active")
    }

    if (Config.fallback) {
      classes.push("showing")
    }

    return {
      class: classes.join(" "),
      style: `translate: ${this.position.x}px ${this.position.y}px`
    }
  }

  render() {
    if (this.active != PenToggle.active) {
      this.active = PenToggle.active
    }

    SVG.update(this.element, this.getAttrs())
  }
}
