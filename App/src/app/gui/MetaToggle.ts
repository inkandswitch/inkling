import { Position, isBoolean, isPosition } from "../../lib/types"
import SVG from "../Svg"
import { GameObject } from "../GameObject"
import Vec from "../../lib/vec"
import Store, { Serializable } from "../Store"
import { TAU, lerpN, rand, randInt } from "../../lib/math"
import Config from "../Config"

const radius = 20
const padding = 30

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
  private readonly element: SVGElement
  position: Position
  dragging = false

  // This state doesn't belong here, but moving it means we need a way for Meta Toggle
  // to run code whenever it changes. I don't feel like tackling RX nonsense right now.
  private static _active = false
  public static get active() {
    return this._active
  }
  public get active() {
    return MetaToggle.active
  }

  private splats: Splat[] = []

  constructor() {
    super()

    this.position = Store.init({
      name: "Meta Toggle Position",
      isValid: isPosition,
      def: { x: padding, y: padding }
    })

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

    if (Store.init({ name: "Meta Mode", isValid: isBoolean, def: false })) {
      this.toggle()
    }
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

  toggle() {
    MetaToggle._active = !MetaToggle._active
    document.documentElement.toggleAttribute("meta-mode", MetaToggle.active)

    if (!MetaToggle.active) {
      this.resplat()
    }

    Store.set("Meta Mode", MetaToggle.active)
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

    Store.set("Meta Toggle Position", this.position as unknown as Serializable)
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
    SVG.update(this.element, this.getAttrs())
  }
}
