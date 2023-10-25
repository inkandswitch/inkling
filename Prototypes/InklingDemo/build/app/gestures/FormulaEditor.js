import {aFormula} from "../meta/Formula.js";
import FormulaStroke from "../ink/FormulaStroke.js";
import {aWritingCell} from "../meta/WritingCell.js";
import {Gesture} from "./Gesture.js";
export function tapFormulaLabel(ctx) {
}
export function pencilFormulaEditor(ctx) {
  if (!ctx.metaToggle.active) {
    return;
  }
  const writingCell = ctx.root.find({
    what: aWritingCell,
    near: ctx.event.position,
    recursive: true
  });
  if (writingCell) {
    const stroke = ctx.page.addStroke(new FormulaStroke());
    return new Gesture("Writing In Formula Editor", {
      moved(ctx2) {
        stroke.points.push(ctx2.event.position);
      },
      ended(_ctx) {
        writingCell.captureStroke(stroke);
      }
    });
  }
}
export function closeFormulaEditor(ctx) {
  if (ctx.pseudoCount >= 2 && ctx.event.type === "finger") {
    for (const formula of ctx.root.findAll({what: aFormula})) {
      formula.close();
    }
  }
}
