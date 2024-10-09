import { Hexagon } from "./hexagon.js";

export class Grid{ //flat top even
    gridLength;
    grid = []; //2d array of hexagons
    brush = {r: 0.0, g: 0.0, b: 0.0};
    firstTopRight;

    constructor(gridLength){
        this.gridLength = gridLength;
    }
    /**
     * 
     * @param {*} firstTopRight top right vert pos of the first hexagon (0, 0), in world space coordinates
     */
    initGrid(firstTopRight){ //inits an empty grid
        this.grid = [];
        this.firstTopRight = firstTopRight;

        for(let i = 0; i < this.gridLength; i++){
            this.grid.push([]);
            for(let j = 0; j < this.gridLength; j++){
                const currX = firstTopRight.x + j * (1.5 * Hexagon.WORLD_SIDE_LENGTH);
                const currY = firstTopRight.y + i * (Math.sqrt(3) * Hexagon.WORLD_SIDE_LENGTH) - ((j % 2) * Hexagon.WORLD_SIDE_LENGTH / (Math.sqrt(3) / 2.0));

                let currTopRight = {x: currX, y: currY};
                let currHex = new Hexagon(currTopRight);

                this.grid[i][j] = currHex;
            }
        }
    }

    /**
     * 
     * @param {*} gl 
     * Programmatically renders each hexagon to comprise a total grid
     */
    renderGrid(gl){
        for(let i = 0; i < this.gridLength; i++){
            for(let j = 0; j < this.gridLength; j++){
                let currHex = this.grid[i][j];
                currHex.render(gl);
            }
        }
    }

    /**
     * 
     * @param {*} eventX 
     * @param {*} eventY 
     * Upon a mouse event, returns the corresponding hexagon in which this mouse event position is related to, if no hex is found returns null
     */
    getGridEntry(eventX, eventY){
        //we need to fetch the first top right vertex row which is less than or equal to our eventY
        //then we need to fetch the first top right vertex which our eventX can lie on

        //work as ranges similar to MM select elimination
        const nx = 1.5 * Hexagon.WORLD_SIDE_LENGTH;
        const ny = Math.sqrt(3) * Hexagon.WORLD_SIDE_LENGTH; //steps for finding a suitable region

        let gridStartX = this.firstTopRight.x - nx;
        let gridStartY = this.firstTopRight.y - ny;
        let xIndex = Math.floor((eventX - gridStartX) / nx); //INCOMPLETE PROCEED
        let yIndex = Math.floor((eventY - gridStartY) / ny);

        console.log("Debug: xIndex and yIndex in getGridEntry yield " + xIndex + ", " + yIndex);
        
        //now we should check the direct hexagon and its neighbours
        let currHex = this.grid[xIndex][yIndex];
        if(currHex !== null && currHex.containsPoint(eventX - gridStartX, eventY - gridStartY)){
            return currHex;
        }
        
        let currX = xIndex - 1;
        let currY = yIndex - 1;

        for(let i = 0; i < 3; i++){
            if(currX + i >= 0 && currX + i < this.grid.length){
                for(let j = 0; j < 3; j++){
                    if(currY + j >= 0 && currY + j < this.grid.length){
                        currHex = this.grid[currX + i][currY + j];
                        if(currHex.containsPoint(eventX - gridStartX, eventY - gridStartY)){
                            return currHex;
                        }
                    }
                }
            }
        }
        return null;
    }
}