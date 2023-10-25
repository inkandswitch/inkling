import {aGizmo} from "../meta/Gizmo.js";
import NumberToken from "../meta/NumberToken.js";
import Token, {aPrimaryToken, aToken} from "../meta/Token.js";
import {Gesture} from "./Gesture.js";
import PropertyPickerEditor from "../meta/PropertyPickerEditor.js";
import {aComponent} from "../meta/Component.js";
import {isPropertyPicker, isTokenWithVariable} from "../meta/token-helpers.js";
import Wire from "../meta/Wire.js";
import {MetaStruct} from "../meta/MetaSemantics.js";
import PropertyPicker from "../meta/PropertyPicker.js";
import Vec from "../../lib/vec.js";
import Formula from "../meta/Formula.js";
import EmptyToken from "../meta/EmptyToken.js";
import {aMetaToggle} from "../gui/MetaToggle.js";
export function createWire(ctx) {
  if (ctx.metaToggle.active) {
    if (ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: 35
    })) {
      return;
    }
    const find = ctx.page.find.bind(ctx.page);
    const near = ctx.event.position;
    const primaryToken = find({what: aPrimaryToken, near, recursive: true});
    const component = find({what: aComponent, near, recursive: false});
    const token = find({what: aToken, near, recursive: false});
    const gizmo = find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < 30
    });
    const wire = ctx.page.adopt(new Wire());
    if (isTokenWithVariable(primaryToken)) {
      wire.attachFront(primaryToken.wirePort);
    } else if (component) {
      wire.attachFront(component.getWirePortNear(ctx.event.position));
    } else if (isPropertyPicker(token)) {
      wire.attachFront(token.wirePort);
    } else if (gizmo) {
      wire.attachFront(gizmo.wirePort);
    } else {
      return;
    }
    return new Gesture("Create Wire", {
      moved(ctx2) {
        wire.points[1] = ctx2.event.position;
      },
      ended(ctx2) {
        const near2 = ctx2.event.position;
        const primaryToken2 = find({what: aPrimaryToken, near: near2});
        const gizmo2 = find({what: aGizmo, near: near2});
        if (wire.isCollapsable()) {
          console.log(wire);
          if (wire.a && wire.a.deref()) {
            const token2 = wire.a.deref()?.parent;
            if (token2 instanceof Formula) {
              token2.edit();
            } else if (token2?.parent instanceof Formula) {
              token2.parent.edit();
            } else if (token2 instanceof Token) {
              const formula = Formula.createFromContext(ctx2, token2);
              formula.position = Vec.sub(token2.position, Vec(-3, -3));
              formula.edit();
            }
          } else {
            Formula.createFromContext(ctx2);
          }
          wire.remove();
        } else if (isTokenWithVariable(primaryToken2)) {
          wire.attachEnd(primaryToken2.wirePort);
          if (wire.a === null) {
            const n = ctx2.page.adopt(new NumberToken());
            n.variable.value = primaryToken2.getVariable().value;
            wire.attachFront(n.wirePort);
            n.render(0, 0);
            n.position = Vec.sub(wire.points[0], Vec(n.width / 2, n.height / 2));
            ctx2.page.adopt(wire);
          }
        } else if (gizmo2) {
          wire.attachEnd(gizmo2.wirePort);
        } else if (primaryToken2 instanceof EmptyToken) {
          if (wire.a?.deref()?.value instanceof MetaStruct) {
            const p = ctx2.page.adopt(new PropertyPicker());
            p.position = ctx2.event.position;
            primaryToken2.parent.insertInto(primaryToken2, p);
            wire.attachEnd(p.inputPort);
            ctx2.page.adopt(new PropertyPickerEditor(p));
          } else {
            const n = new NumberToken();
            primaryToken2.parent.insertInto(primaryToken2, n);
            wire.attachEnd(n.wirePort);
            n.editValue = (wire.a?.deref()?.value).variable.value.toFixed();
          }
        } else if (wire.a?.deref()?.value instanceof MetaStruct) {
          const p = ctx2.page.adopt(new PropertyPicker());
          p.position = ctx2.event.position;
          wire.attachEnd(p.inputPort);
          ctx2.page.adopt(new PropertyPickerEditor(p));
        } else {
          if (!wire.a) {
            wire.remove();
          } else {
            const n = ctx2.page.adopt(new NumberToken());
            wire.attachEnd(n.wirePort);
            n.render(0, 0);
            n.position = Vec.sub(ctx2.event.position, Vec(n.width / 2, n.height / 2));
            ctx2.page.adopt(wire);
          }
        }
      }
    });
  }
}
