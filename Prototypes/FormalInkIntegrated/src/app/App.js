//import Canvas from "./Canvas";
import Page from "./Page"
import Selection from "./Selection";
import SVG from "./Svg";

export default class App {
    constructor(){
        //this.canvas = new Canvas(document.body);
        this.svg = new SVG();
        this.page = new Page(this.svg);
        let a = this.page.addPoint({x: 100, y: 100});
        let b = this.page.addPoint({x: 200, y: 200});
        let c = this.page.addPoint({x: 200, y: 100});
        this.page.addPoint({x: 300, y: 300});
        this.page.addPoint({x: 400, y: 400});

        this.page.addLineSegment(a, b)
        this.page.addLineSegment(b, c)
        this.page.addLineSegment(c, a)

        this.selection = new Selection(this.page);
    }

    update(events){
        this.selection.update(events);
    }

    render(){
        this.selection.render(this.svg);
        this.page.render(this.svg);
    }
}