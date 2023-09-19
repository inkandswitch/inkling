import { Position } from "../../lib/types";
import NumberToken from "./NumberToken";
import Collection from "./Collection";
import MetaLayer from "./MetaLayer";

export abstract class SnapAction {
  position: Position = {x: 0, y: 0}
  doSnap(metaLayer: MetaLayer): any {}
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

  doSnap(metaLayer: MetaLayer): any {
    metaLayer.addCollection([this.a, this.b]);
  }
}

export class AppendListSnapAction extends SnapAction {
  kind = "CreateList"

  constructor (
    public position: Position,
    public a: Collection,
    public b: NumberToken,
    public index: number
  ) {
    super();
  }

  doSnap(metaLayer: MetaLayer): any {
    metaLayer.appendToCollection(this.a, this.b, this.index);
  }
}