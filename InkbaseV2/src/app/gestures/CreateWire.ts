import { aGizmo } from '../meta/Gizmo';
import NumberToken from '../meta/NumberToken';
import Token, { aPrimaryToken, aToken } from '../meta/Token';
import { EventContext, Gesture } from './Gesture';
import PropertyPickerEditor from '../meta/PropertyPickerEditor';
import { aComponent } from '../meta/Component';
import { isPropertyPicker, isTokenWithVariable } from '../meta/token-helpers';
import Wire from '../meta/Wire';
import { MetaNumber, MetaStruct } from '../meta/MetaSemantics';
import PropertyPicker from '../meta/PropertyPicker';
import Vec from '../../lib/vec';
import Formula from '../meta/Formula';
import EmptyToken from '../meta/EmptyToken';
import { aMetaToggle } from '../gui/MetaToggle';

export function createWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // If the touch begins on the Meta Toggle, don't create a wire
    if (
      ctx.root.find({
        what: aMetaToggle,
        near: ctx.event.position,
        recursive: false,
        tooFar: 35,
      })
    ) {
      return;
    }

    // Rebind for concision
    const find = ctx.page.find.bind(ctx.page);
    const near = ctx.event.position;

    const primaryToken = find({ what: aPrimaryToken, near, recursive: true });
    const component = find({ what: aComponent, near, recursive: false });
    const token = find({ what: aToken, near, recursive: false });
    const gizmo = find({
      what: aGizmo,
      that: g => g.centerDistanceToPoint(ctx.event.position) < 30,
    });

    const wire: Wire = ctx.page.adopt(new Wire());

    if (isTokenWithVariable(primaryToken)) {
      wire.attachFront(primaryToken.wirePort);
    } else if (component) {
      wire.attachFront(component.getWirePortNear(ctx.event.position));
    } else if (isPropertyPicker(token)) {
      wire.attachFront(token.wirePort);
    } else if (gizmo) {
      wire.attachFront(gizmo.wirePort);
    } else {
      // For now, we disallow wiring from empty space
      return;
      // wire.points = [{ ...ctx.event.position }, { ...ctx.event.position }];
    }

    return new Gesture('Create Wire', {
      moved(ctx) {
        wire.points[1] = ctx.event.position;
      },
      ended(ctx) {
        const near = ctx.event.position;
        const primaryToken = find({ what: aPrimaryToken, near });
        const gizmo = find({ what: aGizmo, near });

        // If you tapped something and didn't perform a drag, don't create anything
        // if ((primaryToken || component || token || gizmo) && !ctx.state.drag) {
        //   wire.remove();
        //   return;
        // }

        // Instantiate a formula
        if (wire.isCollapsable()) {
          console.log(wire);
          if (wire.a && wire.a.deref()) {
            const token = wire.a.deref()?.parent; // Find the token

            if (token instanceof Formula) {
              // TODO: not a reachable path
              token.edit();
            } else if (token?.parent instanceof Formula) {
              token.parent.edit();
            } else if (token instanceof Token) {
              const formula = Formula.createFromContext(ctx, token);
              formula.position = Vec.sub(token.position, Vec(-3, -3));
              formula.edit();
            }
          } else {
            Formula.createFromContext(ctx);
          }
          wire.remove();
        } else if (isTokenWithVariable(primaryToken)) {
          wire.attachEnd(primaryToken.wirePort);
          if (wire.a === null) {
            const n = ctx.page.adopt(new NumberToken());
            n.variable.value = primaryToken.getVariable().value;
            wire.attachFront(n.wirePort);
            // Force a render, which computes the token width
            n.render(0, 0);
            // Position the token so that it's centered on the pencil
            n.position = Vec.sub(
              wire.points[0],
              Vec(n.width / 2, n.height / 2)
            );
            // Re-add the wire, so it renders after the token (avoids a flicker)
            ctx.page.adopt(wire);
          }
        } else if (gizmo) {
          wire.attachEnd(gizmo.wirePort);
        } else if (primaryToken instanceof EmptyToken) {
          // Wire into a formula field
          if (wire.a?.deref()?.value instanceof MetaStruct) {
            const p = ctx.page.adopt(new PropertyPicker());
            p.position = ctx.event.position;
            (primaryToken.parent as Formula).insertAt(primaryToken, p);
            wire.attachEnd(p.inputPort);
            ctx.page.adopt(new PropertyPickerEditor(p));
          } else {
            const n = new NumberToken();
            (primaryToken.parent as Formula).insertAt(primaryToken, n);
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
          if (!wire.a) {
            // TODO: In lieu of a seed, let's just do nothing for now
            wire.remove();
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
        }
      },
    });
  }
}
