import { signedDistanceToBox } from "../../lib/SignedDistance";
import Rect from "../../lib/rect";
import { Position } from "../../lib/types";
import { GameObject } from "../GameObject";
import Svg from "../Svg";
import { MetaStruct } from './MetaSemantics';
import Wire, { WirePort } from "./Wire";


export default class Component extends GameObject {

  // TODO: Decide what "shape" if any, components should have

  position: Position = { x: 400, y: 100 };
  width = 100;
  height = 100;

  readonly scope = new MetaStruct([]);

  readonly wirePorts: Array<WirePort> = [];

  // TBD: Add ports on the edge of a component?
  getWirePortNear(pos: Position): WirePort {
    let portPos = Rect.closestPointOnPerimeter(Rect(this.position, this.width, this.height), pos);
    let newPort = new WirePort(portPos, this.scope);
    this.wirePorts.push(newPort);
    return newPort;
  }

  render(dt: number, t: number): void {
    // NO-OP
    Svg.now("rect", {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      stroke: "black",
      fill: "none",
      rx: 3
    })

    for (const child of this.children) {
      child.render(dt, t);
    }

  }

  distanceToPoint(pos: Position): number | null {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      pos.x,
      pos.y
    );
  }
}

export const aComponent = (gameObj: GameObject) =>
  gameObj instanceof Component ? gameObj : null;