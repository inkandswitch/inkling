import m from "mithril"
import Vec from "./math/vec"
import numeric from "numeric"

class Formula {
    constructor(position, page) {
        this.position = position
        this.tokens = [];
        this.page = page
    }

    addToken(t){
        let foundValue = this.page.findValue(t)
        if(foundValue) {
            this.tokens.push({
                type: "value",
                value: foundValue,
                token: t
            })
        } else {
            this.tokens.push({
                type: "op",
                token: t
            })
        }

    }

    render(ctx){
        ctx.beginPath();

        if(this.tokens.length == 0) {
            ctx.fillStyle = "black"; 
            ctx.fillRect(this.position.x, this.position.y, 10,20)
        }
        
        ctx.font = "16px Arial";
        ctx.textAlign = "left";

        let offset = 0;
        for(const t of this.tokens) {
            ctx.fillStyle = t.type == "value" ? "#E47070" :"black";    
            ctx.fillText(t.token, this.position.x+offset, this.position.y+4)
            let {width} = ctx.measureText(t.token);
            offset += width + 5
        }
        //
    }
}

class ConnectorValue {
    constructor(position, connector){
        this.label = ""
        this.position = position
        this.connector = connector
        this.connectorPoint = Vec.clone(position)
    }

    render(ctx){
        ctx.strokeStyle = "#E47070";
        ctx.fillStyle = "#E47070";
        ctx.beginPath();
        ctx.moveTo(this.connectorPoint.x, this.connectorPoint.y)
        ctx.lineTo(this.position.x, this.position.y)
        ctx.stroke();

        this.renderDot(ctx, this.position)
    }

    renderDot(ctx, position, color = "#E47070"){
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.ellipse(position.x, position.y, 10, 10, 0, 0, 2 * Math.PI);
        ctx.fill(); 

        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.label, position.x, position.y+4)
    }
}

class Connector {
    constructor (polygon) {
        this.polygon = polygon
        this.values = []
        this.position = {x: 0, y: 0}
        for(const pt of polygon) {
            this.position = Vec.add(this.position, pt)
        }

        this.position = Vec.divS(this.position, polygon.length)
        console.log(this.position);
    }

    addValue(pt){
        let position = this.polygon.find(cpt=> Vec.dist(cpt, pt) < 10)
        let v = new ConnectorValue(position, this)
        this.values.push(v)
        return v
    }

    pointInside(pt) {
        return this.polygon.find(cpt=> Vec.dist(cpt, pt) < 20) != null
    }

    render(ctx) {
        ctx.lineWidth = 2
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y)
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
        }
        ctx.lineTo(this.polygon[0].x, this.polygon[0].y)
        ctx.fillStyle = "rgba(255, 177, 177, 0.23)";
        ctx.strokeStyle = "#E47070";
        ctx.fill();
        ctx.stroke();

        // Render values
        this.values.forEach(value=>{
            value.render(ctx);
        })
    }

    renderNested(ctx){
        ctx.lineWidth = 2
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y)
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
        }
        ctx.lineTo(this.polygon[0].x, this.polygon[0].y)
        ctx.fillStyle = "rgba(177, 177, 255, 0.23)";
        ctx.fill();
    }
}

class Wire {
    constructor(startConnector, endConnector){
        this.startConnector = startConnector
        this.endConnector =  endConnector

        this.startConnectorValue = null
        this.endConnectorValue = null

        if(this.startConnector.values) {
            this.startConnectorValue = this.startConnector.values
        }

        if(this.endConnector.values) {
            this.endConnectorValue = this.endConnector.values
        }

        console.log(this);

        this.preview = true
    }

