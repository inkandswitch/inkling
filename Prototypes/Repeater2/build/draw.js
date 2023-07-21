import Vec from './lib/vec.js';
import Line from './lib/line.js';

// Monotonically incrementing id counter
let nextId = 0;

class Point {
    constructor(pos) {
        this.id = nextId++;
        this.pos = pos || Vec();
    }

    render(ctx) {
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

class LineStroke {
    constructor(a, b) {
        this.id = nextId++;
        this.a = a;
        this.b = b;
    }

    render(ctx, highlight) {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = highlight ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.moveTo(this.a.pos.x, this.a.pos.y);
        ctx.lineTo(this.b.pos.x, this.b.pos.y);
        ctx.stroke();
    }
}

class WetStroke {
    constructor(pos) {
        this.a = pos;
        this.b = Vec.clone(pos);

        this.last_b = Vec.clone(pos);
        this.velocity = 0;

        this.h_snap;
        this.v_snap;
        this.ref_line;
        this.angle_snap;
        this.angle_offset;
        this.len_snap;
        this.point_snap;
    }

    update(pos, points, ref_line) {
        this.b = pos;
        let new_velocity = Vec.dist(this.last_b, this.b);
        this.last_b = Vec.clone(this.b);
        this.velocity = 0.05 * new_velocity + (1 - 0.05) * this.velocity; // Filter velocity
        //console.log(this.velocity);

        this.h_snap = false;
        this.v_snap = false;

        if (Math.abs(this.a.x - this.b.x) < 10) {
            this.b.x = this.a.x;
            this.v_snap = true;
        }
    
        if (Math.abs(this.a.y - this.b.y) < 10) {
            this.b.y = this.a.y;
            this.h_snap = true;
        }
        
        const snaps = [];
        if (this.velocity < 1.5) {
            points.forEach(point => {
                const sx = Line.getXforY(this, point.pos.y);
                const sy = Line.getYforX(this, point.pos.x);
                snaps.push(
                    { type: 'horizontal', x: sx, y: point.pos.y, snap: point },
                    { type: 'vertical', x: point.pos.x, y: sy, snap: point },
                );
            });

            this.point_snap = false;
            snaps.forEach(snap => {
                if (Vec.dist(pos, snap) < 10) {
                    this.b.x = snap.x;
                    this.b.y = snap.y;
                    this.point_snap = snap;
                }
            });
        } 

        // Snap to point
        const point_snap = points.find(point => Vec.dist(point.pos, pos) < 10);
        if (point_snap) {
            this.b = point_snap.pos;
            this.point_snap = { type: 'coincident', snap: point_snap };
        }

        
        // Snap with reference point
        this.len_snap = false;
        this.angle_snap = false;
        this.angle_offset = null;
        if (ref_line) {
            this.ref_line = ref_line;
            // Snap lengths
            const ref_len = Line.len(Line(ref_line.a.pos, ref_line.b.pos));
            let cur_len = Line.len(Line(this.a, this.b));
            if (Math.abs(ref_len - cur_len) < 10) {
                this.b = Vec.add(this.a, Vec.mulS(Vec.normalize(Vec.sub(this.b, this.a)), ref_len));
                this.len_snap = true;
                cur_len = ref_len;
            }

            // Snap Angles
            const my_vec = Vec.sub(this.a, this.b);
            const ref_vec = Vec.sub(ref_line.a.pos, ref_line.b.pos);

            const my_angle = Vec.angle(my_vec);
            const ref_angle = Vec.angle(ref_vec);

            const diff_angle = (my_angle - ref_angle + 360) % 360;

            const closest_round_angle = (Math.round(diff_angle / 90) * 90 + 360) % 360;
            if (Math.abs(diff_angle - closest_round_angle) < 10) {
                const new_angle = ref_angle + closest_round_angle;
                this.b = Vec.add(this.a, Vec.polar(180 + new_angle, cur_len));
                this.angle_snap = true;
                this.angle_offset = closest_round_angle;
            }
        }
    }

    render(ctx) {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = this.len_snap ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.moveTo(this.a.x, this.a.y);
        ctx.lineTo(this.b.x, this.b.y);
        ctx.stroke();

        if (this.h_snap || this.v_snap || this.angle_snap) {
            const projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.a, this.b), 100));
            const projected_b = Vec.add(this.a, Vec.mulS(Vec.sub(this.b, this.a), 100));
            ctx.lineWidth = 0.25;
            ctx.strokeStyle = '#F81ED5';
            ctx.beginPath();
            ctx.moveTo(projected_a.x, projected_a.y);
            ctx.lineTo(projected_b.x, projected_b.y);
            ctx.stroke();
        }

