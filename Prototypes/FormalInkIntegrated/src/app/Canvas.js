export default class Canvas {
    constructor(dom){
        // SETUP CANVAS
        this.canvas = document.createElement("canvas")
        dom.appendChild(this.canvas)
        const dpr = window.devicePixelRatio
        let bounds = dom.getBoundingClientRect()
        this.canvas.width = bounds.width * dpr
        this.canvas.height = bounds.height * dpr
        this.ctx = this.canvas.getContext("2d")
        this.ctx.scale(dpr, dpr)
    }

    clear(){
        this.ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
    }
}