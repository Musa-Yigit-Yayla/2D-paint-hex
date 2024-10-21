import { Hexagon } from "./hexagon.js";

/**
 * A class for representing operations, will be used for implementing undo redo operations
 */
export class Operation{
    hexIndexes = []; //for each entry it will contain index of the hexagon, and its previous color
    brushColor;
    colorMap; //Map object containing color of hexagon's relevant to this operation, before this operation was performed. -1 denotes no fill color
    type; //type of the operation, brush stroke delete stroke etc.

    constructor(hexIndexes, brushColor, colorMap){
        this.hexIndexes = hexIndexes;
        this.brushColor = brushColor;
        this.colorMap = colorMap;
    }
    /**
     * 
     * @param {*} grid Grid object
     * @param {*} operation Operation object
     */
    static undo(grid, operation){
        console.log("Debug: undo invoked with operation", operation, " and grid", grid);
        //revert the related hexagons to their original color before the given operation
        operation.hexIndexes.forEach(currHexIndex => {
            let rowIndex = Math.floor(currHexIndex / grid.grid.length);
            let columnIndex = currHexIndex % grid.grid.length;
            console.log("Debug: currHexIndex in forEach is, rowIndex and column index are,", currHexIndex, rowIndex, columnIndex);
            let hex = grid.grid[rowIndex][columnIndex];

            let prevColor = operation.colorMap.get(currHexIndex);
            console.log("Debug: prevColor yields", prevColor);
            console.log("Debug: before color assignments hex is", hex);

            //also update filled and stroke data indices in the following branches
            if(prevColor == -1){
                hex.strokeEnabled = true;
                let arrIndex = Hexagon.filledIndexData.indexOf(currHexIndex);
                if(arrIndex !== -1){
                    Hexagon.filledIndexData.splice(arrIndex, 1);
                    Hexagon.strokeIndexData.push(currHexIndex);
                }
            }
            else{
                hex.color = prevColor;
                let arrIndex = Hexagon.strokeIndexData.indexOf(currHexIndex);
                if(arrIndex !== -1){
                    Hexagon.strokeIndexData.splice(arrIndex, 1);
                    Hexagon.filledIndexData.push(currHexIndex);
                }
            }
            console.log("Debug: after assignments hex is", hex);
        });
    }
    /**
     * 
     * @param {*} grid Grid object
     * @param {*} operation Operation object
     */
    static redo(grid, operation){
        
    }
}