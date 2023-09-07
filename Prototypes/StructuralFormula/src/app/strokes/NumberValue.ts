type NumericChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

export default class NumberValue {
  numericValue: number | null = null; //Null if empty token
  stringValue: string = ""

  addToken(char: NumericChar){
    this.stringValue += char
    this.numericValue = parseInt(this.stringValue)
  }

  render(){

  }
}