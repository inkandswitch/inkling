import Token, { aToken } from './Token';
import SVG from '../Svg';
import Vec from '../../lib/vec';
import { isTokenWithVariable } from './token-helpers';
import NumberToken from './NumberToken';
import OpToken from './OpToken';
import EmptyToken, { aEmptyToken } from './EmptyToken';
import WritingCell, { aWritingCell } from './WritingCell';
import { GameObject } from '../GameObject';

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

  isPrimary() {
    return false;
  }

  edit() {
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.editing = true;
    this.createCells();
  }

  close() {
    if (!this.editing) return;
    // Cleanup
    const emptyTokens = this.findAll({ what: aEmptyToken });

    for (const token of emptyTokens) {
      token.remove();
    }

    this.editing = false;
    this.createCells();

    // Detach single token formula's
    const tokens = this.findAll({ what: aToken });
    if (tokens.length == 1) {
      tokens[0].embedded = false;
      tokens[0].editing = false;
      this.page.adopt(tokens[0]);
      this.remove();
    }
  }

  createCells() {
    const cells = this.findAll({ what: aWritingCell });
    const tokens = this.findAll({ what: aToken });
    for (const cell of cells) {
      cell.remove();
    }

    if (this.editing) {
      let cellCount = 0;
      for (const token of tokens) {
        if (token instanceof EmptyToken || token instanceof OpToken) {
          cellCount += 1;
        } else if (token instanceof NumberToken) {
          cellCount += token.variable.value.toFixed(0).split('').length;
        }
      }

      // Re-instantiate cells
      for (let i = 0; i < cellCount; i++) {
        let cell = new WritingCell();
        cell.position = { x: this.position.x + PADDING + (24 + PADDING) * i, y: this.position.y + PADDING };
        this.adopt(cell);
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
      if (token instanceof EmptyToken || token instanceof OpToken) {
        tokenSize = 1;
      } else if (token instanceof NumberToken) {
        tokenSize = token.variable.value.toFixed(0).split('').length;
      }

      if (offsetInsideToken == tokenSize) {
        offsetInsideToken = 0;
        tokenIndex += 1;
        token = tokens[tokenIndex]
      }



      if (cell.stringValue != '') {


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
            let prev = tokens[tokenIndex - 1]
            if (prev instanceof NumberToken) {
              prev.addChar(cell.stringValue);
            } else {
              let numToken = new NumberToken();
              numToken.addChar(cell.stringValue)
              tokens.push(tokens[tokenIndex]);
              tokens[tokenIndex] = numToken;

            }
          } else {
            let opToken = new OpToken(cell.stringValue);
            tokens.push(tokens[tokenIndex]);
            tokens[tokenIndex] = opToken;
          }
        }

        cell.stringValue = '';

        console.log(tokens);
        for (const t of tokens) {
          this.adopt(t);
        }

        this.createCells();

        break;
      }
    }

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
    const cells = this.findAll({ what: aWritingCell });
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      cell.position = { x: this.position.x + PADDING + (24 + PADDING) * i, y: this.position.y + PADDING }
    }

    // render children
    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  remove(): void {
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
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].indexOf(v) > -1;
}

export const aFormula = (gameObj: GameObject) =>
  gameObj instanceof Formula ? gameObj : null;