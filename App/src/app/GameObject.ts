import { Position } from "../lib/types"
import { SerializedGameObject } from "./Deserialize"

const DEFAULT_TOO_FAR = 20

export interface FindOptions<T extends GameObject> {
  what(gameObj: GameObject): T | null
  that?(gameObj: T): boolean
  recursive?: boolean
  near?: Position
  tooFar?: number
}

interface ForEachOptions<T extends GameObject> extends FindOptions<T> {
  do(gameObj: T): void
}

export abstract class GameObject {
  parent: GameObject | null = null
  readonly children = new Set<GameObject>()

  abstract serialize(): SerializedGameObject
  static deserialize(v: SerializedGameObject): GameObject {
    throw new Error("Override me")
  }

  // TODO: remove this, and just say Root.current anywhere it's used
  get root(): GameObject {
    let p: GameObject = this
    while (p.parent) {
      p = p.parent
    }
    return p
  }

  adopt<T extends GameObject>(child: T): T {
    child.parent?.children.delete(child)
    this.children.add(child)
    child.parent = this
    return child
  }

  remove() {
    // TODO: remove my children here?
    this.parent?.children.delete(this)
    this.parent = null
  }

  abstract render(dt: number, t: number): void

  abstract distanceToPoint(point: Position): number | null

  find<T extends GameObject>(options: FindOptions<T>): T | null {
    const { what, that, recursive, near: pos, tooFar = DEFAULT_TOO_FAR } = options
    let nearestDist = tooFar
    let ans: T | null = null
    this.forEach({
      what,
      that,
      recursive,
      do(gameObj) {
        if (pos) {
          const dist = gameObj.distanceToPoint(pos)
          if (dist !== null && dist <= nearestDist) {
            ans = gameObj
            nearestDist = dist
          }
        } else {
          if (ans === null) {
            ans = gameObj
          }
        }
      }
    })
    return ans
  }

  findAll<T extends GameObject>(options: FindOptions<T>) {
    const ans = [] as T[]
    this.forEach({
      ...options,
      do(gameObj) {
        ans.push(gameObj)
      }
    })
    return ans
  }

  forEach<T extends GameObject>(options: ForEachOptions<T>) {
    const { what, that, recursive = true, near: pos, tooFar = DEFAULT_TOO_FAR, do: doFn } = options

    for (const gameObj of this.children) {
      if (recursive) {
        gameObj.forEach(options)
      }

      const narrowedGameObj = what(gameObj)
      if (!narrowedGameObj || (that && !that(narrowedGameObj))) {
        continue
      }

      if (pos) {
        const dist = narrowedGameObj.distanceToPoint(pos)
        if (dist === null || dist >= tooFar) {
          continue
        }
      }

      doFn.call(this, narrowedGameObj)
    }
  }
}

export const aGameObject = (gameObj: GameObject) => gameObj
