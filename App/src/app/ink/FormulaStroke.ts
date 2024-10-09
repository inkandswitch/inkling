import Stroke from "./Stroke"
import SVG from "../Svg"

export default class FormulaStroke extends Stroke {
  protected element = SVG.add("polyline", SVG.guiElm, {
    class: "formula stroke"
  })
}
