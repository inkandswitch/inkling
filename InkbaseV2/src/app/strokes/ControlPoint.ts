import Point from "./Point"

export default class ControlPoint extends Point {
  constructor(svg, position, public parent?) {
    super(svg, position)
    svg.updateElement(this.elements.normal, {
      r: 5,
      fill: "rgba(100, 100, 100, .2)",
    })
  }

  setPosition(position) {
    super.setPosition(position)
    this.parent?.onControlPointMove(this)
  }
}
