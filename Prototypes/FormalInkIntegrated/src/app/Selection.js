export default class Selection {
    constructor(page){
        this.page = page
        this.points = {}

        // gesture state
        this.selection_finger = null
        this.tapped_on = null
    }

    update(events) {
        let finger_down = events.did("finger", "began")
        if(finger_down) {
            this.selection_finger = finger_down

            let point = this.page.findPointNear(finger_down.position)
            if(point) {    
                this.points[point.id] = point
                point.select()
                this.tapped_on = point
            } else {
                console.log("tapped empty");
                this.tapped_on = null
            }
        }

        if(this.selection_finger) {
            let finger_up = events.did("finger", "ended", this.selection_finger.id)
            if(finger_up) {
                // If it was a short tap
                if(finger_up.timestamp - this.selection_finger.timestamp < 0.2) {

                    // If we tapped on empty space
                    if(this.tapped_on == null) {
                        this.points = {}
                    }
                }
            }
        }
        

    }

    render(ctx) {
        Object.values(this.points).forEach(point=>{
            point.renderSelected(ctx)
        })
    }

}