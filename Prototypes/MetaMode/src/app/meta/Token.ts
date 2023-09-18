import { Position } from "../../lib/types";
import Collection from "./Collection";
import Formula from "./Formula";

export default abstract class Token {
  abstract updateView(): void;
  abstract isPointInside(position: Position): boolean;
  parent: Collection | Formula | null = null;
  position: Position = {x: 0, y: 0};
  width: number = 100;
  height: number = 40;
}
