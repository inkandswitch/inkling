export default class SVG {
    constructor(dom = document.body) {
        this.root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.updateElement(
            this.root,
            {
                xmlns: 'http://www.w3.org/2000/svg',
                width: window.innerWidth,
                height: window.innerHeight,
            }
        );
        dom.appendChild(this.root);
    }

    addElement(type, attributes) {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', type);
        this.updateElement(elem, attributes);
        this.root.appendChild(elem);
        return elem;
    }

    updateElement(elem, attributes) {
        Object.entries(attributes).forEach(
            ([key, value]) => elem.setAttribute(key, value)
        );
    }
}

// TODO: maybe this should live somewhere else, tbd
export function generatePathFromPoints(points) {
    const parts = points.map(
        (p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    );
    return parts.join(' ');
}