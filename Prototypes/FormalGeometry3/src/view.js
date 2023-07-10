import m from "mithril"
import app from './app';

// This is maybe a bit overkill to use mithrill, we could probably get by just fine without it


const AppView = {
    view() {
        return m("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            width: window.innerWidth,
            height: window.innerHeight
        },[ 
            //Snaps
            (app.active_tool == 1 && app.stroke_capture[1].snap_lines) ? [
                app.stroke_capture[1].snap_lines.map(line=>{
                    return m("line", {x1: line.a.x, y1: line.a.y, x2: line.b.x, y2: line.b.y, stroke: "#F81ED5", "stroke-width": 0.5})
                })
            ] : [],
            
            // Strokes
            app.strokes.map(stroke=>{
                return m("path", {d: stroke.svg_path})
            }),

            // Tool bar
            app.tools.map((tool, i)=>{
                return m(Tab, {i})
            })
        ])
    }
}


let down_timestap = 0
const Tab = {
    view(vnode) {
        let {i} = vnode.attrs
        let active = i==app.active_tool

        return m("path", {
            ontouchstart: e=> {
                if(active == i) {
                    app.active_tool = 0
                    // tabs[active] = false
                    // active = 0
                    // tabs[0] = true
                } else {
                    down_timestap = e.timeStamp
                    app.active_tool = i
                }
                
                m.redraw();
            },
            ontouchend: e=> {
                let delta = e.timeStamp-down_timestap;
                
                if(delta < 150) { //Click

                } else  { // Hold
                    app.active_tool = 0
                }
                m.redraw();
            },
            transform: `translate(${active? 0: -30} ${i*60+20})`,
            d:"M0 0.529663H50.8057C66.1286 0.529663 78.5502 12.9513 78.5502 28.2741V28.2741C78.5502 43.597 66.1286 56.0186 50.8057 56.0186H0V0.529663Z",
            fill: active? "#323232": "#F1F1F1"
        })
    }
}



m.mount(document.body, AppView)