        if (this.point_snap) {
            const projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.point_snap.snap.pos, this.b), 100));
            const projected_b = Vec.add(this.point_snap.snap.pos, Vec.mulS(Vec.sub(this.b, this.point_snap.snap.pos), 100));
            ctx.lineWidth = 0.25;
            ctx.strokeStyle = '#F81ED5';
            ctx.beginPath();
            ctx.moveTo(projected_a.x, projected_a.y);
            ctx.lineTo(projected_b.x, projected_b.y);
            ctx.stroke();
        }

        if (this.ref_line) {
            const ref_len = Line.len(Line(this.ref_line.a.pos, this.ref_line.b.pos));

            const normalized_line = Vec.normalize(Vec.sub(this.b, this.a));

            const long_b = Vec.add(this.a, Vec.mulS(normalized_line, 10000));
            const len_vec = Vec.mulS(normalized_line, ref_len);

            ctx.lineWidth = 0.25;
            ctx.strokeStyle = '#F81ED5';

            ctx.beginPath();
            ctx.moveTo(this.a.x, this.a.y);
            ctx.lineTo(long_b.x, long_b.y);
            ctx.stroke();

            for (let i = 0; i < 10; i += 0.25) {
                const size = i % 1 === 0.0 ? 6 : 3;
                const perpendicular = Vec.mulS(Vec.rotate90CCW(normalized_line), size);

                const snap_pt = Vec.add(this.a, Vec.mulS(len_vec, i));
                const snap_perp_a = Vec.add(snap_pt, perpendicular);
                const snap_perp_b = Vec.sub(snap_pt, perpendicular);
                ctx.beginPath();
                ctx.moveTo(snap_perp_a.x, snap_perp_a.y);
                ctx.lineTo(snap_perp_b.x, snap_perp_b.y);
                ctx.stroke();
            }
        }
    }
}

class DrawRepeat { 
    constructor(){
        this.mode = 'draw';

        this.wet_stroke = null;
        this.ref_line = null;
        this.selection = [];
        this.points = [];
        this.lines = [];

        this.constraints = [];

        this.recorded_actions = [];
        this.last_point = null;

        this.repeat_preview = [];
        this.repeat_preview_active = false;
        this.repeat_start = 0;
        this.repeat_end = 0;
    }

    find_point_near(pos) {
        return this.points.find(point => Vec.dist(point.pos, pos) < 10);
    }

    find_stroke_near(pos) {
        return this.lines.find(line=> {
            const dist = Line.distToPoint(Line(line.a.pos, line.b.pos), pos);
            return dist < 20;
        })
    }

    begin_stroke(pos) {
        const found = this.find_point_near(pos);
        if (found) pos = found.pos;
        this.wet_stroke = new WetStroke(pos);
    }

    update_stroke(pos){
        if (this.wet_stroke) {
            this.wet_stroke.update(pos, this.points, this.ref_line);
        }
    }

