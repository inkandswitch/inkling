import { aGizmo } from '../meta/Gizmo';
import NumberToken from '../meta/NumberToken';
import { aPrimaryToken, aToken } from '../meta/Token';
import { EventContext, Gesture } from './Gesture';
import PropertyPickerEditor from '../meta/PropertyPickerEditor';
import { aComponent } from '../meta/Component';
import { isPropertyPicker, isTokenWithVariable } from '../meta/token-helpers';
import Wire from '../meta/Wire';
import { MetaStruct } from '../meta/MetaSemantics';
import PropertyPicker from '../meta/PropertyPicker';

export function createWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // Rebind for concision
    const find = ctx.page.find.bind(ctx.page);
    const near = ctx.event.position;

    const primaryToken = find({ what: aPrimaryToken, near, recursive: false });
    const component = find({ what: aComponent, near, recursive: false });
    const token = find({ what: aToken, near, recursive: false });
    const gizmo = find({ what: aGizmo, near });

    const wire: Wire = ctx.page.adopt(new Wire());

    if (isTokenWithVariable(primaryToken)) {
      wire.attachFront(primaryToken.wirePort);
    } else if (component) {
      wire.attachFront(component.getWirePortNear(ctx.event.position));
    } else if (isPropertyPicker(token)) {
      wire.attachFront(token.outputPort);
    } else if (gizmo) {
      wire.attachFront(gizmo.wirePort);
    } else {
      wire.points = [{ ...ctx.event.position }, { ...ctx.event.position }];
    }

    return new Gesture('Create Wire', {
      moved: ctx => (wire.points[1] = ctx.event.position),
      ended: ctx => {
        const near = ctx.event.position;
        const primaryToken = find({ what: aPrimaryToken, near });
        const gizmo = find({ what: aGizmo, near });

        if (wire.isCollapsable()) {
          wire.remove();
          ctx.formulaEditor.activateFromPosition(ctx.event.position);
        } else if (isTokenWithVariable(primaryToken)) {
          wire.attachEnd(primaryToken.wirePort);
        } else if (gizmo) {
          wire.attachEnd(gizmo.wirePort);
        } else if (wire.a?.deref()?.value instanceof MetaStruct) {
          const p = ctx.page.adopt(new PropertyPicker());
          p.position = ctx.event.position;
          wire.attachEnd(p.inputPort);
          ctx.page.adopt(new PropertyPickerEditor(p));
        } else {
          const n = ctx.page.adopt(new NumberToken());
          n.position = ctx.event.position;
          wire.attachEnd(n.wirePort);
        }
      },
    });
  }
}
