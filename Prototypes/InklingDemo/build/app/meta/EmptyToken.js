import Token from "./Token.js";
export default class EmptyToken extends Token {
  constructor() {
    super();
    this.width = 24;
    this.height = 30;
    this.value = "";
  }
  isPrimary() {
    return true;
  }
  render(dt, t) {
  }
}
export const anEmptyToken = (gameObj) => gameObj instanceof EmptyToken ? gameObj : null;
