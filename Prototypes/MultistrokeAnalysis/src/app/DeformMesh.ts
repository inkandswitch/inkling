import Vec from "../lib/vec";

class SpringPoint {
  constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0; // velocity in x direction
      this.vy = 0; // velocity in y direction
      //this.mass = 0.5;
  }
}

class Spring {
  constructor(pointA, pointB, length) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.length = length;
    this.stiffness = 0.5;
  }
  
  update() {
    let offset = Vec.sub(this.pointA, this.pointB);

    //const distance = Vec.dist(this.pointA, this.pointB);
    const displacement = this.length - Vec.len(offset);
    const direction = Vec.normalize(offset);
    const forceSize = this.stiffness * displacement;
    const force = Vec.mulS(direction, forceSize * 0.5);
  
    //if(Math.abs( > 1)) {
      //this.length = forceSize*0.01;
    //}

    this.pointA.vx += force.x;
    this.pointA.vy += force.y;
    this.pointB.vx -= force.x;
    this.pointB.vy -= force.y;

  }
}


export default class DeformMesh {
  svgElements: SVGElement[] = [];
  
  constructor(mesh, controlPoints){
    this.mesh = mesh;
    this.points = this.mesh.points.map(pt=>new SpringPoint(pt.x, pt.y))
    this.springs = this.mesh.edges.map(edge=>{
      let length = Vec.dist(this.points[edge[0]], this.points[edge[1]]);
      return new Spring(this.points[edge[0]], this.points[edge[1]], length);
    })

    this.controlPoints = controlPoints;

    this.controlPointIndexes = this.controlPoints.map(ctpt=>{
      return this.points.findIndex(pt=>Vec.dist(pt, ctpt.position) < 1)
    })
    console.log(this.controlPointIndexes);
    
  }

  update() {
    this.controlPoints.forEach((ctpt, i)=>{
      let pt = this.points[this.controlPointIndexes[i]]
      pt.x = ctpt.position.x
      pt.y = ctpt.position.y
    })


    for (const spring of this.springs) {
        spring.update();
    }
    
    for (const point of this.points) {
      if(Vec.len(Vec(point.vx, point.vy)) > 0.001) {
        // Simulate basic motion with simple Euler integration
        point.x += point.vx;
        point.y += point.vy;
      }
        // // Add damping to slow down the motion
        point.vx *= 0.5;
        point.vy *= 0.5;
    }
  }

  render(svg){
    // if(!this.dirty) {
    //   return
    // }
    for(let i =0; i<500; i++) {
      this.update();  
    }
    

    for (const elem of this.svgElements) {
      elem.remove();
    }

    this.springs.forEach(spring=>{
      let points = [spring.pointA, spring.pointB];
      let polylinePoints = points.map(pt=>`${pt.x} ${pt.y}`).join(' ');
      this.svgElements.push(svg.addElement("polyline", {
        points: polylinePoints,
        fill: "none",
        stroke: "rgba(0,0,255,1)",
      }))
    })

    this.controlPoints.forEach(pt=>pt.render(svg));
    // this.mesh.edges.forEach(tri=>{
    //   let points = tri.map(pti=>this.mesh.points[pti]);
      
    //   let polylinePoints = points.map(pt=>`${pt.x} ${pt.y}`).join(' ')

    //   this.svgElements.push(svg.addElement("polyline", {
    //     points: polylinePoints,
    //     fill: "none",
    //     stroke: "rgba(0,0,255,1)",
    //   }))
    // })

    //this.dirty = true;
  }
}