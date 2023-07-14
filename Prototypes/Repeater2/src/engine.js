let eventQueue = {
    pencil: [], // only one pencil - so a list of events
    touches: {}, // map by touch id to a list of events
};

window.nativeEvent = (eventState, touches) => {
    Object.entries(touches).forEach(([touchId, points]) => {
        points.forEach((point) => {
            if (point.type === "pencil") {
                eventQueue.pencil.push({
                    // there's more data in `point` that we're ignoring here
                    type: eventState,
                    x: point.x,
                    y: point.y,
                });
            } else {
                if (!eventQueue.touches[touchId]) {
                    eventQueue.touches[touchId] = [];
                }

                eventQueue.touches[touchId].push({
                    type: eventState,
                    x: point.x,
                    y: point.y,
                    timestamp: point.timestamp
                });
            }
        });
    });
};


let callback = null
function frame(){
    callback(eventQueue)

    eventQueue.pencil = []
    eventQueue.touches = {}

    window.requestAnimationFrame(frame);
}

export default (cb) => {
    callback = cb
    window.requestAnimationFrame(frame);
}