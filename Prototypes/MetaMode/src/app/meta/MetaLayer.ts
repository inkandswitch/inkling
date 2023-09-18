import { Position } from "../../lib/types";
import NumberToken from "./NumberToken";

import Formula from "./Formula";
import FormulaEditor from "./FormulaEditor";
import { SnapAction } from "./SnapActions";
import Wire from "./Wire";
import Scope from "./Scope";

export default class MetaLayer {
  tokens: Array<any> = [];
  wires: Array<Wire> = [];
  scope: Scope = new Scope();

  constructor (){
    this.addNumberToken({x: 100, y: 100}, 100);
    this.addNumberToken({x: 100, y: 200}, 200);
    //this.addLabelToken({x: 100, y: 200}, "Hello");
  }

  addNumberToken(position: Position, value: number = 1){
    let variable = this.scope.addVariable(value);
    let token = new NumberToken(position, variable);
    this.tokens.push(token);
  }

  addWire(position: Position) {
    let wire = new Wire(position);
    this.wires.push(wire);
    return wire;
  }

  updateWireConnections(wire: Wire){
    if(wire.input && wire.output) {
      let merged = this.scope.mergeVariables(wire.input.variable, wire.output.variable);
      wire.input.variable = merged;
      wire.output.variable = merged;
      wire.input.updateView();
      wire.output.updateView();

    }
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