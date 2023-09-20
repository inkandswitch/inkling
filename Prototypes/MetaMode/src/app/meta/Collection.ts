import Token, { TokenGroup } from "./Token";
import { Position } from "../../lib/types";
import SVG from "../Svg";
import Vec from "../../lib/vec";
import COLORS from "./Colors";
import NumberToken from "./NumberToken";
import { AppendListSnapAction, SnapAction } from "./SnapActions";

const PADDING = 3;
const SNAPZONE = 40;

export default class Collection extends TokenGroup {
  type = "collection";
  tokens: Array<Token>;

  position: Position = {x: 100, y: 100};
  width: number = 0;
  height: number = 46;

  reordered = true;
  
  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  constructor(tokens: Array<Token>){
    super();
    this.tokens = tokens;
    
    for(const t of tokens) {
      t.parent = this;
    }


    // Move me to the back, I'm not a fan of this... how to improve this?
    const parentElement = this.boxElement.parentElement!;
    parentElement.insertBefore(this.boxElement, parentElement.firstChild);

    this.updateView();
  }

  isPointSnapping(position: Position, other: NumberToken): SnapAction | null {
    // Snap below
    if(
      position.x > this.position.x &&
      position.y > this.position.y + this.height &&
      position.x < this.position.x + this.width &&
      position.y < this.position.y + this.height + SNAPZONE
    ) {
      return new AppendListSnapAction(
        Vec(this.position.x, this.position.y + this.height + 3),
        this, other,
        this.tokens.length
      )
    }

    // Snap above
    if(
      position.x > this.position.x &&
      position.y > this.position.y - SNAPZONE &&
      position.x < this.position.x + this.width &&
      position.y < this.position.y
    ) {
      return new AppendListSnapAction(
        Vec(this.position.x, this.position.y - SNAPZONE - 3),
        this, other,
        0
      )
    }
    return null
  }

  attachChild(token: Token, index: number) {
    this.tokens.splice(index, 0, token);
    this.reordered = true;
    this.updateView();
  }

  dislodgeChild(token: Token){
    this.reordered = true;
    return super.dislodgeChild(token);
  }

  updateView(){
    // Layout child tokens in vertical sequence
    if(this.reordered) {
      this.position = Vec.sub(this.tokens[0].position, Vec(PADDING, PADDING));
      this.reordered = false;
    }

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

  remove(){
    this.boxElement.remove();
  }
}