import { GameObject } from './GameObject';
import Stroke from './ink/Stroke';
import StrokeGroup from './ink/StrokeGroup';
import Handle from './ink/Handle';
import MetaToggle from './gui/MetaToggle';

const Selected = new Set<GameObject>();
export default Selected;

export function aSelectable(gameObj: GameObject) {
  // These can't live at the top level because that causes a load-time circular dependency
  const concreteSelectables = [Stroke, Handle];
  const metaSelectables = [Handle];

  const set = MetaToggle.active ? metaSelectables : concreteSelectables;
  return set.some(cls => gameObj instanceof cls) ? gameObj : null;
}
