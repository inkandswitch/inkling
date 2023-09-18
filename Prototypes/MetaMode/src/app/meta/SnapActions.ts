import { Position } from "../../lib/types";
import NumberToken from "./NumberToken";
import Collection from "./Collection";

export abstract class SnapAction {
  position: Position = {x: 0, y: 0}
  doSnap(): any {}
}

export class CreateListSnapAction extends SnapAction {
  kind = "CreateList"

  constructor (
    public position: Position,
    public a: NumberToken,
    public b: NumberToken
  ) {
    super();
  }

  doSnap(): any {
    return new Collection([
      this.a, 
      this.b
    ])
  }
}