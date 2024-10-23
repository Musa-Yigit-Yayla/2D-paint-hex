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
     * @param grid grid instance
     * 
     * @return an array containing {rs, cs, r1, c1, ... re, ce} where ri represents ith row and cj represents jth row which results in our line
     */
    static locateLineIndexes(startRow, startCol, endRow, endCol, grid){
        let result = [];

        if(startRow === endRow && startCol === endCol){
            result.push(startRow, startCol);
        }
        else{
            let slope = (startCol - endCol) * 1.0 / (startRow - endRow);
            let currHex = grid.grid[startRow][startCol];
            let startIntersections = this.findCenterIntersections(currHex, slope);
            let centerX = currHex.topRightVert.x - Hexagon.WORLD_SIDE_LENGTH / 2.0; 
            let centerY = currHex.topRightVert.y + Hexagon.WORLD_SIDE_LENGTH * Math.sqrt(3) / 2.0;

            console.log("Debug: startIntersections are", startIntersections);
            let selectFirstIntersect = function() {
                const result = [];
                const dx = endRow - startRow, dy = endCol - startCol;
            
                const xi0 = startIntersections[0], yi0 = startIntersections[1];
                const xi1 = startIntersections[2], yi1 = startIntersections[3];
            
                const epsilon = 1e-6;  // Small tolerance for floating-point comparisons
            
                // Calculate vectors from the center to the intersections
                const vector0 = { dx: xi0 - centerX, dy: yi0 - centerY };
                const vector1 = { dx: xi1 - centerX, dy: yi1 - centerY };
                
                // Normalize vectors to avoid scaling issues
                const normalize = (v) => {
                    const length = Math.sqrt(v.dx * v.dx + v.dy * v.dy);
                    return { dx: v.dx / length, dy: v.dy / length };
                };
                
                const normalizedVec0 = normalize(vector0);
                const normalizedVec1 = normalize(vector1);
                const normalizedDir = normalize({ dx, dy });
            
                // Compare normalized vectors using epsilon
                if (Math.abs(normalizedVec1.dx - normalizedDir.dx) < epsilon && 
                    Math.abs(normalizedVec1.dy - normalizedDir.dy) < epsilon) {
                    result.push(xi1, yi1);
                } else if (Math.abs(normalizedVec0.dx - normalizedDir.dx) < epsilon && 
                           Math.abs(normalizedVec0.dy - normalizedDir.dy) < epsilon) {
                    result.push(xi0, yi0);
                } else {
                    console.log("RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
                }
            
                return result;
            };
            
            let firstIntersect = selectFirstIntersect();
            console.log("Debug: firstIntersect is ", firstIntersect);


            //entry coords which pierced our hexagon first
            //let nextAdj = Grid.getNextAdjacent(currHex.topRightVert, currHex.topRightVert.x - Hexagon.WORLD_SIDE_LENGTH / 2.0, 
            //                                    currHex.topRightVert.y + Hexagon.WORLD_SIDE_LENGTH * Math.sqrt(3) / 2.0, slope);
            let firstAdj = Grid.getNextAdjacent(currHex.topRightVert, firstIntersect[0], 
                                                firstIntersect[1], slope);
            console.log("Debug: firstAdj is", firstAdj);
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
        while(currLine < 6){ // !!!!!!!!!!!!!!!!!!!!!!!!!!!!! HERE WE NEED 6 AS WE DO NOT CONSIDER THE P6-P0 LINE WITH 5 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            let lx0 = vertPositions[currLine], ly0 = vertPositions[currLine + 1];
            let lx1 = vertPositions[(currLine + 2) % 12], ly1 = vertPositions[(currLine + 3) % 12]; //for connecting last vertex to first

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
    /**
     * 
     * @param {*} hex hexagon instance
     * @param {*} slope of the line which passes from hexagon's center
     * @return a 1d array containing points of intersections with the given central line made with hexagon's edges [x0, y0, x1, y1]
     */
   /**
 * @param {*} hex - hexagon instance (with topRight vertex coordinates)
 * @param {*} slope - slope of the line passing through hexagon's center
 * @return an array containing the two opposite intersection points with the hexagon's edges [x0, y0, x1, y1]
 */
static findCenterIntersections(hex, slope) {
    const sideLength = Hexagon.WORLD_SIDE_LENGTH;
    const { x: topRightX, y: topRightY } = hex.topRightVert;

    // Calculate hexagon center based on topRight
    const centerX = topRightX - sideLength / 2;
    const centerY = topRightY + (sideLength * Math.sqrt(3) / 2);

    // Vertices of the hexagon
    const vertices = [
        { x: topRightX, y: topRightY },                               // Top-right
        { x: topRightX - sideLength, y: topRightY },                  // Top-left
        { x: topRightX - sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-left
        { x: topRightX + sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-right
        { x: topRightX + sideLength, y: topRightY },                  // Right-bottom
        { x: topRightX, y: topRightY + (sideLength * Math.sqrt(3)) }, // Bottom-center
    ];

    // For each edge (pair of adjacent vertices), calculate the intersection point
    let intersections = [];
    for (let i = 0; i < vertices.length; i++) {
        let v1 = vertices[i];
        let v2 = vertices[(i + 1) % vertices.length]; // Wrap around at the last vertex

        let edgeSlope = (v2.y - v1.y) / (v2.x - v1.x);

        // Find intersection point between the line (center, slope) and the edge (v1, v2)
        let intersection = this.findLineIntersection(centerX, centerY, slope, v1.x, v1.y, edgeSlope);

        // Check if the intersection lies on the edge
        if (this.pointLiesOnLineSegment(v1.x, v1.y, v2.x, v2.y, intersection.x, intersection.y)) {
            intersections.push(intersection);
        }
    }

    // Now we have the intersections, find the two farthest apart (these are the opposite edges)
    if (intersections.length >= 2) {
        let [p1, p2] = this.findFarthestPoints(intersections);
        return [p1.x, p1.y, p2.x, p2.y];
    }

    return null; // Return null if intersections are not found properly
}

/**
 * Helper function to find the farthest points from an array of points.
 */
static findFarthestPoints(points) {
    let maxDistance = 0;
    let farthestPair = [points[0], points[1]];

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            let dist = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
            if (dist > maxDistance) {
                maxDistance = dist;
                farthestPair = [points[i], points[j]];
            }
        }
    }

    return farthestPair;
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