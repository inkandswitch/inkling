import { root } from '../GameObject';
import Events, {
  Event,
  InputState,
  EventState,
  TouchId,
} from '../NativeEvents';
import MetaToggle from '../gui/MetaToggle';
import FormulaEditor from '../meta/FormulaEditor';

export type EventContext = {
  event: Event; // The current event we're processing.
  state: InputState; // The current state of the pencil or finger that generated this event.
  events: Events; // The full NativeEvents instance, so we can look at other the pencils/fingers.
  root: typeof root; // The root of the scene graph
  page: typeof root.page; // The current page the user is interacting with
  formulaEditor: FormulaEditor;
  metaToggle: MetaToggle;
  pseudo: boolean;
  pseudoCount: number;
  pseudoTouches: Record<TouchId, Event>;
};

type GestureAPI = Partial<{
  claim: 'pencil' | 'finger' | 'fingers' | PredicateFn;
  pseudo: boolean;
  began: EventHandler;
  moved: EventHandler;
  dragged: EventHandler;
  ended: EventHandler;
  done: VoidFn;
  render: VoidFn;
}>;

type VoidFn = () => void;
type PredicateFn = (ctx: EventContext) => boolean;
type EventHandler = (ctx: EventContext) => EventHandlerResult;
// TODO: should this be a type parameter of EventHandler?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandlerResult = Gesture | any;
type EventHandlerName = EventState | 'dragged';

export class Gesture {
  private touchCount = 0;

  constructor(
    public label: string,
    public api: GestureAPI
  ) {}

  claimsTouch(ctx: EventContext): boolean {
    const typeIsPencil = ctx.event.type === 'pencil';
    const typeIsFinger = ctx.event.type === 'finger';
    const oneFinger = ctx.events.fingerStates.length === 1;
    const typeMatchesClaim = this.api.claim === ctx.event.type;
    const claimIsFingers = this.api.claim === 'fingers';

    // claim "pencil" to match the pencil
    if (typeMatchesClaim && typeIsPencil) {
      return true;
    }

    // claim "finger" to match only one finger
    if (typeMatchesClaim && typeIsFinger && oneFinger) {
      return true;
    }

    // claim "fingers" to match all subsequent fingers
    if (typeIsFinger && claimIsFingers) {
      return true;
    }

    // Custom claim function
    if (this.api.claim instanceof Function) {
      return this.api.claim(ctx);
    }

    return false;
  }

  applyEvent(ctx: EventContext) {
    let eventHandlerName: EventHandlerName = ctx.event.state;

    // Synthetic "dragged" event
    if (eventHandlerName === 'moved' && ctx.state.drag && this.api.dragged) {
      eventHandlerName = 'dragged';
    }

    // Run the event handler
    const result = this.api[eventHandlerName]?.call(this, ctx);

    // Track how many touches we've claimed, and run the `done` handler when they're all released
    if (ctx.event.state === 'began') {
      this.touchCount++;
    } else if (ctx.event.state === 'ended') {
      this.touchCount--;
      if (this.touchCount === 0) {
        this.api.done?.call(this);
      }
    }

    return result;
  }

  render() {
    this.api.render?.call(this);
  }
}
