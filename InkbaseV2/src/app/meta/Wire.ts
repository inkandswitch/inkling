import { GameObject } from '../GameObject';
import COLORS from './Colors';
import SVG from '../Svg';
import Token from './Token';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { equals } from '../constraints';

// TODO: properly implement this so it only works for tokens with a variable

export default class Wire extends GameObject { 
  
  points: Array<Position> = new Array();
  a: WeakRef<Token> | null = null;
  b: WeakRef<Token> | null = null;
  
  protected wireElement = SVG.add('polyline', { 
    points: "",
    stroke: COLORS.BLUE,
    fill: "none"
  });

  render(dt: number, t: number): void {
    let a = this.a?.deref();
    let b = this.b?.deref();
    
    if(a != null) {
      this.points[0] = a.midPoint();
    }

    if(b != null) {
      this.points[1] = b.midPoint();
    }

    let points = SVG.points(this.points);
    SVG.update(this.wireElement, {
      points
    })
  }

  isCollapsable(){
    return Vec.dist(this.points[0], this.points[1]) < 10;
  }

  attachFront(token: Token) {
    this.a = new WeakRef(token);
    this.updateConstraint();
  }

  attachEnd(token: Token) {
    this.b = new WeakRef(token);
    this.updateConstraint();
  }

  updateConstraint(){
    let a = this.a?.deref();
    let b = this.b?.deref();

    if(a != null && b != null) {
      //@ts-ignore
      equals(a.getVariable(), b.getVariable());
    }
  }

  remove(): void {
    this.wireElement.remove();
    super.remove();
  }
}