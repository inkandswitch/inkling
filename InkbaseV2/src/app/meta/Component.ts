import { signedDistanceToBox } from "../../lib/SignedDistance";
import { Position } from "../../lib/types";
import { GameObject } from "../GameObject";
import Svg from "../Svg";
import { MetaStruct } from './MetaSemantics';
import { WirePort } from "./Wire";


export default class Component extends GameObject {

  // TODO: Decide what "shape" if any, components should have

  position: Position = { x: 400, y: 100 };
  width = 100;
  height = 100;

  readonly scope = new MetaStruct([]);

  // TODO: Potentially we need to manage multiple wireports if we wire to the boundry
  readonly wirePort = new WirePort(
    this.position,
    this.scope
  );

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