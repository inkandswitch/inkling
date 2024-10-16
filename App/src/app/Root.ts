import { Position } from "../lib/types"
import { deserialize, SerializedGameObject } from "./Deserialize"
import { GameObject } from "./GameObject"

export type SerializedRoot = {
  type: "Root"
  children: SerializedGameObject[]
}

export class Root extends GameObject {
  serialize(): SerializedRoot {
    return {
      type: "Root",
      children: Array.from(this.children).map((c) => c.serialize())
    }
  }

  static deserialize(v: SerializedRoot): Root {
    const root = new Root()
    for (const c of v.children) {
      root.adopt(deserialize(c))
    }
    return root
  }

  distanceToPoint(point: Position) {
    return null
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t)
    }
  }
}
