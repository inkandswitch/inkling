import Stroke from '../ink/Stroke';
import { aFormulaEditor } from '../meta/FormulaEditor';
import { aPrimaryToken } from '../meta/Token';
import { isLabelToken } from '../meta/token-helpers';
import { EventContext, Gesture } from './Gesture';

export function tapFormulaLabel(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active && ctx.formulaEditor.isActive()) {
    const primaryToken = ctx.page.find({
      what: aPrimaryToken,
      near: ctx.event.position,
    });

    if (primaryToken && isLabelToken(primaryToken)) {
      return new Gesture('Tap Formula Label', {
        ended: () =>
          ctx.formulaEditor.addLabelTokenFromExisting(primaryToken.label),
      });
    }
  }
}

export function pencilFormulaEditor(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active && ctx.formulaEditor.isActive()) {
    const formulaEditor = ctx.root.find({
      what: aFormulaEditor,
      near: ctx.event.position,
      recursive: false,
    });

    const stroke = ctx.page.addStroke(new Stroke());

    if (formulaEditor) {
      if (ctx.pseudo) {
        return new Gesture('Pseudo Tap Formula Editor', {
          began: ctx => formulaEditor.switchCellMode(ctx.event.position),
        });
      } else {
        return new Gesture('Writing In Formula Editor', {
          moved: ctx => stroke.points.push(ctx.event.position),
          ended: _ctx => formulaEditor.captureStroke(stroke),
        });
      }
    }
  }
}

export function closeFormulaEditor(ctx: EventContext): Gesture | void {
  // This one is a bit weird.
  // We don't actually need to claim the 3rd finger, so we just perform the effect right away.
  if (
    ctx.formulaEditor.isActive() &&
    ctx.pseudoCount >= 2 && // two pseudo fingers plus…
    ctx.event.type === 'finger' // …one more finger.
  ) {
    ctx.formulaEditor.parseFormulaAndClose();
  }
}
