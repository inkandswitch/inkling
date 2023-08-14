import Vec from "../../lib/vec"
import { generatePathFromPoints } from "../Svg"
import generateId from "../generateId"

export const strokeSvgProperties = {
  stroke: "rgba(0, 0, 0, .5)",
  // fill: 'rgba(0, 0, 0, .5)',
  // 'stroke-width': 1,
  fill: "none",
  "stroke-width": 2,
}

export default class FreehandStroke {
  id = generateId()
  controlPoints: any[]
  pointData
  element
  dirty = true

  constructor(svg, points, cp1, cp2) {
    const [cp1Pos, cp2Pos] = farthestPair(points.filter((p) => p != null))
    cp1.setPosition(cp1Pos)
    cp2.setPosition(cp2Pos)
    this.controlPoints = [cp1, cp2]

    const length = Vec.dist(cp1Pos, cp2Pos)
    const angle = this.currentAngle()
    this.pointData = points.map((p) =>
      p == null
        ? p
        : {
            lengthMultiplier: Vec.dist(cp1Pos, p) / length,
            angleOffset: Vec.angle(Vec.sub(p, cp1Pos)) - angle,
            pressure: p.pressure,
          }
    )

    this.element = svg.addElement("path", {
      d: "",
      ...strokeSvgProperties,
    })
  }

  currentAngle() {
    return Vec.angle(Vec.sub(this.controlPoints[1].position, this.controlPoints[0].position))
  }

  updatePath(svg) {
    const length = Vec.dist(this.controlPoints[0].position, this.controlPoints[1].position)
    const angle = this.currentAngle()
    const points = this.pointData.map((pd) =>
      pd == null
        ? null
        : (({ lengthMultiplier, angleOffset, pressure }) => {
            const p: any = Vec.add(
              this.controlPoints[0].position,
              Vec.polar(angle + angleOffset, length * lengthMultiplier)
            )
            p.pressure = pressure
            return p
          })(pd)
    )
    const path = generatePathFromPoints(points)
    svg.updateElement(this.element, { d: path })
  }

  onControlPointMove(_controlPoint) {
    this.dirty = true
  }

  render(svg) {
    if (!this.dirty) {
      return
    }

    this.updatePath(svg)
    this.dirty = false
  }
}

// this is O(n^2), but there is a O(n * log(n)) solution
// that we can use if this ever becomes a bottleneck
// https://www.baeldung.com/cs/most-distant-pair-of-points
function farthestPair(points) {
  let maxDist = -Infinity
  let mdp1 = null,
    mdp2 = null
  for (const p1 of points) {
    for (const p2 of points) {
      const d = Vec.dist(p1, p2)
      if (d > maxDist) {
        mdp1 = p1
        mdp2 = p2
        maxDist = d
      }
    }
  }
  return [mdp1, mdp2]
}
