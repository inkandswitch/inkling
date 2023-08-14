class Events {
    constructor() {
        this.events = [];
        this.activePencil = null;
        this.activeFingers = {};
    }

    did(type, state, id) {
        return this.events.find(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }
    
    didAll(type, state, id) {
        return this.events.filter(e =>
            e.type === type && e.state === state && (id == null || e.id === id)
        );
    }

    didLast(type, state, id) {
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
            //console.log(point.radius);
            let force = 0
            if(point.radius > 30) {
                force = 1
            }
            if(point.radius > 40) {
                force = 2
            }
            console.log(force);

            events.events.push({
                type: point.type === 'pencil' ? 'pencil': 'finger',
                state: eventState,
                id: touchId,
                position: { x: point.x, y: point.y },
                force: point.force,
                timestamp: point.timestamp,
            });
    
            if (point.type === 'pencil') {
                events.activePencil =
                    eventState !== 'ended' ?
                        { x: point.x, y: point.y } :
                        null;
            } else {
                if (eventState !== 'ended') {
                    events.activeFingers[touchId] = { x: point.x, y: point.y };
                } else {
                    delete events.activeFingers[touchId];
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