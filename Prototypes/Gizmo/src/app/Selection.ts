import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Events, { TouchId } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Handle from './strokes/Handle';

export default class Selection {
  dragging: Record<TouchId, Handle> = {};

  distPos: Position | null = null;
  anglePos: Position | null = null;

  distLocked = false;

  distManip: Record<string, any> = {};
  angleManip: Record<string, any> = {};

  constructor(
    private readonly page: Page,
    private readonly snaps: Snaps
  ) {}

  update(events: Events) {
    events.findAll('finger', 'began').forEach(e => {
      const handle = this.page.findHandleNear(e.position, 50);
      if (handle) {
        this.dragging[e.id] = handle;
        handle.position = e.position;
      } else if (this.distPos && Vec.dist(this.distPos, e.position) < 50) {
        // Tap on dist
        this.distManip = {
          last: e.position,
        };
      } else if (this.anglePos && Vec.dist(this.anglePos, e.position) < 50) {
        // Tap on angle
        this.angleManip = {
          last: e.position,
        };
      } else {
        this.dragging = {};
      }
    });

    events.findAll('finger', 'moved').forEach(e => {
      const handle = this.dragging[e.id];
      if (handle) {
        let [a, b] = Object.values(this.dragging);
        let other = handle == a ? b : a;
        let dist = 0;
        if (a && b) dist = Vec.dist(a.position, b.position);

        handle.position = e.position;

        if (a && b && this.distLocked) {
          let v = Vec.sub(other.position, handle.position);
          other.position = Vec.add(handle.position, Vec.renormalize(v, dist));
        }
      } else if (this.distManip.last) {
        // Tap on dist
        let delta = e.position.y - this.distManip.last.y;
        this.distManip.last = e.position;
        let [a, b] = Object.values(this.dragging);
        let a_b = Vec.sub(b.position, a.position);
        let push = Vec.renormalize(a_b, delta / 2);
        a.position = Vec.sub(a.position, push);
        b.position = Vec.add(b.position, push);
      } else if (this.anglePos && Vec.dist(this.anglePos, e.position) < 50) {
        // Tap on angle
      }
    });

    events.findAll('finger', 'ended').forEach(e => {
      // const handle = this.dragging[e.id];
      // if (handle) {
      //   delete this.dragging[e.id];
      // }

      if (
        this.distManip.last &&
        Vec.dist(this.distManip.last, e.position) < 5
      ) {
        this.distLocked = !this.distLocked;
      }

      this.distManip = {};
      this.angleManip = {};
    });
  }
}
