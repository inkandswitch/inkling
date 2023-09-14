import SVG from "../Svg.js";
export default class Stroke {
  constructor(points) {
    this.points = points;
    this.element = SVG.add("polyline", {
      fill: "none",
      stroke: "#000",
      "stroke-width": 2
    });
  }
  render() {
    SVG.update(this.element, {points: SVG.points(this.points)});
  }
}
