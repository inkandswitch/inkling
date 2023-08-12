import Page from "../Page"
import SVG from "../Svg"
import { Tool } from "./Tool"

export default class TextTool extends Tool {
  points: any[]
  element: any

  constructor(public svg: SVG, buttonX: number, buttonY: number, public page: Page) {
    super(svg, buttonX, buttonY)
    this.points = []
    this.element = null
  }

  update(events) {
    const pencilDown = events.did("pencil", "began")
    if (pencilDown) {
      this.points = [pencilDown.position]
    }

    const pencilMove = events.did("pencil", "moved")
    if (pencilMove) {
      this.points.push(pencilMove.position)
    }

    const pencilUp = events.did("pencil", "ended")
    if (pencilUp) {
    }
  }

  render(svg) {}
}
