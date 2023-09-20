import { Position } from "../../lib/types";
import NumberToken from "./NumberToken";

import Formula from "./Formula";
import FormulaEditor from "./FormulaEditor";
import { SnapAction } from "./SnapActions";
import Wire from "./Wire";
import Scope from "./Scope";
import Collection from "./Collection";
import Token, { TokenGroup } from "./Token";

export default class MetaLayer {
  editor: FormulaEditor = new FormulaEditor(this);
  tokens: Array<any> = [];
  wires: Array<Wire> = [];

  scope: Scope = new Scope();

  constructor (){
    this.addNumberToken({x: 100, y: 100}, 100);
    this.addNumberToken({x: 100, y: 200}, 200);
  }

  addNumberToken(position: Position, value: number = 1): NumberToken {
    let variable = this.scope.addVariable(value);
    let token = new NumberToken(position, variable);
    this.tokens.push(token);
    return token;
  }

  addWire(position: Position) {
    let wire = new Wire(position);
    this.wires.push(wire);
    return wire;
  }

  addCollection(children: Array<NumberToken>) {
    let collection = new Collection(children);
    this.tokens.push(collection);

    this.tokens = this.tokens.filter(b=>children.indexOf(b)== -1); // Filter out nested blocks
    
    return collection;
  }

  appendToCollection(collection: Collection, token: NumberToken, index: number){
    collection.attachChild(token, index);
    this.tokens = this.tokens.filter(t=>t!==token);
    collection.updateView();
  }

  removeToken(token: Token){
    token.remove();
    if(token.kind == 'tokengroup') {
      this.tokens = this.tokens.concat((token as TokenGroup).tokens)
    }
    this.tokens = this.tokens.filter(t=>t!==token);
  }

  removeWire(wire: Wire) {
    this.wires = this.wires.filter(w=>w!=wire);
    wire.remove();
  }

  updateWireConnections(wire: Wire) {
    if(wire.input && wire.output) {
      let merged = this.scope.mergeVariables(wire.input.variable, wire.output.variable);
      wire.input.variable = merged;
      wire.output.variable = merged;
      wire.input.updateView();
      wire.output.updateView();
    }
  }

  dislodge(token: Token){
    let removeToken = token.dislodge();
    if(removeToken != null) {
      this.removeToken(removeToken);
    }
    this.tokens.push(token);
  }

  drawPoint(wire: Wire, position: Position){
    wire.drawPoint(position);
  }

  findAtPosition(position: Position) {
    return this.tokens.find(token=>{
      return token.isPointInside(position);
    })
  }

  findTokenAtPosition(position: Position) {
    for(const token of this.tokens) {
      if(token.kind == "tokengroup") {
        const found = token.findAtPosition(position);
        if(found) {
          return found;
        }
      } else {
        if(token.isPointInside(position)) {
          return token;
        }
      }
    }
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
  
  activateEditor(position: Position) {
    this.editor.activate(position);
  }

  doSnap(action: SnapAction) {
    action.doSnap(this);
  }

  parseStrokes() {
    this.editor.parseStrokes(this);
  }

  updateView(){

  }

}