// The current scope

import { Position } from "../../lib/types";

export default class Scope {
  variables: Array<Variable> = [];
  labels: Array<Label> = [];
  labels: Map<Label, Variable> = new Map();

  // TODO:
  // parentScope?
  // nestedScopes?

  addVariable(value: number) {
    let variable = new Variable(value);
    this.variables.push(variable);
    return variable;
  }

  mergeVariables(a: Variable, b: Variable) {
    // Remove b
    this.variables.filter(v=>v!==b);

    return a;
    // TODO: Update label references
  }

  addLabel(strokes: Array<Array<Position>>){
    let label = new Label(strokes);
    this.labels.push(label);
    return label;
  }
}

export class Variable {
  value: number;

  constructor(value: number = 0) {
    this.value = value;
  }

  string(): string {
    return this.value.toString();
  }
}

export class Label {
  width: number = 0;
  strokes: Array<Array<Position>>;

  constructor(strokes: Array<Array<Position>>){
    this.strokes = strokes;
    
    // Normalize Strokes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;

    for(const stroke of this.strokes) {
      for(const pt of stroke) {
        if(pt.x < minX) { minX = pt.x; }
        if(pt.x > maxX) { maxX = pt.x; }
        if(pt.y < minY) { minY = pt.y; }
      }
    }

    for(const stroke of this.strokes) {
      for(const pt of stroke) {
        pt.x -= minX;
        pt.y -= minY;
      }
    }

    this.width = maxX - minX;
    // if(this.width < 46) {
    //   this.width = 46;
    // }
  }
}