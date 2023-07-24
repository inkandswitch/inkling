class Canvas {
    constructor(dom, cb){
        // SETUP CANVAS
        this.canvas = document.createElement("canvas")
        dom.appendChild(this.canvas)
        const dpr = window.devicePixelRatio
        let bounds = dom.getBoundingClientRect()
        this.canvas.width = bounds.width * dpr
        this.canvas.height = bounds.height * dpr
        this.ctx = this.canvas.getContext("2d")
        this.ctx.scale(dpr, dpr)

        // this.canvas.addEventListener("touchstart", e=>e.preventDefault(), false)

        this.callback = cb
        cb(this.ctx)
    }

    render(){
        this.callback(this.ctx)
    }

}

export default Canvas