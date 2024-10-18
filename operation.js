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
    static undo(grid, operation){

    }
    static redo(grid, operation){
        
    }
}