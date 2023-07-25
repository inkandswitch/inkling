//import Canvas from "./Canvas";
import Page from "./Page"
import Selection from "./Selection";
import SVG from "./Svg";

export default class App {
    constructor(){
        //this.canvas = new Canvas(document.body);
        this.svg = new SVG();
        this.page = new Page();
        this.page.addPoint({x: 100, y: 100});

        this.selection = new Selection(this.page);

    }

    update(events){
        this.selection.update(events)
    }

    render(){
        
        //this.canvas.clear();
        //let ctx = this.canvas.ctx;

        this.selection.render(this.svg);
        this.page.render(this.svg);
    }
}