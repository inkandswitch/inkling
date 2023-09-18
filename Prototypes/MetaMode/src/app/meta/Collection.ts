import Token from "./Token";
import { Position } from "../../lib/types";
import SVG from "../Svg";
import Vec from "../../lib/vec";
import COLORS from "./Colors";

const PADDING = 3;

export default class Collection {
  tokens: Array<Token>;

  position: Position = {x: 100, y: 100};
  width: number = 0;
  height: number = 46;
  

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  constructor(tokens: Array<Token>){
    this.tokens = tokens;
    this.updateView();
    
    for(const t of tokens) {
      t.parent = this;
    }

    // Move me to the back, I'm not a fan of this... how to improve this?
    const parentElement = this.boxElement.parentElement!;
    parentElement.insertBefore(this.boxElement, parentElement.firstChild);
  }

  dislodgeChild(token: Token){
    this.tokens = this.tokens.filter(t => t!= token);
    if(this.tokens.length <= 1) {
      this.boxElement.remove();
    } else {
      this.updateView();
    }
  }

  updateView(){
    // Layout child tokens in vertical sequence
    this.position = Vec.sub(this.tokens[0].position, Vec(PADDING, PADDING));
    this.width = 0;
    let position = Vec.add(this.position, Vec(PADDING, PADDING));
    for(const token of this.tokens) {
      token.position = Vec.clone(position);
      token.updateView();
      position = Vec.add(position, Vec(0, token.height + PADDING));
      this.width = Math.max(this.width, token.width);
    }
    
    this.width = this.width + PADDING * 2;
    this.height = position.y - this.position.y;

    SVG.update(this.boxElement, {
      x: this.position.x, y: this.position.y,
      width: this.width, height: this.height
    })
  }
}