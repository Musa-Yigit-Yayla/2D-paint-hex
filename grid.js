import { Hexagon } from "./hexagon.js";

export class Grid{ //flat top even
    gridLength;
    grid = []; //2d array of hexagons

    constructor(gridLength){
        this.gridLength = gridLength;
    }
    /**
     * 
     * @param {*} firstTopRight top right vert pos of the first hexagon (0, 0), in world space coordinates
     */
    initGrid(firstTopRight){ //inits an empty grid
        this.grid = [];
 

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
}