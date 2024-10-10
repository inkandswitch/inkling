import { GameObject } from "./GameObject"
import Stroke from "./ink/Stroke"
import Handle from "./ink/Handle"
import MetaToggle from "./gui/MetaToggle"

class SelectionSet<T> extends Set<T> {
  previous: Set<T> = new Set()

  deselect() {
    if (this.size > 0) {
      this.previous = new Set(this)
      this.clear()
    }
  }

  reselect() {
    if (this.previous.size > 0) {
      this.clear()
      for (const v of this.previous) {
        this.add(v)
      }
      this.previous.clear()
    }
  }

  deselectOrReselect() {
    if (this.size === 0) {
      this.reselect()
    } else {
      this.deselect()
    }
  }
}

const Selected = new SelectionSet<GameObject>()
export default Selected

export function aSelectable(gameObj: GameObject) {
  // These can't live at the top level because that causes a load-time circular dependency
  const concreteSelectables = [Stroke, Handle]
  const metaSelectables = [Handle]

  const set = MetaToggle.active ? metaSelectables : concreteSelectables
  return set.some((cls) => gameObj instanceof cls) ? gameObj : null
}
