export default class FormalTool {
    constructor(page, svg){
        this.page = page
        this.svg = svg
        this.points = []
        this.element = null
    }

    update(events){
        let pencil_down = events.did("pencil", "began")
        if(pencil_down) {
            this.points = [pencil_down.position]
        }

        let pencil_move = events.did("pencil", "moved")
        if(pencil_move) {
            this.points.push(pencil_move.position)
        }

        let pencil_up = events.did("pencil", "ended")
        if(pencil_up) {
            
        }
    }

    render(svg){

    }

}