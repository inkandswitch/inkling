import NumberToken from "./NumberToken";
import Token, { TokenGroup } from "./Token";
import { Position } from "../../lib/types";
import SVG from "../Svg";
import Vec from "../../lib/vec";
import COLORS from "./Colors";

const PADDING = 3;

export default class Formula extends TokenGroup {
  type = "formula";
  tokens: Array<Token> = new Array();
  width: number = 90;
  height: number = 46;
  position: Position = {x: 100, y: 100};

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  constructor() {
    super();
    this.updateView();
  }

  addToken(t: Token) {
    this.tokens.push(t);
    this.updateView();
  }

  updateView() {
    // Layout child tokens in horizontal sequence
    let position = Vec.add(this.position, Vec(PADDING, PADDING));
    for(const token of this.tokens) {
      token.position = Vec.clone(position);
      token.updateView();
      position = Vec.add(position, Vec(token.width + PADDING, 0));
    }
    
    this.width = position.x - this.position.x

    // Update box wrapper
    if(this.tokens.length == 0) {
      SVG.update(this.boxElement, {
        x: this.position.x, y: this.position.y,
        width: 0,
      })
      position.x -= PADDING*2;
      this.width -= PADDING*2;
    } else {
      SVG.update(this.boxElement, {
        x: this.position.x, y: this.position.y,
        width: this.width,
      })
    }
  }

  dislodgeChild(token: Token){
    this.tokens = this.tokens.filter(t => t!= token);
    if(this.tokens.length <= 1) {
      return this;
    } else {
      this.updateView();
    }
    return null;
  }

  lastToken(): Token {
    return this.tokens[this.tokens.length-1];
  }

  remove(): void {
    this.boxElement.remove();
  }
}

export class OpToken extends Token {
  type = "op";
  stringValue: string = "x";

  position: Position = {x: 100, y: 100};
  width: number = 90;

  protected textElement = SVG.add('text', {
    x: this.position.x+5, y: this.position.y + 30,
    fill: COLORS.GREY_DARK,
    "font-size": "30px"
  }, undefined, "1234");

  constructor(op: string){
    super()
    this.stringValue = op
  }

  updateView(){
    // Update text content
    this.textElement.textContent = this.stringValue;
    this.width = (this.textElement as any).getComputedTextLength()+10;

    SVG.update(this.textElement, {
      x: this.position.x + 5, y: this.position.y + 30,
    })
  }

  isPointInside(position: Position): boolean {
    return false;
  }

  remove(): void {
    this.textElement.remove();
  }
}