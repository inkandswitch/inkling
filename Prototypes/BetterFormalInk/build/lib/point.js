export default class Point{
    constructor(x, y) {
      this.x = x || 0
      this.y = y || 0
    }
  
    clone(){
      return new Point(this.x, this.y)
    }
}
  