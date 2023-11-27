import { aGizmo } from '../../meta/Gizmo';
import NumberToken from '../../meta/NumberToken';
import Token, { aPrimaryToken } from '../../meta/Token';
import { EventContext, Gesture } from '../../Gesture';
import PropertyPickerEditor from '../../meta/PropertyPickerEditor';
import { MetaNumber, MetaStruct } from '../../meta/MetaSemantics';
import PropertyPicker from '../../meta/PropertyPicker';
import Vec from '../../../lib/vec';
import Formula from '../../meta/Formula';
import EmptyToken from '../../meta/EmptyToken';
import Wire, { WirePort } from '../../meta/Wire';
import LabelToken from '../../meta/LabelToken';

export function createWire(
  wirePort: WirePort,
  ctx: EventContext
): Gesture | void {
  const wire = new Wire(wirePort);
  ctx.page.adopt(wire);

  return new Gesture('Create Wire', {
    moved(ctx) {
      wire.points[1] = ctx.event.position;
    },

    ended(ctx) {
      const near = ctx.event.position;
      const primaryToken = ctx.page.find({ what: aPrimaryToken, near });
      const gizmo = ctx.page.find({ what: aGizmo, near });

      if (primaryToken && isTokenWithVariable(primaryToken)) {
        wire.attachEnd(primaryToken.wirePort);
      } else if (gizmo) {
        wire.attachEnd(gizmo.wirePort);
      } else if (primaryToken instanceof EmptyToken) {
        // Wire into a formula field
        if (wire.a?.deref()?.value instanceof MetaStruct) {
          const p = ctx.page.adopt(new PropertyPicker());
          p.position = ctx.event.position;
          (primaryToken.parent as Formula).insertInto(primaryToken, p);
          wire.attachEnd(p.inputPort);
          ctx.page.adopt(new PropertyPickerEditor(p));
        } else {
          const n = new NumberToken();
          (primaryToken.parent as Formula).insertInto(primaryToken, n);
          wire.attachEnd(n.wirePort);
          n.editValue = (
            wire.a?.deref()?.value as MetaNumber
          ).variable.value.toFixed();
        }
      } else if (wire.a?.deref()?.value instanceof MetaStruct) {
        const p = ctx.page.adopt(new PropertyPicker());
        p.position = ctx.event.position;
        wire.attachEnd(p.inputPort);
        ctx.page.adopt(new PropertyPickerEditor(p));
      } else {
        const n = ctx.page.adopt(new NumberToken());
        wire.attachEnd(n.wirePort);
        // Force a render, which computes the token width
        n.render(0, 0);
        // Position the token so that it's centered on the pencil
        n.position = Vec.sub(
          ctx.event.position,
          Vec(n.width / 2, n.height / 2)
        );
        // Re-add the wire, so it renders after the token (avoids a flicker)
        ctx.page.adopt(wire);
      }
    },
  });
}

type TokenWithVariable = NumberToken | LabelToken | PropertyPicker;

export const isTokenWithVariable = (token: Token): token is TokenWithVariable =>
  token instanceof NumberToken ||
  token instanceof LabelToken ||
  token instanceof PropertyPicker;
