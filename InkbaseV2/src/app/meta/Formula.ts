import Token, { aToken } from './Token';
import SVG from '../Svg';
import Vec from '../../lib/vec';
import { isTokenWithVariable } from './token-helpers';
import NumberToken, { aNumberToken } from './NumberToken';
import OpToken from './OpToken';
import EmptyToken, { aEmptyToken } from './EmptyToken';
import WritingCell, { aWritingCell } from './WritingCell';
import { GameObject } from '../GameObject';
import FormulaParser from './FormulaParser';
import LabelToken from './LabelToken';
import * as constraints from '../constraints';

const PADDING = 3;

export default class Formula extends Token {
  readonly height = 30 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'parsed-formula',
  });

  private constraint: constraints.Formula | null = null;

  isPrimary() {
    return false;
  }

  edit() {
    // remove existing constraint
    if (this.constraint != null) {
      this.constraint.remove();
    }

    // remove anything after the '=' sign 
    // TODO: I don't really like this, but okay for now 
    let tokens = this.findAll({ what: aToken })
    let equalsTokenIndex = tokens.findIndex(t => (t instanceof OpToken && t.stringValue == '='));
    if (equalsTokenIndex > -1) {
      for (let i = equalsTokenIndex; i < tokens.length; i++) {
        tokens[i].remove();
      }
    }



    //create new empty spaces
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());


    // Toggle embedded numbers
    const numberTokens = this.findAll({ what: aNumberToken });
    for (const token of numberTokens) {
      token.edit();
    }

    // Toggle mode
    this.editing = true;
    this.updateCells();

  }

  close() {
    if (!this.editing) {
      return;
    }

    // Cleanup
    const emptyTokens = this.findAll({ what: aEmptyToken });

    for (const token of emptyTokens) {
      token.remove();
    }

    this.editing = false;
    this.updateCells();

    // Detach single token formula's
    const tokens = this.findAll({ what: aToken });
    if (tokens.length === 1) {
      tokens[0].embedded = false;
      tokens[0].editing = false;
      this.page.adopt(tokens[0]);
      this.remove();
    } else { // Parse the formula if we can
      // Generate string
      const tokens = this.findAll({ what: aToken });
      let formula = [];
      for (const token of tokens) {
        if (token instanceof OpToken) {
          formula.push(token.stringValue);
        } else if (token instanceof NumberToken) {
          formula.push("@" + token.id)
        } else if (token instanceof LabelToken) {
          formula.push("#" + token.id)
        }
      }

      const parser = new FormulaParser(this.page);
      const result = parser.parse(formula.join(' '));

      if (result) {
        this.constraint = result;
        this.adopt(new OpToken("="));
        this.adopt(new NumberToken(result.result));
      }
    }

    const numberTokens = this.findAll({ what: aNumberToken });
    for (const token of numberTokens) {
      token.close();
    }
  }

  updateCells() {
    const cells = this.findAll({ what: aWritingCell });
    const tokens = this.findAll({ what: aToken });
    for (const cell of cells) {
      cell.remove();
    }

    // TODO: Do this in a better way so we don't loose state all over the place
    if (this.editing) {
      const cellCount = 0;
      for (const token of tokens) {
        if (token instanceof NumberToken) {
          const size = token.variable.value.toFixed(0).split('').length;
          for (let i = 0; i < size; i++) {
            const cell = new WritingCell();
            this.adopt(cell);
          }
        } else {
          const cell = new WritingCell();
          this.adopt(cell);
        }
      }
    }
  }

  layoutCells() {
    const cells = this.findAll({ what: aWritingCell });
    const tokens = this.findAll({ what: aToken });

    if (this.editing) {
      const cellCount = 0;
      for (const token of tokens) {
        if (token instanceof NumberToken) {
          const size = token.editValue.length;
          for (let i = 0; i < size; i++) {
            const cell = cells.shift();
            if (cell) {
              cell.position = Vec.add(
                token.position,
                Vec((24 + PADDING) * i, 0)
              );
            }
          }
        } else {
          const cell = cells.shift();
          if (cell) {
            cell.position = token.position;
            cell.width = token.width;
          }
        }
      }
    }
  }

  updateWritingCells() {
    const tokens = this.findAll({ what: aToken });
    let tokenIndex = 0;
    let token = tokens[tokenIndex];
    let offsetInsideToken = -1;

    const cells = this.findAll({ what: aWritingCell });

    for (const [i, cell] of cells.entries()) {
      // Step forward through tokens
      offsetInsideToken += 1;

      // compute tokensize
      let tokenSize = 0;
      if (token instanceof NumberToken) {
        tokenSize = token.editValue.length;
      } else {
        tokenSize = 1;
      }

      if (offsetInsideToken === tokenSize) {
        offsetInsideToken = 0;
        tokenIndex += 1;
        token = tokens[tokenIndex];
      }

      if (cell.stringValue !== '') {
        // Handle all tokenizations
        // If it's a number token and
        if (token instanceof NumberToken) {
          if (isNumeric(cell.stringValue)) {
            token.updateCharAt(offsetInsideToken, cell.stringValue);
          } else {
            // Split this number token
          }
        } else if (token instanceof EmptyToken) {
          if (isNumeric(cell.stringValue)) {
            const prev = tokens[tokenIndex - 1];
            if (prev instanceof NumberToken) {
              prev.addChar(cell.stringValue);
            } else {
              const numToken = new NumberToken();
              numToken.addChar(cell.stringValue);
              tokens.push(tokens[tokenIndex]);
              tokens[tokenIndex] = numToken;
            }
          } else {
            const opToken = new OpToken(cell.stringValue);
            tokens.push(tokens[tokenIndex]);
            tokens[tokenIndex] = opToken;
          }
        }

        cell.stringValue = '';

        for (const t of tokens) {
          this.adopt(t);
        }

        this.updateCells();
      }
    }
  }

  insertInto(emptyToken: EmptyToken, newToken: Token) {
    const tokens = this.findAll({ what: aToken });
    for (const [i, token] of tokens.entries()) {
      if (emptyToken === token) {
        tokens.splice(i, 0, newToken);
        break;
      }
    }

    for (const t of tokens) {
      this.adopt(t);
    }

    this.updateCells();
  }

  render(dt: number, t: number): void {
    // Process input
    if (this.editing) {
      this.updateWritingCells();
    }

    // Layout child tokens in horizontal sequence
    let nextTokenPosition = Vec.add(this.position, Vec(PADDING, PADDING));
    const tokens = this.findAll({ what: aToken });
    for (const token of tokens) {
      token.position = nextTokenPosition;

      token.embedded = true;
      token.editing = this.editing;

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

    // Move cells
    this.layoutCells();

    // render children
    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  remove() {
    this.boxElement.remove();
    for (const token of this.children as Set<Token>) {
      if (isTokenWithVariable(token)) {
        token.getVariable().remove();
      }
    }
    super.remove();
  }
}

function isNumeric(v: string) {
  return '0' <= v && v <= '9';
}

export const aFormula = (gameObj: GameObject) =>
  gameObj instanceof Formula ? gameObj : null;
