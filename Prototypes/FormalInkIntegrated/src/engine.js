class Events {
    constructor() {
        this.events = [];
        this.active_pencil = null;
        this.active_fingers = {};
    }

    did(type, state, id) {
        return this.events.find(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }
    
    did_all(type, state, id) {
        return this.events.filter(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }

    did_last(type, state, id) {
        return this.events.findLast(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }
}

const events = new Events();

// Attach event listeners
window.nativeEvent = (eventState, touches) => {
    Object.entries(touches).forEach(([touchId, points]) => {
        points.forEach(point => {
            events.events.push({
                type: point.type === 'pencil' ? 'pencil': 'finger',
                state: eventState,
                id: touchId,
                position: { x: point.x, y: point.y },
                timestamp: point.timestamp,
            });
    
            if (point.type === 'pencil') {
                events.active_pencil =
                    eventState !== 'ended' ?
                        { x: point.x, y: point.y } :
                        null;
            } else {
                if (eventState !== 'ended') {
                    events.active_fingers[touchId] = { x: point.x, y: point.y };
                } else {
                    delete events.active_fingers[touchId];
                }
            }
        });
    });
};

let callback = null;

function frame() {
    callback(events);
    events.events = [];
    window.requestAnimationFrame(frame);
}

export default function engine(cb) {
    callback = cb;
    window.requestAnimationFrame(frame);
}