    render(ctx){
        if(this.preview) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.beginPath();
            ctx.ellipse(this.startConnector.position.x, this.startConnector.position.y, 20, 20, 0, 0, 2 * Math.PI);
            ctx.fill(); 
            
            if(this.startConnectorValue && this.startConnectorValue.length) {
                let offset = this.startConnector.position.x + 40
                for(const value of this.startConnectorValue) {
                    value.renderDot(ctx, {x: offset, y: this.startConnector.position.y}, "rgb(100, 50, 255)")
                    offset += 30
                }
            } else if(this.startConnectorValue) {
                this.startConnectorValue.renderDot(ctx, {x: this.startConnector.position.x, y: this.startConnector.position.y}, "rgb(100, 50, 255)")
            }

            ctx.beginPath();
            ctx.ellipse(this.endConnector.position.x, this.endConnector.position.y, 20, 20, 0, 0, 2 * Math.PI);
            ctx.fill(); 

            if(this.endConnectorValue  && this.endConnectorValue.length) {
                let offset = this.endConnector.position.x + 40
                for(const value of this.endConnectorValue) {
                    value.renderDot(ctx, {x: offset, y: this.endConnector.position.y}, "rgb(100, 50, 255)")
                    offset += 30
                }
            } else if(this.endConnectorValue) {
                this.endConnectorValue.renderDot(ctx, {x: this.endConnector.position.x, y: this.endConnector.position.y}, "rgb(100, 50, 255)")
            }
        }
    }

    handleClick(pt){
        if(this.startConnectorValue && this.startConnectorValue.length) {
            let offset = this.startConnector.position.x + 40
            for(const value of this.startConnectorValue) {
                let pos = {x: offset, y: this.startConnector.position.y}
                if(Vec.dist(pos, pt) < 20) {
                    this.startConnectorValue = value;
                    return
                }
                offset += 30
            }
        }

        if(this.endConnectorValue && this.endConnectorValue.length) {
            let offset = this.endConnector.position.x + 40
            for(const value of this.endConnectorValue) {
                let pos = {x: offset, y: this.endConnector.position.y}
                if(Vec.dist(pos, pt) < 20) {
                    this.endConnectorValue = value;
                    return
                }
                offset += 30
            }
        }

        this.preview = false;
    }
}


class Component {
    constructor(){
        this.strokes = []
        this.connectors = []
        this.formulas = []
        this.nestedComponents = []
        this.wires = []
    }

    addStroke(stroke){
        this.strokes.push(stroke)
    }

    addConnector(polygon){
        this.connectors.push(new Connector(polygon))
    }
    
    addFormula(position){
        let f = new Formula(position, this)
        this.formulas.push(f)
        return f
    }

    tryWire(stroke){
        let start = stroke[0]
        let end = stroke[stroke.length-1]

        let startConnector = this.findConnectorNear(start)
        let endConnector = this.findConnectorNear(end)
        
        if(startConnector && endConnector) {
            let wire = new Wire(startConnector, endConnector)
            this.wires.push(wire)
            return wire
        }
    }

    findConnectorNear(pt){
        for(const form of this.formulas) {
            if(Vec.dist(form.position, pt) < 20) {
                return form
            }
        }
        
        for(const component of this.nestedComponents) {
            for(const connector of component.connectors) {
                if(connector.pointInside(pt)) {
                    return connector
                }
            }
        }

        
    }

    findValue(label){
        for(const c of this.connectors) {
            for(const value of c.values) {
                if(value.label == label) {
                    return value
                }
            }
        }
    }

    render(ctx) {
        this.strokes.forEach(stroke=>{
            ctx.lineWidth = 2
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y)
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y)
            }
            ctx.strokeStyle = "black";
            ctx.stroke();
        })


        this.connectors.forEach(connector=>{
            connector.render(ctx);
        })

        this.formulas.forEach(formula=>{
            formula.render(ctx);
        })

        this.nestedComponents.forEach(component=>{
            component.renderNested(ctx);
        })

        this.wires.forEach(wire=>{
            wire.render(ctx);
        })
    }

    addComponent(c) {
        this.nestedComponents.push(c);
        
    }

    renderNested(ctx){
        this.strokes.forEach(stroke=>{
            ctx.lineWidth = 2
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y)
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y)
            }
            ctx.strokeStyle = "black";
            ctx.stroke();
        })

        this.connectors.forEach(connector=>{
            connector.renderNested(ctx);
        })
    }
}





class ViewState {
    constructor(){
        this.page = new Component();
        // this.stack = [this.page];
        this.library = [this.page];

        this.tool = "none";
        this.mousedown = null;
        this.polygon = [];
        this.dragging = null;
        this.formula = null;
        this.wire = null;
    }

