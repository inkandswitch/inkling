import Token, { aToken } from './Token';
import SVG from '../Svg';
import Vec from '../../lib/vec';
import NumberToken, { aNumberToken } from './NumberToken';
import OpToken from './OpToken';
import EmptyToken, { anEmptyToken } from './EmptyToken';
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
    if (this.constraint) {
      this.constraint.remove();
      this.constraint = null;
    }

    // remove anything after the '=' sign
    // TODO: I don't really like this, but okay for now
    const tokens = this.findAll({ what: aToken });
    const equalsTokenIndex = tokens.findIndex(
      t => t instanceof OpToken && t.stringValue === '='
    );
    if (equalsTokenIndex >= 0) {
      while (equalsTokenIndex < tokens.length) {
        tokens.pop()!.remove();
      }
    }

    // create new empty spaces
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());

    // Toggle embedded numbers
    for (const numberToken of this.findAll({ what: aNumberToken })) {
      numberToken.edit();
    }

    // Toggle mode
    this.editing = true;
    this.updateCells();
  }

  close() {
    if (!this.editing) {
      return;
    }

    this.discardEmptyTokens();
    const tokens = this.findAll({ what: aToken });

    // Detach single token formulas
    if (tokens.length === 1) {
      const firstToken = tokens[0];
      firstToken.embedded = false;
      firstToken.editing = false;
      if (firstToken instanceof NumberToken) {
        firstToken.close();
      }
      this.page.adopt(firstToken);
      this.editing = false;
      this.remove();
      return;
    }

    // Parse the formula
    const parser = new FormulaParser(this.page);
    const newFormulaConstraint = parser.parse(this.getFormulaAsText());
    if (!newFormulaConstraint) {
      // don't close the editor
      // TODO: we need to make the editor more usable at this point
      // (the fact that empty spaces have been discarded, etc. makes it hard to fix the formula)
      return;
    }

    this.constraint = newFormulaConstraint;
    this.adopt(new OpToken('='));
    this.adopt(new NumberToken(newFormulaConstraint.result));
    for (const numberToken of this.findAll({ what: aNumberToken })) {
      numberToken.close();
    }
    this.editing = false;
  }

  discardEmptyTokens() {
    const emptyTokens = this.findAll({ what: anEmptyToken });
    for (const token of emptyTokens) {
      token.remove();
    }
    this.updateCells();
  }

  updateCells() {
    for (const cell of this.findAll({ what: aWritingCell })) {
      cell.remove();
    }

    if (!this.editing) {
      return;
    }

    // TODO: Do this in a better way so we don't lose state all over the place
    for (const token of this.findAll({ what: aToken })) {
      if (token instanceof NumberToken) {
        const size = token.editValue.length;
        for (let i = 0; i < size; i++) {
          this.adopt(new WritingCell());
        }
      } else {
        this.adopt(new WritingCell());
      }
    }
  }

  getFormulaAsText() {
    const formula = [];
    for (const token of this.findAll({ what: aToken })) {
      if (token instanceof OpToken) {
        formula.push(token.stringValue);
      } else if (token instanceof NumberToken) {
        formula.push('@' + token.id);
      } else if (token instanceof LabelToken) {
        formula.push('#' + token.id);
      } else {
        throw new Error(
          'unexpected token type in formula: ' + token.constructor.name
        );
      }
    }
    return formula.join(' ');
  }

  layoutCells() {
    if (!this.editing) {
      return;
    }

    const cells = this.findAll({ what: aWritingCell });
    for (const token of this.findAll({ what: aToken })) {
      if (token instanceof NumberToken) {
        for (let i = 0; i < token.editValue.length; i++) {
          const cell = cells.shift();
          if (cell) {
            cell.position = Vec.add(token.position, {
              x: (24 + PADDING) * i,
              y: 0,
            });
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

  updateWritingCells() {
    const tokens = this.findAll({ what: aToken });
    let tokenIndex = 0;
    let token = tokens[tokenIndex];
    let offsetInsideToken = -1;

    const cells = this.findAll({ what: aWritingCell });

    for (const cell of cells) {
      // Step forward through tokens
      offsetInsideToken += 1;

      const tokenSize =
        token instanceof NumberToken ? token.editValue.length : 1;

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
            const start = token.editValue.slice(0, offsetInsideToken);
            const end = token.editValue.slice(offsetInsideToken + 1);
            token.editValue = start;
            tokens.splice(tokenIndex + 1, 0, new OpToken(cell.stringValue));
            if (end !== '') {
              const numToken = new NumberToken();
              numToken.editValue = end;
              tokens.splice(tokenIndex + 2, 0, numToken);
            }
          }
        } else if (token instanceof EmptyToken || token instanceof OpToken) {
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
    const idx = tokens.indexOf(emptyToken);
    if (idx < 0) {
      throw new Error('bad call to Formula.insertInto()');
    }
    tokens.splice(idx, 0, newToken);

    // update the order of the children in this game object
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
    for (const token of this.findAll({ what: aToken })) {
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
    for (const child of this.children) {
      child.remove();
    }
    super.remove();
  }
}

function isNumeric(v: string) {
  return '0' <= v && v <= '9';
}

export const aFormula = (gameObj: GameObject) =>
  gameObj instanceof Formula ? gameObj : null;
