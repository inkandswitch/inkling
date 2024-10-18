import { Position } from "../../lib/types"
import SVG from "../Svg"
import { GameObject } from "../GameObject"
import Vec from "../../lib/vec"
import { TAU, lerpN, rand, randInt } from "../../lib/math"

const radius = 20
const padding = 30

export type SerializedMetaToggle = {
  type: "MetaToggle"
  position: Position
}

export const aMetaToggle = (gameObj: GameObject) => (gameObj instanceof MetaToggle ? gameObj : null)

type Splat = {
  elm: SVGElement
  delay: number
  translate: number
  rotate: number
  squish: number
  flip: string
}

function randomAngles() {
  const angles: number[] = []
  for (let i = 0; i < rand(5, 8); i++) {
    angles.push(rand(0, 360))
  }
  return angles
}

function randomSplat(angle: number) {
  const ran = rand(0, 1)
  const curve = ran ** 6
  return {
    delay: ran * 0.17,
    translate: 12 / lerpN(curve, 1, 0.5) ** 2,
    rotate: curve < 0.1 ? rand(0, 360) : angle,
    squish: rand(0, 0.7) * curve,
    flip: rand() < 0 ? "normal" : "reverse"
  }
}

export default class MetaToggle extends GameObject {
  static active = false

  static toggle() {
    MetaToggle.active = !MetaToggle.active
    document.documentElement.toggleAttribute("meta-mode", MetaToggle.active)
  }

  private readonly element: SVGElement
  private splats: Splat[] = []
  dragging = false
  active = false

  serialize(): SerializedMetaToggle {
    return {
      type: "MetaToggle",
      position: this.position
    }
  }

  static deserialize(v: SerializedMetaToggle): MetaToggle {
    return new MetaToggle(v.position)
  }

  constructor(public position = { x: padding, y: padding }) {
    super()

    this.element = SVG.add("g", SVG.guiElm, {
      ...this.getAttrs() // This avoids an unstyled flash on first load
    })

    SVG.add("circle", this.element, { class: "outer", r: radius })
    SVG.add("circle", this.element, { class: "inner", r: radius })
    const splatsElm = SVG.add("g", this.element, { class: "splats" })

    const angles = randomAngles()

    for (let i = 0; i < 50; i++) {
      const points: Position[] = []
      const steps = 5
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * TAU
        const d = rand(0, 4)
        points.push(Vec.polar(a, d))
      }
      points[steps] = points[0]
      const splat: Splat = {
        elm: SVG.add("g", splatsElm, {
          class: "splat"
        }),
        ...randomSplat(angles[randInt(0, angles.length - 1)])
      }
      this.splats.push(splat)
      SVG.add("polyline", splat.elm, { points: SVG.points(points) })
    }
    SVG.add("circle", this.element, { class: "secret", r: radius })
    this.resplat()
    this.snapToCorner()
  }

  resplat() {
    const angles = randomAngles()
    this.splats.forEach((splat) => {
      const s = randomSplat(angles[randInt(0, angles.length - 1)])
      splat.translate = s.translate
      splat.rotate = s.rotate
      splat.squish = s.squish
      SVG.update(splat.elm, {
        style: `
          --delay: ${splat.delay}s;
          --translate: ${splat.translate}px;
          --rotate: ${splat.rotate}deg;
          --scaleX: ${1 + splat.squish};
          --scaleY: ${1 - splat.squish};
          --flip: ${splat.flip};
        `
      })
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
    this.element.remove()
  }

  snapToCorner() {
    this.dragging = false

    const windowSize = Vec(window.innerWidth, window.innerHeight)

    // x and y will be exactly 0 or 1
    const normalizedPosition = Vec.round(Vec.div(this.position, windowSize))

    // x and y will be exactly in a screen corner
    const cornerPosition = Vec.mul(normalizedPosition, windowSize)

    // x and y will be exactly 1 (left&top) or -1 (right&bottom)
    const sign = Vec.addS(Vec.mulS(normalizedPosition, -2), 1)

    // Inset from the corner
    this.position = Vec.add(cornerPosition, Vec.mulS(sign, padding))

    this.resplat()
  }

  private getAttrs() {
    const classes: string[] = ["meta-toggle"]

    if (MetaToggle.active) {
      classes.push("active")
    }

    if (this.dragging) {
      classes.push("dragging")
    }

    return {
      class: classes.join(" "),
      style: `translate: ${this.position.x}px ${this.position.y}px`
    }
  }

  render() {
    if (this.active != MetaToggle.active) {
      this.active = MetaToggle.active
      this.resplat()
    }

    SVG.update(this.element, this.getAttrs())
  }
}
