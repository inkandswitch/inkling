export type Event = PencilEvent | FingerEvent;
export type EventType = Event['type'];
export type EventState = 'began' | 'moved' | 'ended';
export type TouchId = string;

interface Position {
    x: number;
    y: number;
}

interface AEvent {
    state: EventState;
    id: TouchId;
    position: Position;
    timestamp: number;
}

export interface PencilEvent extends AEvent {
    type: 'pencil';
    pressure: number;
}

export interface FingerEvent extends AEvent {
    type: 'finger';
}

export class Events {
    events: Event[] = [];
    activePencil?: Position;
    activeFingers: { [key: TouchId]: Position } = {};

    constructor() {}

    add(event: Event) {
        this.events.push(event);
    }

    did(type: EventType, state: EventState, id?: TouchId) {
        return this.events.find(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }
    
    didAll(type: EventType, state: EventState, id?: TouchId) {
        return this.events.filter(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }

    didLast(type: EventType, state: EventState, id?: TouchId) {
        return this.events.findLast(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }
}

const events = new Events();

// Attach event listeners
window.nativeEvent = (state: EventState, touches: { [key: TouchId]: any[] }) => {
    Object.entries(touches).forEach(([id, points]) => {
        points.forEach(point => {
            const sharedProperties = {
                state,
                id,
                position: { x: point.x as number, y: point.y as number },
                timestamp: point.timestamp as number,
            };
            const event: Event = point.type === 'pencil' ?
                {
                    ...sharedProperties,
                    type: 'pencil',
                    pressure: point.force as number,
                } :
                {
                    ...sharedProperties,
                    type: 'finger',
                };
    
            events.add(event);

            if (event.type === 'pencil') {
                events.activePencil = state === 'ended' ? event.position : undefined;
            } else {
                if (state !== 'ended') {
                    events.activeFingers[event.id] = event.position;
                } else {
                    delete events.activeFingers[event.id];
                }
            }
        });
    });
};

type Callback = (events: Events) => void;

let callback: Callback | null = null;

function frame() {
    callback!(events);
    events.events = [];
    window.requestAnimationFrame(frame);
}

export default function engine(cb: Callback) {
    callback = cb;
    window.requestAnimationFrame(frame);
}