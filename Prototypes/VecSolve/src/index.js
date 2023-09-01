import m from "mithril"
import Vec from "./math/vec"
import numeric from "numeric"

// class Point {
//     constructor(x, y){
//         this.x = x
//         this.y = y
//     }
// }

// class VectorConstruction {
//     constructor(point, len, ang){
//         this.point_a = point;
//         this.len = len;
//         this.ang = ang;
//         this.point_b = this.getPointB();
//     }

//     getPointB(){
//         return {
//             x: this.point_a.x + this.len * Math.cos(this.ang),
//             y: this.point_a.y + this.len * Math.sin(this.ang),
//         }
//     }

//     render(ctx){
//         drawArrow(ctx, this.point_a, this.point_b);
//     }
// }

function polarVector(start, len, ang){
    return {
        x: start.x + len * Math.cos(ang),
        y: start.y + len * Math.sin(ang),
    }
}

function polarVectorFrom(start, end){
    let {x, y} = Vec.sub(end, start)
    return {
        len: Math.sqrt(x * x + y * y),
        ang: Math.atan2(y, x)
    }
}

class Page {
    constructor(){

        this.currDragging = {
            index: -1,
            position: {x: 0, y:0}
        }

        this.draggablePoints = [
            {x: 500, y: 500},
            {x: 100, y: 50},
            {x: 200, y: 100},
            {x: 200, y: 100},
            {x: 200, y: 100},
            {x: 200, y: 100},
            {x: 200, y: 100},
            {x: 200, y: 200},
            {x: 200, y: 100},
            {x: 500, y: 700},
            {x: 200, y: 100},
            {x: 200, y: 100},
        ]

        this.freeVariables = [
            50, // len1
            0, // ang1
            100 // len2
        ]

        this.compute()
    }

    compute(){
        let pts = this.draggablePoints
        let vs = this.freeVariables
        pts[1] = polarVector(pts[0], vs[0], vs[1])
        pts[2] = polarVector(pts[0], vs[2], vs[1] - (Math.PI/2))

        let v3 = polarVectorFrom(pts[1], pts[2]);

        pts[3] = polarVector(pts[2], v3.len, v3.ang + (Math.PI/2))
        pts[4] = polarVector(pts[3], v3.len, v3.ang + (Math.PI))

        pts[5] = polarVector(pts[2], vs[2], vs[1] - (Math.PI))
        pts[6] = polarVector(pts[5], vs[2], vs[1] - 3*(Math.PI/2))

        pts[7] = polarVector(pts[0], vs[0], vs[1] + (Math.PI)/2)
        pts[8] = polarVector(pts[7], vs[0], vs[1] )

        pts[10] = polarVector(pts[9], vs[0], vs[1])
        pts[11] = polarVector(pts[9], vs[2], vs[1] - (Math.PI/2))
    }

    draw(ctx){
        let pts = this.draggablePoints
        drawPoint(ctx, pts[0])

        drawArrow(ctx, pts[0], pts[1])
        drawArrow(ctx, pts[0], pts[2])
        drawLine(ctx, pts[1], pts[2])

        drawArrow(ctx, pts[2], pts[3])
        drawArrow(ctx, pts[3], pts[4])
        drawLine(ctx, pts[4], pts[1])

        drawArrow(ctx, pts[2], pts[5])
        drawArrow(ctx, pts[5], pts[6])
        drawLine(ctx, pts[6], pts[0])

        drawArrow(ctx, pts[0], pts[7])
        drawArrow(ctx, pts[7], pts[8])
        drawLine(ctx, pts[8], pts[1])

        drawArrow(ctx, pts[9], pts[10])
        drawArrow(ctx, pts[9], pts[11])

        ctx.font = "20px Arial";
        ctx.fillText("len1: "+this.freeVariables[0].toFixed(2), 10, 50);
        ctx.fillText("ang1: "+this.freeVariables[1].toFixed(2), 10, 100);
        ctx.fillText("len2: "+this.freeVariables[2].toFixed(2), 10, 150);
    }

    update(){
        // TWO Stage minimization
        // First tweak only lengths

        let computeTotalError = (currState) => {
            this.freeVariables = [
                currState[0],
                this.freeVariables[1],
                currState[2],
            ]
            this.compute();
            if(page.currDragging.index == 0) {
                let dist = Vec.dist(this.draggablePoints[1], this.currDragging.position);
                return dist * dist
            } else {
                let dist = Vec.dist(this.draggablePoints[this.currDragging.index], this.currDragging.position);
                return dist * dist
            }
        }
        numeric.uncmin(computeTotalError, this.freeVariables);

        // The, only if there is still error, try to rotate angles
        let computeTotalErrorAng = (currState) => {
            this.freeVariables = [
                this.freeVariables[0],
                currState[1],
                this.freeVariables[2],
            ]
            this.compute();
            if(page.currDragging.index == 0) {
                let dist = Vec.dist(this.draggablePoints[1], this.currDragging.position);
                return dist * dist
            } else {
                let dist = Vec.dist(this.draggablePoints[this.currDragging.index], this.currDragging.position);
                return dist * dist
            }
        }
        numeric.uncmin(computeTotalErrorAng, this.freeVariables);
    }
}
const page = new Page();

const App = {
    view() {
        return m("main", [
            m(CanvasView),
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
                page.draw(ctx);
                //ctx.fillRect(100, 100, 100, 100);
                // page.vectors.forEach(v=>{
                //     v.render(ctx);
                // })

                
            },
            onmousedown(e) {
                let dpt = {x: e.clientX, y: e.clientY}
                page.currDragging.index = page.draggablePoints.findIndex(pt=>{
                    return Vec.dist(pt, dpt) < 10
                })
            },
            onmousemove(e){
                let pt = {x: e.clientX, y: e.clientY}
                if(page.currDragging.index > -1) {
                    if(page.currDragging.index == 0) {
                        page.draggablePoints[0] = pt;
                        page.currDragging.position = page.draggablePoints[1];
                    } else {
                        page.currDragging.position = pt;
                    }
                    
                    page.update();
                }
            },
            onmouseup(e){
                page.currDragging.index = -1
            }
        })
    }
}


m.mount(document.body, App)
m.redraw()


window.addEventListener("keypress", e=>{
    // if(e.code == "Space") {
    //     page.match_animation_rules()
    //     page.apply_animation()
    //     page.refresh()
    //     m.redraw()
    // }
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

function drawArrow(context, a, b, arrowSize = 10, color = 'black', lineWidth = 1) {
    // Save the current context settings
    context.save();
  
    // Set the line style properties
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
  
    // Calculate the angle and length of the arrow
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const length = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  
    // Draw the main line of the arrow
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  
    // Draw the arrowhead
    context.translate(b.x, b.y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-arrowSize, -arrowSize / 2);
    context.lineTo(-arrowSize, arrowSize / 2);
    context.closePath();
    context.fill();
  
    // Restore the saved context settings
    context.restore();
  }

  function drawLine(context, a, b, color = 'lightgrey', lineWidth = 1) {
    // Save the current context settings
    context.save();
  
    // Set the line style properties
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
  
  
    // Draw the main line of the arrow
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  
    // Restore the saved context settings
    context.restore();
  }

  function drawPoint(context, a ) {
    // Save the current context settings
    context.save();
    context.fillRect(a.x-2, a.y-2, 4, 4);
  
    // Restore the saved context settings
    context.restore();
  }