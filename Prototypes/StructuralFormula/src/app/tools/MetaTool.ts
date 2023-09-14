import Line from '../../lib/line';
import Vec from '../../lib/vec';
import Events from '../NativeEvents';
import Page from '../Page';
import SVG from '../Svg';

export default class MetaTool {
  button: SVGElement;
  private isSelected = false;

  line: any[] = [];

  labelStrokes: any[] = [];

  isMetaDrawing = false;
  isRegularDrawing = false;

  constructor (
    label: string,
    public buttonX: number,
    public buttonY: number,
    public page: Page
  ){
    this.button = SVG.add('circle', { cx: buttonX, cy: buttonY, r: 20 });
    SVG.add('text', { x: buttonX, y: buttonY, class: 'tool', content: label });
    this.refreshButton();
  }
  
  update(events: Events) {
    const pencilDown = events.find('pencil', 'began');
    if (pencilDown) {

      let foundGroup = this.page.strokeGroups.find(group=>{
        return group.isPositionInsideBounds(pencilDown.position);
      })

      if(foundGroup) {
        this.isMetaDrawing = true
        let point = findClosestPositionOnStroke(foundGroup.outlinePoints, pencilDown.position);
        this.line = [
          point,
          Vec.clone(point),
          Vec.clone(point)
        ]
      } else {
        this.labelStrokes.push([pencilDown.position]);
        this.isRegularDrawing = true;
      }
    }

    const pencilMoved = events.findAll('pencil', 'moved');
    if (this.line.length > 0 && this.isMetaDrawing) {
      pencilMoved.forEach(pencilMove => {
        this.line[1].y = pencilMove.position.y
        
        this.line[2].x = pencilMove.position.x
        this.line[2].y = pencilMove.position.y
      });
    } else if(this.isRegularDrawing) {
      pencilMoved.forEach(pencilMove => {
        let stroke = this.labelStrokes[this.labelStrokes.length-1];
        stroke.push(pencilMove.position)
      });
    }

    const pencilUp = events.find('pencil', 'ended');
    if (pencilUp) {
      this.isMetaDrawing = false;
      this.isRegularDrawing = false;
    }
  }



  private refreshButton() {
    SVG.update(this.button, {
      fill: this.isSelected ? 'black' : 'lightgrey',
    });

  }

  onSelected() {
      this.isSelected = true;
      this.refreshButton();
  }

  onDeselected() {
    this.isSelected = false;
    this.refreshButton();
  }

  render(){
    if(this.line.length == 0) {
      return
    }

    SVG.now("polyline", {
      points: SVG.points(this.line),
      stroke: "blue",
      fill: "none"
    })


    SVG.now("circle", {
      cx: this.line[2].x,
      cy: this.line[2].y,
      r: this.isMetaDrawing ? 5 : 15,
      fill: "blue"
    })

    this.labelStrokes.forEach(stroke=>{
      SVG.now("polyline", {
        points: SVG.points(stroke),
        fill: "none",
        stroke: "white",
        "stroke-width": 2
      });
    })
  }
}

function findClosestPositionOnStroke(points, position){
  let closestPoint = points[0]
  let closestDist = Vec.dist(closestPoint, position)

  for (let i = 0; i < points.length-1; i++) {
    const a = points[i];
    const b = points[(i+1) % points.length];
    let foundPt = Line.closestPoint({a, b}, position);
    let dist = Vec.dist(foundPt, position);
    if(dist < closestDist) {
      closestDist = dist;
      closestPoint = foundPt;
    }
  }
  return closestPoint
}