import { root } from '../GameObject';
import Events, {
  Event,
  InputState,
  EventState,
  TouchId,
} from '../NativeEvents';
import MetaToggle from '../gui/MetaToggle';
import SVG from '../Svg';

export type EventContext = {
  event: Event; // The current event we're processing.
  state: InputState; // The current state of the pencil or finger that generated this event.
  events: Events; // The full NativeEvents instance, so we can look at other the pencils/fingers.
  root: typeof root; // The root of the scene graph
  page: typeof root.page; // The current page the user is interacting with
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
  public lastUpdated = 0;

  private touches: Record<TouchId, Event> = {};

  constructor(
    public label: string,
    public api: GestureAPI
  ) { }

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
    this.lastUpdated = performance.now();

    let eventHandlerName: EventHandlerName = ctx.event.state;

    // Synthetic "dragged" event
    if (eventHandlerName === 'moved' && ctx.state.drag && this.api.dragged) {
      eventHandlerName = 'dragged';
    }

    // Run the event handler
    const result = this.api[eventHandlerName]?.call(this, ctx);

    // Track which touches we've claimed, and run the `done` handler when they're all released
    if (ctx.event.state !== 'ended') {
      this.touches[ctx.event.id] = ctx.event;
    } else {
      delete this.touches[ctx.event.id];
      if (Object.keys(this.touches).length === 0) {
        this.api.done?.call(this);
      }
    }

    return result;
  }

  render() {
    this.api.render?.call(this);

    for (const id in this.touches) {
      const event = this.touches[id];
      const elm = SVG.now('g', {
        class: 'gesture',
        transform: `translate(${event.position.x} ${event.position.y})`,
      });
      SVG.add('circle', elm, { r: event.type === 'pencil' ? 2 : 8 });
      SVG.add('text', elm, { content: this.label });
    }
  }
}
