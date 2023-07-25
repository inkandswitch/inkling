class Events {
    constructor(){
        this.events = []
        this.active_pencil = null
        this.active_fingers = {}
    }

    did(type, state, id) {
        return this.events.find(e=>{
            return e.type == type && e.state == state && (id == null || e.id == id)
        })
    }
}


// Attach event listeners
let events = new Events()
window.nativeEvent = (eventState, touches) => {

    Object.entries(touches).forEach(([touchId, points]) => {
        points.forEach((point) => {
            events.events.push({
                type: point.type == "pencil" ? "pencil": "finger",
                state: eventState,
                id: touchId,
                position: {x: point.x, y: point.y},
                timestamp: point.timestamp,
            })
    
            if(point.type == "pencil") {
                if(eventState != "ended") {
                    events.active_pencil = {x: point.x, y: point.y}
                } else {
                    events.active_pencil = null
                }
            } else {
                if(eventState != "ended") {
                    events.active_fingers[touchId] = {x: point.x, y: point.y}
                } else {
                    delete events.active_fingers[touchId]
                }
            }
        })
        
    });
};


let callback = null
function frame(){
    callback(events);
    events.events = [];
    window.requestAnimationFrame(frame);
}

export default (cb) => {
    callback = cb
    window.requestAnimationFrame(frame);
}