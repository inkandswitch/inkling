// The current scope

import { Position } from "../../lib/types";

export default class Scope {
  variables: Array<Variable> = [];
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
    //this.width = 
  }
}