    end_stroke(pos, from_recorded) {
        let a = this.find_point_near(this.wet_stroke.a);
        if (!a) {
            a = new Point(this.wet_stroke.a);
            this.points.push(a);
        }

        let b = this.find_point_near(this.wet_stroke.b);
        if (!b) {
            b = new Point(this.wet_stroke.b);
            this.points.push(b);
        }

        const l = new LineStroke(a, b);
        this.lines.push(l);

        if(from_recorded != true) {
            this.recorded_actions.push({
                stroke: this.wet_stroke,
                line: l
            })
        }
        this.last_point = b
        

        // record constraints
        this.constraints.push({ type: 'minLength', a:l, b: 5 });
        const ws = this.wet_stroke;
        if (ws.v_snap) {
            this.constraints.push({ type: 'vertical', a, b });
        }
        if (ws.h_snap) {
            this.constraints.push({ type: 'horizontal', a, b });
        }
        if (ws.point_snap && ws.point_snap.type != 'coincident') {
            this.constraints.push({ type: ws.point_snap.type, a: b, b: ws.point_snap.snap });
        }
        if (ws.len_snap) {
            this.constraints.push({ type: 'length', a: l, b: ws.ref_line });
        }
        if (ws.angle_snap && !ws.v_snap && !ws.h_snap) {
            this.constraints.push({ type: 'angle', a: l, b: ws.ref_line, angle: ws.angle_offset });
        }

        console.log(this.constraints);

        this.wet_stroke = null
    }
    
    update(events) {
        // Handle input
        events.pencil.forEach(event => {
            const pos = Vec(event.x, event.y);
            if (this.mode === 'draw') {
                if (event.type === 'began') {
                    this.begin_stroke(pos);
                } else if (event.type === 'moved') {
                    this.update_stroke(pos);
                } else if (event.type === 'ended') {
                    this.end_stroke(pos);
                }
            } else if (this.mode.startsWith('move')) {
                if (event.type === 'began') {
                    this.dragging = this.find_point_near(pos);
                    if (this.dragging) {
                        let fixedPointDistance = -Infinity;
                        for (const p of this.points) {
                            const distance = Vec.dist(this.dragging.pos, p.pos);
                            if (distance > fixedPointDistance) {
                                fixedPointDistance = distance;
                                this.fixedPoint = p;
                            }
                        }
                    }
                }
                if (event.type === 'moved') {
                    if (this.dragging) {
                        this.dragging.pos = pos;
                    }
                }
                if (event.type === 'ended') {
                    this.dragging = false;
                    this.fixedPoint = null;
                }
            }
        });

        Object.entries(events.touches).forEach(([touchId, events]) => {
            events.forEach(event => {
                const pos = Vec(event.x, event.y);
                if (event.type === 'began') {
                    const found = this.find_stroke_near(pos);
                    if (this.ref_line === found) {
                        this.ref_line = null;
                    } else {
                        this.ref_line = found;
                        this.finger_down_time = event.timestamp;
                    }

                    this.ref_line_id = touchId;

                    if (Vec.dist(Vec(40, 40), pos) < 20) {
                        this.toggleModes();
                    }

                    if(Vec.dist(Vec(40, window.innerHeight-25), pos) < 20) {
                        if(this.repeat_preview_active) {
                            this.apply_speculative_repeat()
                        } else {
                            this.repeat_preview_active = true;
                            this.repeat_start = 0
                            this.repeat_end = this.recorded_actions.length-1
                            this.speculative_repeat();
                        }
                    }

                    // Toggle 
                    if(this.repeat_preview_active) {
                        let n_strokes = this.recorded_actions.length
                        for (let i = 0; i < n_strokes; i++) {
                            let p = Vec(window.innerWidth/2 - (n_strokes*15) + i * 30,  window.innerHeight-25)
                            if(Vec.dist(p, pos) < 20) {
                                console.log("tap", i);
                                if(i == this.repeat_start) {
                                    this.repeat_start = i+1
                                } else if(i == this.repeat_start-1) {
                                    this.repeat_start = i
                                } else if(i == this.repeat_end) {
                                    this.repeat_end = i-1
                                } else if(i == this.repeat_end+1) {
                                    this.repeat_end = i
                                }

                                this.speculative_repeat()
                            }
                        }
                    }

                    if(Vec.dist(Vec(window.innerWidth-40, window.innerHeight-25), pos) < 20) {
                        if(this.repeat_preview_active) {
                            this.repeat_preview_active = false
                            this.repeat_preview = []
                        }
                    }
                }
    
                if (event.type == 'ended') {
                    if (event.timestamp - this.finger_down_time > 1.0) {
                        this.ref_line = null;
                    }
                }
            }); 
        });
    }

