import SVG from "../Svg";
import { PositionWithPressure } from "../../lib/types";

export default abstract class Stroke {
  constructor(public svg: SVG, public points: PositionWithPressure[]) {}

  abstract render(): void;
}
