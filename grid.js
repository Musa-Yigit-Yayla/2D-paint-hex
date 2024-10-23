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
                const currY = firstTopRight.y + i * (Math.sqrt(3) * Hexagon.WORLD_SIDE_LENGTH) - ((j % 2) * Hexagon.WORLD_SIDE_LENGTH * (Math.sqrt(3) / 2.0));

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
        /*for(let i = 0; i < this.gridLength; i++){
            for(let j = 0; j < this.gridLength; j++){
                let currHex = this.grid[i][j];
                currHex.render(gl);
            }
        }*/
       //prior to rendering this ensure that you invoke your Hexagon.setBufferData for once (for the first render)
       Hexagon.renderGrid(gl, this.grid, this.brush);
    }

    /**
     * 
     * @param {*} eventX 
     * @param {*} eventY 
     * @param {*} gridIndexes, is expected to be an empty array in which we pass row and column indexes of the matched hexagon if it exists
     * Upon a mouse event, returns the corresponding hexagon in which this mouse event position is related to, if no hex is found returns null
     */
    getGridEntry(eventX, eventY, gridIndexes = null){
        console.log("Debug: getGridEntry invoked with parameters respectively", eventX, eventY, gridIndexes);
        //we need to fetch the first top right vertex row which is less than or equal to our eventY
        //then we need to fetch the first top right vertex which our eventX can lie on

        //work as ranges similar to MM select elimination
        const nx = 1.5 * Hexagon.WORLD_SIDE_LENGTH;
        const ny = Math.sqrt(3) * Hexagon.WORLD_SIDE_LENGTH; //steps for finding a suitable region

        let gridStartX = this.firstTopRight.x - nx;
        let gridStartY = this.firstTopRight.y - ny / 2.0;
        let xIndex = Math.floor((eventX - gridStartX) / nx); //INCOMPLETE PROCEED
        let yIndex = Math.floor((eventY - gridStartY) / ny);
        console.log("Debug: gridStartX, gridStartY are ", gridStartX, gridStartY);

        //console.log("Debug: eventX, eventY yield ", eventX, eventY, " and gridStart coordinates yield", gridStartX, gridStartY);
        console.log("Debug: xIndex and yIndex in getGridEntry yield " + xIndex + ", " + yIndex);
        
        //now we should check the direct hexagon and its neighbours
        let currHex = this.grid[yIndex][xIndex];
        if(currHex !== null && currHex.containsPoint(eventX, eventY)){
            if(gridIndexes !== null){
                gridIndexes.push(yIndex, xIndex);
            }
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
                            if(gridIndexes !== null){
                                gridIndexes.push(yIndex, xIndex);
                            }
                            return currHex;
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 
     * @param {*} startRow 
     * @param {*} startCol 
     * @param {*} endRow 
     * @param {*} endCol 
     * 
     * @return an array containing {rs, cs, r1, c1, ... re, ce} where ri represents ith row and cj represents jth row which results in our line
     */
    static locateLineIndexes(startRow, startCol, endRow, endCol){
        let result = [];

        if(startRow === endRow && startCol === endCol){
            result.push(startRow, startCol);
        }
        else{

        }
    }
    /**
     * 
     * @param {*} topRight of the current hexagon (in world coordinates) (object with x and y attributes)
     * @param {*} entryX (entry coordinate of the line in world coordinates)
     * @param {*} entryY 
     * @param {*} slope slope of the movement line
     * @return 0, 1, 2, 3, 4, 5 which denotes intersected line (return -1 on unexpected result)
     */
    static getNextAdjacent(topRight, entryX, entryY, slope){
        let result = -1;

        //start from top right and move counter clockwise
        let currLine = 0; //starting vertex number

        let vertPositions = Hexagon.VERTICES;
        for(let i = 0; i < vertPositions.length; i += 2){
            vertPositions[i] += topRight.x;
            vertPositions[i + 1] += topRight.y;
        }
        while(currLine < 5){
            let lx0 = vertPositions[currLine], ly0 = vertPositions[currLine + 1];
            let lx1 = vertPositions[currLine + 2], ly1 = vertPositions[currLine + 3];

            let currSlope = (ly1 - ly0) * 1.0 / (lx1 - lx0); //we haven o case where slope is infinite due to our hexagon type choice
            let intersection = Grid.findLineIntersection(entryX, entryY, slope, lx0, ly0, currSlope);

            if(intersection.x === entryX && intersection.y === entryY){
                console.log("HEEEEEEEEEEEEEEEEEEEEEEEEEEEY");
            }

            //now we must check whether intersection point lies between our current line segment
            if(intersection !== null && Grid.pointLiesOnLineSegment(lx0, ly0, lx1, ly1, intersection.x, intersection.y)){ //IT COULD BE PROBLEM IF WE GO OUT OF THE LINE
                //WE CAME FROM
                result = currLine;
                break;
            }

            currLine++;
        }
        return result;
    }
    static findLineIntersection(x1, y1, m1, x2, y2, m2) {
        // Check if the lines are parallel
        if (m1 === m2) {
            return null;  // Parallel lines do not intersect (or are coincident)
        }
    
        // Solve for x using the equation m1 * (x - x1) + y1 = m2 * (x - x2) + y2
        let x = ((m2 * x2 - m1 * x1) + (y1 - y2)) / (m2 - m1);
    
        // Now substitute x back into one of the line equations to find y
        let y = m1 * (x - x1) + y1;
    
        // Return the intersection point (x, y)
        return { x: x, y: y };
    }
    /**
     * 
     * @param {*} x0 
     * @param {*} y0 
     * @param {*} x1 
     * @param {*} y1 
     * @param {*} px 
     * @param {*} py 
     * 
     * given x0 and x1 must not be equal to each other
     */
    static pointLiesOnLineSegment(x0, y0, x1, y1, px, py){
        if((px === x0 && py === y0) || (px === x1 && py === y1)){
            return true;
        }
        const epsilon = 1e-9; // Precision threshold
        let s0 = (y0 - y1) * 1.0 / (x0 - x1);
        let s1 = (y0 - py) * 1.0 / (x0 - px);

        let lengthX0 = Math.abs(x1 - x0), lengthY0 = Math.abs(y1 - y0); //absolute coordinate lengths of current line segment
        let lengthX1 = Math.abs(x0 - px), lengthY1 = Math.abs(y0 - py);
        let lengthX2 = Math.abs(x1 - px), lengthY2 = Math.abs(y1 - py);

        let withinSegment = (lengthX1 <= lengthX0 && lengthX2 <= lengthX0) && (lengthY1 <= lengthY0 && lengthY2 <= lengthY0);

        return (Math.abs(s1 - s0) < epsilon && withinSegment);
    }
}