    toggleModes() {
        if (this.mode === 'draw') {
            this.mode = 'move';
        } else if (this.mode === 'move') {
            this.mode = 'move-v2';
        } else {
            this.mode = 'draw';
        }
    }

    speculative_repeat(){
        let start_position = this.last_point.pos
        this.repeat_preview = []
        this.recorded_actions.slice(this.repeat_start, this.repeat_end+1).forEach(lrs=>{
            
            let last_recorded_stroke = lrs.stroke

            let a_b = Vec.sub(last_recorded_stroke.b, last_recorded_stroke.a)
            let next_position = Vec.add(start_position, a_b)
            let line = Line(start_position, next_position)

            line.ref_line = lrs.line

            this.repeat_preview.push(line)
            start_position = next_position
        })
        
    }

    apply_speculative_repeat(){
        this.repeat_preview.forEach(pv=>{
            this.wet_stroke = new WetStroke(pv.a)
            this.wet_stroke.update(pv.b, [], pv.ref_line)
            this.end_stroke(null, true)
        })
        this.speculative_repeat()
    }

    repeat() {
        this.recorded_actions.forEach(lrs=>{
            let start_point = this.last_point;
            let last_recorded_stroke = lrs.stroke

            let a_b = Vec.sub(last_recorded_stroke.b, last_recorded_stroke.a)
            this.wet_stroke = new WetStroke(start_point.pos)
            this.wet_stroke.update(Vec.add(this.wet_stroke.a, a_b), [], lrs.line)
            this.end_stroke(null, true)
        })
    }

    render(ctx) {
        let repeat_set = this.recorded_actions.slice(this.repeat_start, this.repeat_end+1)
        this.lines.forEach(line => {
            let in_set = repeat_set.find(rs=>rs.line.id == line.id);
            let highlight = this.repeat_preview_active ? in_set : line === this.ref_line
            line.render(ctx, highlight);

        })
        this.points.forEach(point => {
            point.render(ctx);
        })

        if (this.wet_stroke) {
            this.wet_stroke.render(ctx);
        }


        ctx.strokeStyle = "#CCCCCC";
        
        // Draw repeat preview
        this.repeat_preview.forEach(line=>{
            ctx.beginPath();
            ctx.moveTo(line.a.x, line.a.y);
            ctx.lineTo(line.b.x, line.b.y);
            ctx.stroke();
        })

        if(this.repeat_preview_active) {
            let n_strokes = this.recorded_actions.length
            for (let i = 0; i < n_strokes; i++) {
                ctx.beginPath();
                ctx.ellipse(window.innerWidth/2 - (n_strokes*15) + i * 30, window.innerHeight-25, 10, 10, 0, 0, Math.PI * 2);
                if(i >= this.repeat_start && i <= this.repeat_end) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                
            }
        }

        // CHROME
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;
        // Draw toggle
        ctx.beginPath();
        ctx.ellipse(40, 40, 20, 20, 0, 0, Math.PI * 2);
        if (this.mode === 'draw') {
            ctx.fill();
        } else {
            ctx.stroke();
        }

        ctx.fillText(this.mode, 70, 40);


        // Draw repeat button
        ctx.beginPath();
        ctx.ellipse(40, window.innerHeight-25, 20, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText("Repeat", 70, window.innerHeight-24);
        
        
    }
}

export default DrawRepeat;
