import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';

import Vec from '../../lib/vec';
import NumberToken from './NumberToken';
import {equals, formula, variable} from "../constraints"

const PADDING = 3;

export default class Formula extends Token {
  primary = false;
  height = 40 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  constraints: any[] = [];

  constructor() {
    super();
  }

  addToken(t: Token) {
    this.adopt(t);
    this.parseFormula();
  }

  lastToken() {
    return Array.from(this.children).pop();
  }

  render(): void {
    // Layout child tokens in horizontal sequence
    let nextTokenPosition = Vec.add(this.position, Vec(PADDING, PADDING));
    for (const token of this.children as Set<NumberToken>) {
      token.position = nextTokenPosition;
      token.render();
      nextTokenPosition = Vec.add(
        nextTokenPosition,
        Vec(token.width + PADDING, 0)
      );
    }

    this.width = nextTokenPosition.x - this.position.x;

    // Update box wrapper
    if (this.children.size === 0) {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: 0,
      });
      this.width -= PADDING * 2;
    } else {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: this.width,
      });
    }
  }

  remove(): void {
    this.boxElement.remove();
    super.remove();
  }

  parseFormula(){

    // this.constraints.forEach(c=>{
    //   c.remove();
    // })

    let stack = [
      {variableNames:[], variables: [], formulaTokens: []}
    ];

    for(const child of this.children) {
      if(child instanceof OpToken) {
        if(child.stringValue == "=") {
          stack.unshift({variableNames:[], variables: [], formulaTokens: []})
        } else {
          stack[0].formulaTokens.push(child.stringValue);
        }
      } else {
        // TODO: improve types
        //@ts-ignore
        const v = child.getVariable();
        const name = "v_"+stack[0].variables.length
        stack[0].formulaTokens.push(name);
        stack[0].variableNames.push(name);
        stack[0].variables.push(v);
      }
    }

    let constraintVariables = []
    
    stack.forEach(f=>{
      if(f.formulaTokens.length==0) return;
      if(f.formulaTokens.length==1) return constraintVariables.push(f.variables[0]);
      let functionText = `return ${f.formulaTokens.join(" ")};`;
      
      try {
        let func = new Function("["+f.variableNames.join(",")+"]",functionText);
        constraintVariables.push(formula(f.variables, func).variables.result);
      } catch {
        console.log("invalid formula");
      }
    })

    console.log(constraintVariables);
    
    
    if(constraintVariables.length == 2) {
      equals(constraintVariables[0], constraintVariables[1]);
    }
    

    this.constraints = constraintVariables;
  }
}

// OPS
export class OpToken extends Token {
  stringValue = 'x';

  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.GREY_DARK,
    'font-size': '30px',
  }) as SVGTextElement;

  constructor(value: string) {
    super();
    this.stringValue = value;
  }

  render() {
    // Update text content
    this.textElement.textContent = this.stringValue;
    this.width = this.textElement.getComputedTextLength() + 10;

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
    });
  }

  remove(): void {
    this.textElement.remove();
    super.remove();
  }
}
