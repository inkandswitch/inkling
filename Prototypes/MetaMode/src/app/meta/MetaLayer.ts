import { Position } from "../../lib/types";
import NumberToken from "./NumberToken";

import Formula from "./Formula";
import FormulaEditor from "./FormulaEditor";
import { SnapAction } from "./SnapActions";
import Wire from "./Wire";

export default class MetaLayer {
  tokens: Array<any> = [];
  wires: Array<Wire> = [];

  constructor (){
    let token = new NumberToken(100);
    this.tokens.push(token);

    let token2 = new NumberToken(50);
    token2.position = {x: 100, y: 200};
    token2.updateView();
    this.tokens.push(token2);
  }

  addWire(position: Position) {
    let wire = new Wire(position);
    this.wires.push(wire);
    return wire;
  }

  drawPoint(wire: Wire, position: Position){
    wire.drawPoint(position);
  }

  findAtPosition(position: Position){
    return this.tokens.find(token=>{
      return token.isPointInside(position);
    })
  }

  findSnapOpportunity(token: NumberToken, position: Position): SnapAction | null {
    for( const otherToken of this.tokens) {
      if(otherToken != token) {
        let snapping = otherToken.isPointSnapping(position, token);
        if(snapping != null) {
          return snapping;
        }
      }
    }

    return null;
  }

  doSnap(action: SnapAction){
    let result = action.doSnap();
    //this.tokens.push(result);
  }

  reflowWires(){

  }
}