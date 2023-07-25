export default class SVG {
    constructor(dom = document.body){
        this.root = document.createElementNS('http://www.w3.org/2000/svg', "svg")
        this.root.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        this.root.setAttribute("width", window.innerWidth)
        this.root.setAttribute("height", window.innerHeight)
        dom.appendChild(this.root)
    }

    addElement(type, attributes){
        const elem = document.createElementNS('http://www.w3.org/2000/svg', type);
        Object.keys(attributes).forEach(key=>{
            elem.setAttribute(key, attributes[key]);
        })
        this.root.appendChild(elem)
        return elem
    }

    updateElement(elem, attributes) {
        Object.keys(attributes).forEach(key=>{
            elem.setAttribute(key, attributes[key]);
        })
    }
}