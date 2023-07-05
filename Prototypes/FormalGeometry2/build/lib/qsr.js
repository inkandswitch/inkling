import Vec from "./vec.js"

function near(a, b, config){
    return function(input){
        let input_a = a(input)
        let input_b = b(input)

        let matches = []
        input_a.forEach(token_a=>{
            token_a.bounds
        })
    }
}

function token(kind){
    return function(input){
        return input.filter(t=>t.kind == kind)
    }
}

let page = [
    {type: "token", bounds: new Box(Vec(10, 10), Vec(20, 20)), kind: "x"},
    {type: "token", bounds: new Box(Vec(40, 10), Vec(50, 20)), kind: "box"}
]

let q = near(token("x"), token("box"), {})
console.log(
    
);

class Box {
    constructor(a, b){
        this.a = a || Vec()
        this.b = b || Vec()

        // Normalise rect
        if(this.a.x > this.b.x) [this.a.x, this.b.x] = [this.b.x, this.a.x]
        if(this.a.y > this.b.y) [this.a.y, this.b.y] = [this.b.y, this.a.y]    
    }

    overlaps(other){
        // Get the coordinates of the four points defining the two boxes
        const x1 = this.a.x;
        const y1 = this.a.y;
        const x2 = this.b.x;
        const y2 = this.b.y;
        const x3 = other.a.x;
        const y3 = other.a.y;
        const x4 = other.b.x;
        const y4 = other.b.y;

        // Check if the boxes overlap in the x-axis
        const xOverlap = Math.max(x1, x2) >= Math.min(x3, x4) && Math.max(x3, x4) >= Math.min(x1, x2);

        // Check if the boxes overlap in the y-axis
        const yOverlap = Math.max(y1, y2) >= Math.min(y3, y4) && Math.max(y3, y4) >= Math.min(y1, y2);

        // Return true if the boxes overlap in both axes
        return xOverlap && yOverlap;
    }

    contains(other){
        const x1 = this.a.x;
        const y1 = this.a.y;
        const x2 = this.b.x;
        const y2 = this.b.y;
        const x3 = other.a.x;
        const y3 = other.a.y;
        const x4 = other.b.x;
        const y4 = other.b.y;

        const xContains = x1 < x3 && x2 > x4
        const yContains = y1 < y3 && y2 > y4
        return xContains && yContains
    }
}