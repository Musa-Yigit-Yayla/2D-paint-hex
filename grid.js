import { Hexagon } from "./hexagon.js";

export class Grid{
    gridLength;
    grid = []; //2d array of hexagons

    constructor(gridLength){
        this.gridLength = gridLength;
    }
    initGrid(gl){ //inits an empty grid
        this.grid = [];

        for(let i = 0; i < this.gridLength; i++){
            for(let j = 0; j < this.gridLength; j++){
                
            }
        }
    }
}