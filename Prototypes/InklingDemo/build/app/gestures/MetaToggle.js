import {Gesture} from "./Gesture.js";
import {aMetaToggle} from "../gui/MetaToggle.js";
export function touchMetaToggle(ctx) {
  const metaToggle = ctx.root.find({
    what: aMetaToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50
  });
  const dragThreshold = 100;
  if (metaToggle) {
    return new Gesture("Touch Meta Toggle", {
      moved(ctx2) {
        if (ctx2.state.dragDist > dragThreshold) {
          metaToggle.dragTo(ctx2.event.position);
        }
      },
      ended(ctx2) {
        metaToggle.snapToCorner();
        if (ctx2.pseudo) {
          cycleTheme();
        } else if (ctx2.state.dragDist <= dragThreshold) {
          metaToggle.toggle();
        }
      }
    });
  }
}
