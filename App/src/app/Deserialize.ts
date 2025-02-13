import { GameObject } from "./GameObject"
import MetaToggle, { SerializedMetaToggle } from "./gui/MetaToggle"
import PenToggle, { SerializedPenToggle } from "./gui/PenToggle"
import Handle, { SerializedHandle } from "./ink/Handle"
import Lead, { SerializedLead } from "./ink/Lead"
import Stroke, { SerializedStroke } from "./ink/Stroke"
import StrokeGroup, { SerializedStrokeGroup } from "./ink/StrokeGroup"
import Gizmo, { SerializedGizmo } from "./meta/Gizmo"
import LinearToken, { SerializedLinearToken } from "./meta/LinearToken"
import NumberToken, { SerializedNumberToken } from "./meta/NumberToken"
import PropertyPicker, { SerializedPropertyPicker } from "./meta/PropertyPicker"
import Wire, { SerializedWire } from "./meta/Wire"
import { Root, SerializedRoot } from "./Root"

export type SerializedGameObject =
  | SerializedGizmo
  | SerializedHandle
  | SerializedLead
  | SerializedLinearToken
  | SerializedMetaToggle
  | SerializedNumberToken
  | SerializedPenToggle
  | SerializedPropertyPicker
  | SerializedRoot
  | SerializedStroke
  | SerializedStrokeGroup
  | SerializedWire

export function deserialize(v: SerializedGameObject): GameObject {
  // prettier-ignore
  switch (v.type) {
    case "Gizmo": return Gizmo.deserialize(v)
    case "Handle": return Handle.deserialize(v)
    case "Lead": return Lead.deserialize(v)
    case "LinearToken": return LinearToken.deserialize(v)
    case "MetaToggle": return MetaToggle.deserialize(v)
    case "NumberToken": return NumberToken.deserialize(v)
    case "PenToggle": return PenToggle.deserialize(v)
    case "PropertyPicker": return PropertyPicker.deserialize(v)
    case "Root": return Root.deserialize(v)
    case "Stroke": return Stroke.deserialize(v)
    case "StrokeGroup": return StrokeGroup.deserialize(v)
    case "Wire": return Wire.deserialize(v)
  }
}