    onmousedown(pt){
        if(this.tool == "none") {
            if(this.wire && this.wire.preview) {
                this.wire.handleClick(pt)
                return
            }


            // Check if clicked near connector border
            let found = this.page.connectors.find(connector=>{
                return connector.polygon.find(cpt=> Vec.dist(cpt, pt) < 10)
            })
            if(found) {
                this.dragging = found.addValue(pt);
                this.tool = "dragging"
            } else {
                this.polygon = [pt]
            }

        } else if(this.tool == "connector_pen") {
            this.polygon = [pt]
        } else if(this.tool == "formula") {
            this.formula = this.page.addFormula(pt)
            this.tool = "none"
        }
        this.mousedown = pt;
    }

    onmousemove(pt) {
        if(this.mousedown) {
            if(this.tool == "none") {
                this.polygon.push(pt)
            }
            if(this.tool == "connector_pen") {
                this.polygon.push(pt)
            } else if(this.tool == "dragging") {
                this.dragging.position = pt 
            }
        }
    }

    onmouseup(pt){
        if(this.mousedown) {
            if(this.tool == "none") {
                if(this.polygon.length > 0) {
                    this.page.addStroke(this.polygon)

                    this.wire = this.page.tryWire(this.polygon)
                }
            } else  if(this.tool == "connector_pen") {
                this.page.addConnector(this.polygon)
            }
            
            this.polygon = []; 
            this.tool = "none"
            this.mousedown = null;
        }
    }

    onkey(key) {
        console.log(key);
        if(this.dragging) {
            this.dragging.label = key
            this.dragging = null
        }

        if(this.formula) {
            this.formula.addToken(key)
        }
    }

    newComponent(){
        let c = new Component()
        this.library.push(c)
        this.page = c
    }

    render(ctx){
        this.page.render(ctx);

        if(this.polygon.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.polygon[0].x, this.polygon[0].y)
            for (let i = 1; i < this.polygon.length; i++) {
                ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
            }
            ctx.strokeStyle = this.tool == "none" ? "black" :"#E47070";
            ctx.stroke();
        }
        
    }
}
const viewstate = new ViewState();

const App = {
    view() {
        return m("main", [
            m(CanvasView),
            m(LibraryView),
        ])
    }
}


const LibraryView = {
    view() {
        return m(".library", [
            viewstate.library.map((c, i)=>{
                return m(".component",{
                    onclick: _=>{
                        viewstate.page = c
                    },
                    onauxclick: _=>{
                        viewstate.page.addComponent(c)
                    }
                } ,"component"+i)
            }),
            m(".add", {
                onclick: _=>{
                    viewstate.newComponent()
                }
            },"add")
        ])
    }
}

const CanvasView = {
    view() {
        return m(".page", {
            oncreate(vnode) {
                vnode.state.ctx = create_canvas(vnode.dom)
            },
            onupdate(vnode) {                
                let ctx = vnode.state.ctx
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                viewstate.render(ctx);
            },
            // Mouse
            onmousedown(e) {
                viewstate.onmousedown({x: e.clientX, y: e.clientY})
            },
            onmousemove(e){
                viewstate.onmousemove({x: e.clientX, y: e.clientY})
            },
            onmouseup(e){
                viewstate.onmouseup({x: e.clientX, y: e.clientY})
            }
        })
    }
}


m.mount(document.body, App)
m.redraw()


window.addEventListener("keydown", e=>{
    if(e.key == 'Meta') {
        viewstate.tool = "formula";
    }
    // if(e.key == 'Control') {
    //     viewstate.newComponent();
    // }
    // if(e.key == 'Esc') {
    //     viewstate.popComponent();
    // }
})

window.addEventListener("keypress", e=>{
    if(e.code == "Space") {
        viewstate.tool = "connector_pen";
        return
    }


    viewstate.onkey(e.key);
    m.redraw();
})

function create_canvas(dom){
    const canvas = document.createElement("canvas")
    dom.appendChild(canvas)
    const dpr = window.devicePixelRatio
    let bounds = dom.getBoundingClientRect()
    canvas.width = bounds.width * dpr
    canvas.height = bounds.height * dpr
    const ctx = canvas.getContext("2d")
    ctx.scale(dpr, dpr)
    return ctx
}