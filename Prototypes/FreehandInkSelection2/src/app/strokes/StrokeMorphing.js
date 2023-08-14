export default class StrokeMorphing {
    constructor(){
        this.groups = []
        this.elements = []
        this.dirty = false
    }

    addGroup(strokes){
        let group = {
            strokes,
            controlPoints: []
        }
        this.groups.push(group)
        this.dirty = true;
        return group
    }

    render(svg) {
        if(!this.dirty) {
            return
        }

        this.elements.forEach(element=>{
            element.remove();
        })

        this.elements = this.groups.flatMap(group=>{
            return group.controlPoints.map(pt=>{
                return svg.addElement('circle', { cx: pt.x, cy: pt.y, r: 3, fill: 'black' })
            })
        })

        this.dirty = false;
    }
}