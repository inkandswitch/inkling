import { Position } from "../../lib/types"
import SVG from "../Svg"
import { GameObject } from "../GameObject"
import Vec from "../../lib/vec"
import Store from "../Store"
import Config from "../Config"
import Selected from "../Selected"

export const aToolbar = (gameObj: GameObject) => (gameObj instanceof Toolbar ? gameObj : null)

type Side = "top" | "left" | "right" | "bottom"

const isSide = (v: any): v is Side => ["top", "left", "right", "bottom"].indexOf(v) >= 0

function sideToPosition(side: Side) {
  if (side === "top" || side === "bottom") {
    const y = side === "top" ? Config.gui.padding : window.innerHeight - Config.gui.padding
    return Vec(window.innerWidth / 2, y)
  } else {
    const x = side === "left" ? Config.gui.padding : window.innerWidth - Config.gui.padding
    return Vec(x, window.innerHeight / 2)
  }
}

export default class Toolbar extends GameObject {
  private readonly element: SVGElement
  side: Side
  position: Position
  dragging = false

  showing = false

  constructor() {
    super()

    this.side = Store.init({
      name: "Toolbar Side",
      isValid: isSide,
      def: "top"
    })

    this.position = sideToPosition(this.side)

    this.element = SVG.add("foreignObject", SVG.guiElm, {
      content: `
        <main>
          <div>X</div>
          <div>Y</div>
          <div>Z</div>
        </main>
      `
    })
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point)
  }

  dragTo(position: Position) {
    this.dragging = true
    this.position = position
  }

  remove() {
    window.location.reload()
  }

  snapToSide() {
    this.dragging = false

    const windowSize = Vec(window.innerWidth, window.innerHeight)

    // x and y will be between 0 and 1
    const normalizedPosition = Vec.div(this.position, windowSize)

    // x and y will be between -.5 and .5
    const symmetricPosition = Vec.subS(normalizedPosition, 0.5)

    // x and y will be between |-.5| and |.5|
    const absPosition = Vec.abs(symmetricPosition)

    SVG.showStatus(`${symmetricPosition.x} ${symmetricPosition.y}`)

    if (absPosition.x > absPosition.y) {
      this.side = Math.sign(symmetricPosition.x) < 0 ? "left" : "right"
    } else {
      this.side = Math.sign(symmetricPosition.y) < 0 ? "top" : "bottom"
    }

    this.position = sideToPosition(this.side)

    Store.set("Toolbar Side", this.side)
  }

  private getAttrs() {
    const classes: string[] = ["toolbar"]

    if (this.dragging) {
      classes.push("dragging")
    }

    if (Selected.size > 0) {
      classes.push("showing")
    }

    const vertical = this.side === "left" || this.side === "right"

    classes.push(vertical ? "vertical" : "horizontal")

    return {
      class: classes.join(" "),
      x: this.position.x - (vertical ? 20 : 55),
      y: this.position.y - (vertical ? 55 : 20),
      width: vertical ? 40 : 110,
      height: vertical ? 110 : 40
    }
  }

  render() {
    SVG.update(this.element, this.getAttrs())
  }
}
