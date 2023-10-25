import Gizmo from "../meta/Gizmo.js";
import Handle, {aCanonicalHandle} from "../ink/Handle.js";
import {touchHandleHelper} from "./Handle.js";
export function createGizmo(ctx) {
  if (ctx.metaToggle.active) {
    const handle = ctx.page.find({
      what: aCanonicalHandle,
      near: ctx.event.position
    });
    if (handle) {
      const a = ctx.page.adopt(Handle.create({...ctx.event.position}, true));
      const b = ctx.page.adopt(Handle.create({...ctx.event.position}, false));
      ctx.page.adopt(new Gizmo(a, b));
      return touchHandleHelper(b);
    }
  }
}
