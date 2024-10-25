import { Hexagon } from "./hexagon.js";

export class Grid{ //flat top even
    gridLength;
    grid = []; //2d array of hexagons
    brush = {r: 0.0, g: 0.0, b: 0.0};
    firstTopRight;

    static programRect;
    static bufferRect;
    static programRectSet = false;

    constructor(gridLength){
        this.gridLength = gridLength;
    }
    deepCopy(){
        let copy = new Grid(this.gridLength);
        copy.initGrid(this.firstTopRight);
        copy.brush = {r: this.brush.r, g: this.brush.g, b: this.brush.b};

        for(let i = 0; i < this.gridLength; i++){
            for(let j = 0; j < this.gridLength; j++){
                copy.grid[i][j].color.r = this.grid[i][j].color.r;
                copy.grid[i][j].color.g = this.grid[i][j].color.g;
                copy.grid[i][j].color.b = this.grid[i][j].color.b;
            }
        }

        return copy;
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
     * @param {*} grid0 the grid on top
     * @param {*} grid1 the grid on mid
     * @param {*} grid2 the grid onbottom
     * 
     * indexesi parameter contains [strokeIndexes, filledIndexes] for grid i
     * 
     * renders a combined grid (use when DISABLEd edit mode)
     * 
     * @return {instance: grid, indexes: [strokeIndexes, fillIndexes]} for saving purposes of combined grid
     */
    static renderCombinedGrid(gl, grid0, grid1, grid2, indexes0, indexes1, indexes2){
        console.log("Debug RCGGGGGGGGGGGGGGGGGGGGGGGGGGG: invoked with parameters (without grid) respectively", grid0, grid1, grid2, indexes0, indexes1, indexes2);
        //iterate for each entry and finally construct a temp grid and render that
        let tempGrid = grid2.deepCopy(); //it has bottom grid content now
        console.log("Debug RCG tempGrid", tempGrid);
        //let tempGridIndexes = Hexagon.setIndexData(gl, tempGrid.grid);
        let tempStrokes = [], tempFilleds = []; //index arrays for temp grid

        let sIndexes0 = indexes0[0], fIndexes0 = indexes0[1];
        let sIndexes1 = indexes1[0], fIndexes1 = indexes1[1];
        let sIndexes2 = indexes2[0], fIndexes2 = indexes2[1];

        let arrayContains = function(arr, e){
            for(let i = 0; i < arr.length; i++){
                if(arr[i] === e){
                    return true;
                }
            }
            return false;
        }

        let length = grid0.gridLength;
        for(let i = 0; i < length; i++){ //row
            for(let j = 0; j < length; j++){ //col
                let currIndex = i * length + j;
                let paintColor = null;

                console.log("Debug RCG: currIndex and branch conditions are respectively", currIndex, arrayContains(fIndexes0,currIndex), arrayContains(fIndexes1,currIndex));


                if(arrayContains(fIndexes0,currIndex) && !(grid0.grid[i][j].strokeEnabled)){ //CAREFUL FOR AFTER &&
                    console.log("Debug RCG WEEEEEEEEEEEEEEEEERT");
                    //paint grid0 entry color
                    paintColor = grid0.grid[i][j].color;
                }
                else if(arrayContains(fIndexes1,currIndex) && !(grid1.grid[i][j].strokeEnabled)){//CAREFUL FOR AFTER &&
                    paintColor = grid1.grid[i][j].color;
                }
                else if(arrayContains(fIndexes2,currIndex) && !(grid2.grid[i][j].strokeEnabled)){
                    paintColor = grid2.grid[i][j].color;
                }
                if(paintColor !== null){
                    let tempHex = tempGrid.grid[i][j];
                    tempHex.color = paintColor;
                    tempHex.strokeEnabled = false;
                    tempFilleds.push(currIndex);
                }
                else{
                    //empty cell
                    let tempHex = tempGrid.grid[i][j];
                    tempHex.strokeEnabled = true;
                    tempStrokes.push(currIndex);
                }
                //look from top to bottom to see if any current index is painted and if so set the value to it to tempGrid
                
            }
        }
        console.log("Debug RCGGGGGGGGGGGGGGG temp stroke and filleds indexes", tempStrokes, tempFilleds);
        //now set the static hexagon index datas and render the temp grid
        Hexagon.strokeIndexData = tempStrokes;
        Hexagon.filledIndexData = tempFilleds;
        tempGrid.renderGrid(gl);
        return {instance: tempGrid, indexes: [tempStrokes, tempFilleds]};
    }
    /**
     * 
     * @param {*} grid latest combined grid resulting
     * @param gridIndexes [tempSIndex, tempFIndex]
     * 
     * Pass the parameters from return value of renderCombinedGrid
     * 
     * @return a string representing
     */
    static serialize(grid, gridIndexes){
        let result = "";

        //resulting string will contain index datas and a 2D array for each hexagon's color

        let colorArr = [];
        for(let i = 0; i < grid.grid.length; i++){
            let currRow = [];
            for(let j = 0; j < grid.grid[i].length; j++){
                currRow.push(grid.grid[i][j].color);
            }
            colorArr.push(currRow);
        }

        result += JSON.stringify(colorArr);
        result += "*"; //* is our delimiter for splitting when deserializing

        result += JSON.stringify(gridIndexes[0]);
        result += "*";
        result += JSON.stringify(gridIndexes[1]);
        result += "*";
        result += JSON.stringify(grid.firstTopRight);

        return result;
    }
    /**
     * 
     * @param {*} gridStr 
     * @return given a string representation of grid instantiate such a grid instance and return {instance: grid, indexes: [strokeIndexes, fillIndexes]}
     */
    static deserialize(gridStr){
        let tokens = gridStr.split("*");

        let colorArr = JSON.parse(tokens[0]);
        let strokeIndexes = JSON.parse(tokens[1]);
        let fillIndexes = JSON.parse(tokens[2]);
        let firstTopRight = JSON.parse(tokens[3]);

        let grid = new Grid(colorArr.length);
        grid.initGrid(firstTopRight);

        let eltExists = function(arr, e){
            for(let i = 0; i < arr.length; i++){
                if(arr[i] === e){
                    return true;
                }
            }
            return false;
        }

        //before returning go over the grid hexagons and set stroke enableds accordingly
        for(let row = 0; row < grid.grid.length; row++){
            for(let col = 0; col < grid.grid.length; col++){
                let currHex = grid.grid[row][col];
                let currIndex = row * grid.grid.length + col;

                if(eltExists(fillIndexes, currIndex)){
                    console.log("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
                    currHex.strokeEnabled = false;
                    currHex.color = colorArr[row][col];
                }
                else{
                    currHex.strokeEnabled = true;
                }
            }
        }

        return {instance: grid, indexes: [strokeIndexes, fillIndexes]};
    }
    /**
     * 
     * @param {*} gl 
     * invoke after rendering grid to render a rectengular selection we currently have
     * x0, y0 to x1, y1 comprises a diagonal of our rectangle
     */
    renderRectSelection(gl, x0, y0, x1, y1){
        if(!Grid.programRectSet){
            Grid.initRectSelection(gl);
            Grid.programRectSet = true;
        }
        //DO NOT CLEAR BUFFER BIT HERE
        
        let vertices = new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]);
        gl.useProgram(Grid.programRect);
        gl.bindBuffer(gl.ARRAY_BUFFER, Grid.bufferRect);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        let vertPosLoc = gl.getAttribLocation(Grid.programRect, "vertPos");
        gl.enableVertexAttribArray(vertPosLoc);
        gl.vertexAttribPointer(vertPosLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    }

    /**
     * 
     * @param {*} eventX 
     * @param {*} eventY 
     * @param {*} gridIndexes, is expected to be an empty array in which we pass row and column indexes of the matched hexagon if it exists
     * Upon a mouse event, returns the corresponding hexagon in which this mouse event position is related to, if no hex is found returns null
     */
    getGridEntry(eventX, eventY, gridIndexes = null){
        //console.log("Debug: getGridEntry invoked with parameters respectively", eventX, eventY, gridIndexes);
        //we need to fetch the first top right vertex row which is less than or equal to our eventY
        //then we need to fetch the first top right vertex which our eventX can lie on

        //work as ranges similar to MM select elimination
        const nx = 1.5 * Hexagon.WORLD_SIDE_LENGTH;
        const ny = Math.sqrt(3) * Hexagon.WORLD_SIDE_LENGTH; //steps for finding a suitable region

        let gridStartX = this.firstTopRight.x - nx;
        let gridStartY = this.firstTopRight.y - ny / 2.0;
        let xIndex = Math.floor((eventX - gridStartX) / nx); //INCOMPLETE PROCEED
        let yIndex = Math.floor((eventY - gridStartY) / ny);
        //console.log("Debug: gridStartX, gridStartY are ", gridStartX, gridStartY);

        //console.log("Debug: eventX, eventY yield ", eventX, eventY, " and gridStart coordinates yield", gridStartX, gridStartY);
        //console.log("Debug: xIndex and yIndex in getGridEntry yield " + xIndex + ", " + yIndex);
        
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
     * @param {*} rowIndex of current hexagon
     * @param {*} colIndex 
     * @param {*} edge number 0, 1, 2, 3, 4, 5 which is shared with next hexagon
     * @return relevant hexagon instance, DOES NOT PERFORM BOUNDARY CHECK
     */
    getNeighboringHex(rowIndex, colIndex, edge){
        let hex = null;
        switch(edge){
            case 0: hex = this.grid[rowIndex - 1][colIndex]; break;
            case 1: hex = this.grid[rowIndex - 1][colIndex -1]; break;
            case 2: hex = this.grid[rowIndex][colIndex - 1]; break;
            case 3: hex = this.grid[rowIndex + 1][colIndex]; break;
            case 4: hex = this.grid[rowIndex][colIndex + 1]; break;
            case 5: hex = this.grid[rowIndex - 1][colIndex + 1]; break;
        }
        return hex;
    }

    /**
     * 
     * @param {*} overrideMap0 first override to be applied
     * @param {*} overrideMap1 second override to be applied after first
     * @param {*} indexTranslateMap1 is translation factor for map1 where we add these to each index key in map1 when we are about to write map1
     * Overrides the current grid with given color override maps in order
     * Also modifies index data of Hexagon class, keep an initial copy somewhere for restoration
     */
    writeMoveChanges(overrideMap0, overrideMap1, indexTranslateMap1){
        //console.log("Debug WRITEMOVECHANGES: this is", this);
        console.log("Debug: WMC invoked with maps", overrideMap0, overrideMap1);
        if(overrideMap0 !== null && overrideMap1 !== null){
            overrideMap0.forEach((value, key) => {
                //console.log("Debug Map0: key value is", key, value);
                let row = Math.floor(key / this.gridLength), col = key % this.gridLength;
                let currIndex = row * this.gridLength + col;

                console.log("Debug AAAAAAAAAAAAAAAA: value", value);
                if(value === -1){
                    //console.log("DEBUG WMC row and col are", row, col);
                    let currHex = this.grid[row][col];
                    currHex.color = value;

                    console.log("Debug AAAAAAAAAAAAAAAA: currHex", currHex);
                    //if(!currHex.strokeEnabled){
                        console.log("Debug: AAAAAAAAAAAAAAAAAAAAAAAAAAA");
                        currHex.strokeEnabled = true;
                        removeByValue(Hexagon.filledIndexData, currIndex);
                        Hexagon.strokeIndexData.push(currIndex);
                        
                    //}
                }
                else{
                    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", key);
                }
            });
            //now also apply the same logic we have applied to map0 to map1 without changing indexes
            //for leaving empty cells

            /*overrideMap1.forEach((value, key) => {
                //console.log("Debug Map0: key value is", key, value);
                let row = Math.floor(key / this.gridLength), col = key % this.gridLength;
                let currIndex = row * this.gridLength + col;

                //if(value === -1){
                    //console.log("DEBUG WMC row and col are", row, col);
                    let currHex = this.grid[row][col];
                    currHex.color = value;

                    //if(!currHex.strokeEnabled){
                        console.log("Debug: AAAAAAAAAAAAAAAAAAAAAAAAAAA");
                        removeByValue(Hexagon.filledIndexData, currIndex);
                        Hexagon.strokeIndexData.push(currIndex);
                        currHex.strokeEnabled = true;
                    //}
                
                }
                else{
                    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", key);
                }
            });*/

            overrideMap1.forEach((value, key) => {
                let currKey = key + indexTranslateMap1;
                let row = Math.floor(currKey / this.gridLength), col = currKey % this.gridLength;
                let currIndex = row * this.gridLength + col;

                if(value !== -1){
                    console.log("Debug WMC map1 row col indexTranslateMap1", row, col, indexTranslateMap1);
                    let currHex = this.grid[row][col];
                    currHex.color = value;

                    if(currHex.strokeEnabled){
                        console.log("Debug: CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
                        currHex.strokeEnabled = false;
                        removeByValue(Hexagon.strokeIndexData, currIndex);
                        Hexagon.filledIndexData.push(currIndex);
                    }
                }
                else{
                    console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
                }
            });
        }

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
                let result = [];
                
                // Center coordinates of the hexagon (for reference)
                // Intersection points
                let xi0 = startIntersections[0], yi0 = startIntersections[1]; // First intersection point
                let xi1 = startIntersections[2], yi1 = startIntersections[3]; // Second intersection point
                
                // Given slope of the vector
                
                // Calculate the direction of the ray
                let dx = 1;   // Positive x-direction for simplicity (normalized step)
                let dy = slope;  // Corresponding y-step based on the slope
                
                // Parametric values (t0 and t1) for both intersection points:
                // t = (xi - centerX) / dx and t = (yi - centerY) / dy
                // We use both x and y differences now
            
                // Compute "t" for first intersection point (xi0, yi0)
                let t0x = (xi0 - centerX) / dx; // Along x-axis
                let t0y = (yi0 - centerY) / dy; // Along y-axis
                
                // Compute "t" for second intersection point (xi1, yi1)
                let t1x = (xi1 - centerX) / dx; // Along x-axis
                let t1y = (yi1 - centerY) / dy; // Along y-axis
                
                // Now we need to select the intersection with the smallest valid t.
                // We compare both x and y dimensions to find the intersection closest to the ray's direction.
                
                // Use the smaller t value, but it must match in both dimensions (consistent with the slope)
                if (t0x < t1x && t0y < t1y) {
                    result.push(xi0, yi0); // First intersection point is hit first
                } else {
                    result.push(xi1, yi1); // Second intersection point is hit first
                }
                
                return result;
            }
            
            let firstIntersect = selectFirstIntersect();
            console.log("Debug: firstIntersect is ", firstIntersect);
            //use the second intersect for finding the next hexagon to move
            let secondIntersect = [];
            if(startIntersections[0] === firstIntersect[0]){
                secondIntersect = [startIntersections[2], startIntersections[3]];
            }
            else{
                secondIntersect = [startIntersections[0], startIntersections[1]];
            }


            //entry coords which pierced our hexagon first
            //let nextAdj = Grid.getNextAdjacent(currHex.topRightVert, currHex.topRightVert.x - Hexagon.WORLD_SIDE_LENGTH / 2.0, 
            //                                    currHex.topRightVert.y + Hexagon.WORLD_SIDE_LENGTH * Math.sqrt(3) / 2.0, slope);
            /*let firstAdj = Grid.getNextAdjacent(currHex.topRightVert, secondIntersect[0], 
                                                secondIntersect[1], slope);*/
            let firstAdjEdge = Grid.getAdjacentEdge(currHex, secondIntersect[0], secondIntersect[1]);
            let firstAdjHex = grid.getNeighboringHex(startRow, startCol, firstAdjEdge);
            let secondAdj = Grid.getNextAdjacent(firstAdjHex.topRightVert, secondIntersect[0], secondIntersect[1], slope);
            console.log("Debug: firstAdjEdge is", firstAdjEdge);
            console.log("Debug: secondAdj is ", secondAdj);
        }
    }
    /**
     * 
     * @param {*} hex hexagon
     * @param {*} x coordinate of intersection with one of the edges (already known)
     * @param {*} y
     * @return 0,1,2,3,4,5 (edge number)
     */
    static getAdjacentEdge(hex, x, y){
        let result = -1;

        const sideLength = Hexagon.WORLD_SIDE_LENGTH;
        const { x: topRightX, y: topRightY } = hex.topRightVert;
    
        // Vertices of the hexagon
        const vertices = [
            { x: topRightX, y: topRightY },                               // Top-right
            { x: topRightX - sideLength, y: topRightY },                  // Top-left
            { x: topRightX - sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-left
            { x: topRightX + sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-right
            { x: topRightX + sideLength, y: topRightY },                  // Right-bottom
            { x: topRightX, y: topRightY + (sideLength * Math.sqrt(3)) }, // Bottom-center
        ];

        for(let i = 0; i < vertices.length; i++){
            let v0 = vertices[i];
            let v1 = vertices[(i + 1) % 6]; //for last vertex connection

            if(Grid.pointLiesOnLineSegment(v0.x, v0.y, v1.x, v1.y, x, y)){
                result = i;
                break;
            }
        }
        console.log("Debug: GAE returning", result);
        return result;
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
        console.log("Debug: GNA invoked with entryX, entryY", entryX, entryY);
        let result = -1;

        //start from top right and move counter clockwise
        let currLine = 0; //starting vertex number

        const sideLength = Hexagon.WORLD_SIDE_LENGTH;
        let topRightX = topRight.x, topRightY = topRight.y;
    
        // Vertices of the hexagon
        const vertices = [
            { x: topRightX, y: topRightY },                               // Top-right
            { x: topRightX - sideLength, y: topRightY },                  // Top-left
            { x: topRightX - sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-left
            { x: topRightX + sideLength / 2, y: topRightY + (sideLength * Math.sqrt(3) / 2) }, // Bottom-right
            { x: topRightX + sideLength, y: topRightY },                  // Right-bottom
            { x: topRightX, y: topRightY + (sideLength * Math.sqrt(3)) }, // Bottom-center
        ];

        while(currLine < 6){ // !!!!!!!!!!!!!!!!!!!!!!!!!!!!! HERE WE NEED 6 AS WE DO NOT CONSIDER THE P6-P0 LINE WITH 5 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            let lx0 = vertices[currLine].x, ly0 = vertices[currLine].y;
            let lx1 = vertices[(currLine + 1) % 6].x, ly1 = vertices[(currLine + 1) % 6].y; //for connecting last vertex to first

            let currSlope = (ly1 - ly0) * 1.0 / (lx1 - lx0); //we haven o case where slope is infinite due to our hexagon type choice
            let intersection = Grid.findLineIntersection(entryX, entryY, slope, lx0, ly0, currSlope);

            console.log("Debug GNA: lx0, ly0, lx1, ly1", lx0, ly0, lx1, ly1);
            console.log("Debug GNA: intersection", intersection);

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
        console.log("Debug: GNA returning", result);
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


    //method for initializing rect selection program
    static initRectSelection(gl){
        Grid.programRect = gl.createProgram();
        let vsShader = gl.createShader(gl.VERTEX_SHADER);
        let fsShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vsShader, Grid.shaders.vs);
        gl.shaderSource(fsShader, Grid.shaders.fs);

        gl.compileShader(vsShader);
        gl.compileShader(fsShader);

        gl.attachShader(Grid.programRect, vsShader);
        gl.attachShader(Grid.programRect, fsShader);

        gl.linkProgram(Grid.programRect);

        Grid.bufferRect = gl.createBuffer();
    }

/**
 * @param {*} n
 * @param {*} r0 row0
 * @param {*} c0 col0
 * @param {*} r1 row1
 * @param {*} c1 col1
 * 
 * Uses Dijkstra's algorithm on a length n grid to track the shortest path indexes between p0 and p1
 */
static dijkstra(n, r0, c0, r1, c1) {
    let startIndex = r0 * n + c0;
    let endIndex = r1 * n + c1;
    let vertexCount = n * n;

    // Distance table
    let distances = Array(vertexCount).fill(Number.MAX_VALUE);
    distances[startIndex] = 0;

    // Track visited vertices
    let visited = Array(vertexCount).fill(false);
    
    // Priority queue to get the vertex with the minimum distance
    let priorityQueue = [{ index: startIndex, distance: 0 }];
    let previous = Array(vertexCount).fill(-1);

    // Directions for adjacent cells (up, down, left, right)
    const directions = [
        [-1, 0], // Up
        [1, 0],  // Down
        [0, -1], // Left
        [0, 1],  // Right
    ];

    while (priorityQueue.length > 0) {
        // Sort the priority queue by distance
        priorityQueue.sort((a, b) => a.distance - b.distance);
        let { index: currentVertex } = priorityQueue.shift(); // Get the vertex with the smallest distance

        if (currentVertex === endIndex) break; // Stop if we reached the destination
        
        if (visited[currentVertex]) continue; // Skip if already visited
        visited[currentVertex] = true;

        // Check the neighbors
        let rowI = Math.floor(currentVertex / n);
        let colI = currentVertex % n;

        for (const [dRow, dCol] of directions) {
            let newRow = rowI + dRow;
            let newCol = colI + dCol;

            // Ensure the neighbor is within bounds
            if (newRow >= 0 && newRow < n && newCol >= 0 && newCol < n) {
                let neighborIndex = newRow * n + newCol;

                // Relaxation step
                if (distances[currentVertex] + 1 < distances[neighborIndex]) {
                    distances[neighborIndex] = distances[currentVertex] + 1;
                    previous[neighborIndex] = currentVertex;

                    // Add or update the neighbor in the priority queue
                    priorityQueue.push({ index: neighborIndex, distance: distances[neighborIndex] });
                }
            }
        }
    }

    // Reconstruct the shortest path
    let path = [];
    for (let at = endIndex; at !== -1; at = previous[at]) {
        path.push(at);
    }
    path.reverse(); // Reverse the path to start from the beginning

    return path.length > 1 && path[0] === startIndex ? path : []; // Return path if valid
}




    static shaders = { //shaders for drawing rectangular selection lines during selection
        vs: 
        `#version 300 es

        in vec2 vertPos;

        void main(){
            gl_Position = vec4(vertPos, 0.0, 1.0);
        }
        `,
        fs: 
        `#version 300 es
        precision mediump float;

        out vec4 outColor;
        void main(){
            outColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
        `
    }
}
//removes a given element by value from the given array
function removeByValue(array, item){
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
}
