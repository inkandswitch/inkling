import Page from './Page';
import Events, { Event } from './NativeEvents';
import { FormulaNumber } from './strokes/Formula';

export default class FormulaSelection { 
  // Interaction State
  private fingerDown: Event | null = null;
  private fingerMoved: Event | null = null;
  private token: FormulaNumber | null = null 
  private tokenDownValue: number = 0;

  constructor(private readonly page: Page) {}

  update(events: Events) {
    const fingerDown = events.find('finger', 'began');
    if(fingerDown) {
      this.fingerDown = fingerDown;
      const foundToken = this.page.findFormulaTokenNear(fingerDown.position);
      if(foundToken) {
        if(foundToken.type == "number") {
          this.token = foundToken as FormulaNumber
          this.tokenDownValue = this.token?.numericValue!;
        }
      }
    }

    if(this.fingerDown && this.token) {
      const fingerMoved = events.find('finger', 'moved', this.fingerDown.id);
      if(fingerMoved) {
        let delta = this.fingerDown.position.y - fingerMoved.position.y;
        this.token!.updateValue(this.tokenDownValue + delta/5);
      }
    }
  }
}