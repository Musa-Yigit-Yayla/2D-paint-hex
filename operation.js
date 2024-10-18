/**
 * A class for representing operations, will be used for implementing undo redo operations
 */
export class Operation{
    hexIndexes = [];
    brushColor;
    type; //type of the operation, brush stroke delete stroke etc.

    constructor(hexIndexes, brushColor){
        this.hexIndexes = hexIndexes;
        this.brushColor = brushColor;
    }
}