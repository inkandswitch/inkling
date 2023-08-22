// A simple extention of spreadsheets that enables a number of things including circular references and scrubbing arbitrary numbers
// See example at bottom of the file

// Each cell has 4 fields:
// Id
// Formula
// Value
// Target Formula

// The first three are a basic spreadsheet cell
// The last field is an optional additional formula that sets the fields "target value".

// There are two methods "evaluate", and "optimize"
// "Evaluate" evaluates the spreadsheet as you would expect
// "Optimize" uses numeric minimization to:
// 1. Update all "free cells" (Cells that have a single value as a formula, and no target formula) 
// 2. So as to minimize the error for any "target formulas".

// If you set a target formula to a number you get scrubbing & fixed constraints
// You can use references in target formulas just like regular formulas, so this gives you the possibility of solving circular references.


import fmin from "fmin"

class Cell {
    constructor (id, formula, target){
        this.id = id
        this.formula = formula
        this.value = null
        this.target = target
        
        this.dependencies = []
        this.dependents = []
        
        this.targetDependencies = []
    }
}

class Sheet {
    constructor(){
        this.cells = new Map()
    }

    addCell(id, formula, target) {
        this.cells.set(id, new Cell(id, formula, target))
    }

    rebuild(){
        
        // Reset Cells
        let ids = Array.from(this.cells.keys())
        ids.forEach(id=>{
            let cell = this.cells.get(id)
            cell.dependencies = []
            cell.dependents = []
            cell.targetDependencies = []
            cell.value = null
        })

        // Register dependencies
        ids.forEach(id=>{
            let cell = this.cells.get(id)
            let dependencies = ids.filter(oid=>cell.formula.search(oid) > -1)
            cell.dependencies = dependencies
            dependencies.forEach(oid=>{
                this.cells.get(oid).dependents.push(id)
            })

            cell.targetDependencies = ids.filter(oid=>{
                if(cell.target) return cell.target.search(oid) > -1
            })
        })

        // TODO: Do a topological sort
    }

    // Evaluate spreadsheet
    evaluate(){
        let ids = Array.from(this.cells.keys())
        let values = new Map()
        ids.forEach(id=>{
            values.set(id, null)
        })

        ids.forEach(id=>{
            let cell = this.cells.get(id);
            let functionText = `return ${cell.formula};`;
            let func = new Function(...cell.dependencies.concat([functionText]));
            let argumentValues = cell.dependencies.map(oid=>values.get(oid));
            values.set(id,func(...argumentValues));
        })

        // Update values in place
        ids.forEach(id=>{
            this.cells.get(id).value = values.get(id)
        })

        return values
    }


    // Very ugly way of doing this, but it could be better
    optimize(){
        // Determine free values
        let freeIds = Array.from(this.cells.keys()).filter(id=>{
            let cell = this.cells.get(id);
            return cell.dependencies.length == 0 && cell.target == null
        })

        // Determine values with a target
        let optimizeIds = Array.from(this.cells.keys()).filter(id=>{
            let cell = this.cells.get(id);
            return cell.dependencies.length > 0 && cell.target != null
        })

        let loss = (iterationValues) => {
            // Update formulaValue in place
            freeIds.forEach((id, i)=>{
                this.cells.get(id).formula = iterationValues[i].toString()
            })

            // Evaluate Spreadsheet
            let newValues = this.evaluate();

            // Evaluate Target Values
            let lossvalue = optimizeIds.map(id=>{
                // Get current value
                let currentValue = newValues.get(id)
                
                // Compute target value
                let cell = this.cells.get(id)
                let targetFunctionText = `return ${cell.target};`;
                let func = new Function(...cell.targetDependencies.concat([targetFunctionText]));
                let argumentValues = cell.targetDependencies.map(oid=>newValues.get(oid));
                let targetValue = func(...argumentValues)

                
                let v = currentValue - targetValue
                return v*v;
            }).reduce((acc, v)=>acc+v, 0);
            return lossvalue

        }
        
        let initalValues = this.evaluate()

        var solution = fmin.nelderMead(loss, freeIds.map(id=>initalValues.get(id)));
        freeIds.forEach((id, i)=>{
            this.cells.get(id).formula = solution.x[i].toString()
        })
        
        console.log("solution is at " + solution.x);

        this.evaluate()

        
        console.log(this.cells);
    }
}


// Example Sheet
// Evaluate will result in {Offset:100, A: 100, B: 200, C: 300}
// The optimizer will update 'Offset', so that 'C = B+Offset = B+400'
// The result will then be {Offset:400, A: 100, B: 500, C: 900}

const s = new Sheet()
// s.addCell("Offset", "100")
// s.addCell("A", "100", "100")
// s.addCell("B", "A + Offset")
// s.addCell("C", "B + Offset", "B + 400")

s.addCell("TaxRate", "0.21", "0.21")
s.addCell("Price", "100")
s.addCell("Tax", "Price * TaxRate")
s.addCell("Total", "Price + Tax", "200")


s.rebuild()
s.evaluate()
s.optimize()