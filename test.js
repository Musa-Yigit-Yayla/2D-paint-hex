import { Hexagon } from "./hexagon.js";
import { Grid } from "./grid.js";
import { Operation } from "./operation.js";
import { Camera } from "./Camera.js";

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

// Add an event listener for right-click (contextmenu) on the canvas
canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the default browser menu from appearing
});
let leftMouseDown = false, rightMouseDown = false;
let zoomChecked = false; //will be used to enable zoom and its event handling etc.
let moveEnabled = false; //rect move enabled
let editEnabled = true; //when false we will use
let renderOrderSelection = 123;
const ZOOM_STEP = 0.2;

let currMode = 0; // 0 for brush

//WE NEED 1X1 ratio in canvas!
console.log("Debug: canvas width and height are", canvas.width, canvas.height);

Hexagon.initProgram(gl, canvas.width, canvas.height);
console.log("Debug: Hexagon regular vertPos is ", Hexagon.VERT_POS);

//let hex = new Hexagon({x: 30, y: 30});
//hex.render(gl);

function setEventHandlers(){
    const boundingRect = canvas.getBoundingClientRect();

    if(currMode === 1){
        let startX, startY;
        let mouseMoveEnabled = false;

        canvas.onmousedown = e => {
            startX = e.x - boundingRect.left;
            startY = e.y - boundingRect.top; //in canvas coordinates
            mouseMoveEnabled = true;
        }
        canvas.onmousemove = e => {
            if(mouseMoveEnabled){
                let currX = e.x - boundingRect.left;
                let currY = e.y - boundingRect.top;

                //now update camera translation wrt to moved distance
                let xFactor = (currX - startX) / canvas.width;
                let yFactor = (currY - startY) / canvas.height;

                console.log("Debug: zoomChecked mousemove yields x and y factors", xFactor, yFactor);

                Camera.position.x = -xFactor;
                Camera.position.y = yFactor;

                //force re-render
                grid.renderGrid(gl);
            }
        }
        canvas.onmouseup = e => {
            mouseMoveEnabled = false;
        }
    }
    else if(currMode === 2){
        let startHex = null;
        let endHex = null;
        let startGridIndexes = null;
        let endGridIndexes = null;
        let rectStart = null, rectEnd = null; //coordinate objects in clipspace

        //rectengular selection and movement
        canvas.onmousedown = e => {
            let canvasX = e.x; //- boundingRect.left;
            let canvasY = e.y; //- boundingRect.top; //in canvas coordinates
            let gridIndexes = [];

            startHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
            startGridIndexes = gridIndexes;

            if(startHex !== null){
                rectStart = startHex.translateCoords(canvasX, canvasY);
            }
        }
        canvas.onmousemove = e => {
            if(startHex !== null){
                let canvasX = e.x //- boundingRect.left;
                let canvasY = e.y //- boundingRect.top; //in canvas coordinates
                let gridIndexes = [];
    
                endHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
                endGridIndexes = gridIndexes;
    
                if(endHex !== null){
                    rectEnd = endHex.translateCoords(canvasX, canvasY);
                    //force rerender of grid then render rectangle
                    grid.renderGrid(gl);
                    grid.renderRectSelection(gl, rectStart.x, rectStart.y, rectEnd.x, rectEnd.y);
                    
                }
            }
           
            
        }
        canvas.onmouseup = e =>{
            let originalStrokeIndexes = JSON.parse(JSON.stringify(Hexagon.strokeIndexData));
            let originalFilledIndexes = JSON.parse(JSON.stringify(Hexagon.filledIndexData)); //RESTORE THESE ONES BACK AGAIN LATER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1


            //now as we have our start and end hexagons, we can work on moving the selection and finally dropping it in its new place

            //now imagine we override our grid temporarily where we have empty cells for our whole initial selection
            //and we override the first overriden grid to include non empty selected hexagons on the current hexagon as if it was the starting pos

            //for this purpose we can have a overriding hexagon map where we have hex indices mapped to a color or -1

            let overrideMap0 = new Map(); //holds the initially selected area
            let overrideMap1 = new Map(); //override which happens after movement (based onoriginal grid)

            //insert into the map the current selected rectangular area with color all -1
            for(let row = startGridIndexes[0]; row < endGridIndexes[0]; row++){
                for(let col = startGridIndexes[1]; col < endGridIndexes[1]; col++){
                    let index = row * grid.grid.length + col;
                    overrideMap0.set(index, -1);

                    //also insert the original color of the current indexed hexagon into map1 if it is colored
                    let currHex = grid.grid[row][col];
                    if(!currHex.strokeEnabled){
                        overrideMap1.set(index, currHex.color);
                    }
                }
            }

            console.log("Debug MOVE RECT: overrideMap0 and overrideMap1 are respectively", overrideMap0, overrideMap1);

            let dropX = 0, dropY = 0;
            let gridCopy = null;
            canvas.onmousemove = e => {
                //Hexagon.filledIndexData = originalFilledIndexes; CONSIDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRR
                //Hexagon.strokeIndexData = originalStrokeIndexes;
                //move the current selection
                let canvasX = e.x; //- boundingRect.left;
                let canvasY = e.y; //- boundingRect.top; //in canvas coordinates
                dropX = canvasX, dropY = canvasY;

                gridCopy = grid.deepCopy();

                let gridIndexes = [];
    
                let currDropHex = grid.getGridEntry(dropX, dropY, gridIndexes);
                let currDropIndex = gridIndexes[0] * gridCopy.gridLength + gridIndexes[1];

                let startGridIndex = startGridIndexes[0] * gridCopy.gridLength + startGridIndexes[1];
                //now deep copy grid and override that grid and temporarily render that grid
                gridCopy.writeMoveChanges(overrideMap0, overrideMap1, currDropIndex - startGridIndex);
                gridCopy.renderGrid(gl); //render the grid copy
            }
            canvas.onmousedown = e => {
                //drop and finalize
                let gridIndexes = [];
    
                let dropHex = grid.getGridEntry(dropX, dropY, gridIndexes); //this is the drop starting hexagon
                console.log("Debug JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ MOVE RECT: dropHex gridIndexes is", gridIndexes);

                if(gridCopy !== null){
                    grid = gridCopy;                 //set the current grid to grid copy
                }
                currMode = 0; //TEEEEEEEEEEST FIXXXX
                setEventHandlers(); //reset the event handlers to initial state
            }
            canvas.onmouseup = e => {
                //reset to empty stub
            }
        }
    }
    //proceed with else ifs for other functionalities
    else if(currMode === 0){ //brush
        canvas.onmousedown = e => {
            console.log("Debug: canvas mouse down has positions as " + e.x + ", " + e.y);
            
            const canvasX = e.x - boundingRect.left, canvasY = e.y - boundingRect.top;
            
            //reset the curr operation regardless of previously held data
            currOperation.hexIndexes = new Set();
            currOperation.brushColor = grid.brush;
            currOperation.colorMap = new Map();

            if(e.button === 0){ //left click
                console.log("Debug: left click down");
                leftMouseDown = true;
                let gridIndexes = [];
                let currHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
                let prevColor = currHex.color;

                if(currHex.strokeEnabled){
                    prevColor = -1;
                }
                paintHex(currHex, grid.brush, gridIndexes, grid.grid.length);

                let currIndex = gridIndexes[0] * grid.grid.length + gridIndexes[1];
                if(isNaN(currIndex)){
                    console.log("Exception: currIndex yields NaN, hence cannot insert into operation indexes");
                }
                else{
                    if(!currOperation.hexIndexes.has(currIndex)){
                        currOperation.hexIndexes.add(currIndex);
                        if(!currOperation.colorMap.has(currIndex)){
                            currOperation.colorMap.set(currIndex, prevColor);
                        }
                    }
                }
            }
            else if(e.button === 2){ //right click
                console.log("Debug: right click down");
                rightMouseDown = true;
                let gridIndexes = [];
                let currHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
                eraseHex(currHex, gridIndexes, grid.grid.length);
            }
        }
        canvas.onmousemove = e => {
            const boundingRect = canvas.getBoundingClientRect();
            const canvasX = e.x - boundingRect.left, canvasY = e.y - boundingRect.top;

            if(leftMouseDown){
                //console.log("Debug: left click move");
                let gridIndexes = [];
                let currHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);

                //console.log("Debug: currHex onmousemove is", currHex);

                let prevColor = null;
                if(currHex !== null){
                    if(currHex.strokeEnabled){
                        prevColor = -1;
                    }
                    else{
                        prevColor = currHex.color;
                    }
                }
                else{
                    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", gridIndexes);
                }

                paintHex(currHex, grid.brush, gridIndexes, grid.grid.length);

                let currIndex = gridIndexes[0] * grid.grid.length + gridIndexes[1];
                //console.log("Debug: gridIndexes and grid.grid.length are respectively", gridIndexes, grid.grid.length);

                
                //console.log("Debug: prevColor and currHex are", prevColor, currHex);

                if(isNaN(currIndex)){
                    console.log("Exception: currIndex yields NaN, hence cannot insert into operation indexes.\nAlso gridIndexes are", gridIndexes);
                    console.log("Debug: retrieved gridIndexes with event.x, event.y is", gridIndexes, e.x, e.y);
                }
                else if(!currOperation.hexIndexes.has(currIndex)){
                    currOperation.hexIndexes.add(currIndex);
                    if(!currOperation.colorMap.has(currIndex)){
                        currOperation.colorMap.set(currIndex, prevColor);
                    }
                }
                //console.log("Debug: pushed currIndex into currOperation", currIndex);
            }
            else if(rightMouseDown){
                console.log("Debug: right click move");
                let gridIndexes = [];
                let currHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
                eraseHex(currHex, gridIndexes, grid.grid.length);
            }
        }
        canvas.onmouseup = e => {
            console.log("Debug: currOperation yielded", currOperation);
            //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX e.button and undoStack redoStack are", e.button, undoStack, redoStack);
            if(e.button === 0){
                leftMouseDown = false;
                //add the currOperation onto the undo stack
                undoStack.push(currOperation);
            }
            else if(e.button === 2){
                rightMouseDown = false;
            }
        }
    }
    else if(currMode === 3){ //line tool
        let startHex = null;
        let endHex = null;
        let startGridIndexes = null;
        let endGridIndexes = null;


        //rectengular selection and movement
        canvas.onmousedown = e => {
            let canvasX = e.x; //- boundingRect.left;
            let canvasY = e.y; //- boundingRect.top; //in canvas coordinates
            let gridIndexes = [];

            startHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
            startGridIndexes = gridIndexes;
        }
        canvas.onmousemove = e => {
            if(startHex !== null){
                let canvasX = e.x //- boundingRect.left;
                let canvasY = e.y //- boundingRect.top; //in canvas coordinates
                let gridIndexes = [];
    
                endHex = grid.getGridEntry(canvasX, canvasY, gridIndexes);
                endGridIndexes = gridIndexes;
    
                if(endHex !== null){
                    let path = Grid.dijkstra(grid.gridLength, startGridIndexes[0], startGridIndexes[1], endGridIndexes[0], endGridIndexes[1]);
                    
                    //mid rerender with temp grid 
                    Grid.renderLineTooledGrid(gl, grid, path);
                    console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY");
                }
            }
        }
        canvas.onmouseup = e =>{
            
        }
    }
}

/**
 * 
 * @param {*} hex a Hexagon instance
 * @param {*} color expects an object having r, g, b attributes [0, 1]
 * forces re-render of the whole grid
 */
function paintHex(hex, color, gridIndexes, gridRowLength){
    //console.log("Debug: paintHex received color", color);
    //console.log("Debug: paintHex received hex", hex);
    //console.log("Debug: hex filled index and stroke index arrays are: ", Hexagon.filledIndexData, Hexagon.strokeIndexData);
    if(hex !== null){
        hex.color = color;

        if(hex.strokeEnabled){
            //here we need to remove this empty cell's index from the static hexagon variable and place it into filledIndexArray
            let rowIndex = gridIndexes[0];
            let columnIndex = gridIndexes[1];
            let index = rowIndex * gridRowLength + columnIndex; 
            removeByValue(Hexagon.strokeIndexData, index);
            
            //console.log("Debug: paintHex rowIndex columnIndex and index are:", rowIndex, columnIndex, index);
            if(Hexagon.filledIndexData.indexOf(index) === -1){ //ensure we have no duplicate entry already
                Hexagon.filledIndexData.push(index);
            }
            
        }

        hex.strokeEnabled = false; //disable stroke
        grid.renderGrid(gl);
        //hex.render(gl);
    }
}

/**
 * 
 * @param {*} hex a Hexagon instance
 * forces re-render of the whole grid when hex not null
 */ 
function eraseHex(hex, gridIndexes, gridRowLength){
    console.log("Debug: eraseHex invoked");
    if(hex !== null){
        if(!hex.strokeEnabled){
            let rowIndex = gridIndexes[0];
            let columnIndex = gridIndexes[1];
            let index = rowIndex * gridRowLength + columnIndex;
            
            removeByValue(Hexagon.filledIndexData, index);

            if(Hexagon.strokeIndexData.indexOf(index) === -1){ //ensure we have no duplicate entry already
                Hexagon.strokeIndexData.push(index);
            }
            hex.strokeEnabled = true; //enable stroke
            grid.renderGrid(gl);
        }
    }
}

setEventHandlers();
console.log("Debug: about to initialize grid then render a whole grid");
let n = 10;

//Camera.setProjectionMatrix(canvas); //set the projection matrix at the beginning

let firstTopRight = {x: 30, y: 30};
let grid = new Grid(n); //grid 0
grid.initGrid(firstTopRight);
let grid0 = grid; //copy by reference
let grid1 = grid.deepCopy(); //grid 1
let grid2 = grid.deepCopy(); //grid 2

let indexesGrid2 = Hexagon.setIndexData(gl, grid2.grid); //NOW ALSO static Hexagon indexes are set for grid 2
let indexesGrid1 = Hexagon.setIndexData(gl, grid1.grid);
let indexesGrid0 = Hexagon.setIndexData(gl, grid0.grid);
let indexesGridCurr = indexesGrid0; //update this along each operation namely save it into this

let firstGrid = grid0, midGrid = grid1, bottomGrid = grid2;
let firstIndexes = indexesGrid0, midIndexes = indexesGrid1, bottomIndexes = indexesGrid2; //keep these in global scope for easier saving

let gridOrder = [0, 1, 2]; //here grid 0 comes first (on top) grid 2 comes last

grid.renderGrid(gl);


let undoStack = []; //stack which will hold operations for undo
let redoStack = [];//stack which will hold operations for redo
let currOperation = new Operation(null, null, null);//{hexIndexes: null, brush: null, colorMap: null}; //current operation in which we will keep track of

function slideHandler(e){
    //console.log("Debug: slideHandler invoked");
    let r = grid.brush.r, g = grid.brush.g, b = grid.brush.b;
    switch(e.target.id){
        case "redSlider": r = e.target.value / 255.0; break;
        case "greenSlider": g = e.target.value / 255.0; break;
        case "blueSlider": b = e.target.value / 255.0; break;
    }

    grid.brush = {r: r, g: g, b: b}; //set the brush
    //console.log("Debug: brush has been set to", grid.brush);
    updateColorCanvas();
}

function updateColorCanvas(){
    // Get the canvas element and its context
    const canvas = document.getElementById('colorCanvas');
    const ctx = canvas.getContext('2d');

    const color = "rgb(" + (grid.brush.r * 255) + ", " + (grid.brush.g * 255) + ", " + (grid.brush.b * 255) + ")";
    console.log("Debug: color style string for color canvas", color);
    // Set the fill color
    ctx.fillStyle = color;

    // Fill the entire canvas with the color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function undoHandler(e){
    console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU Debug: undoHandler invoked, current stacks are undo redo", undoStack, redoStack);
    
    if(undoStack.length > 0){
        let operation = undoStack.pop();
        Operation.undo(grid, operation);
        grid.renderGrid(gl); //force re-render
        redoStack.push(operation); //push to the redo stack
    }
    console.log("UUUUUU stacks after undo handler finish", undoStack, redoStack)
}
function redoHandler(e){
    console.log("Debug: redoHandler invoked, current stacks are undo redo", undoStack, redoStack);
    
    if(redoStack.length > 0){
        let operation = redoStack.pop();
        Operation.redo(grid, operation);
        grid.renderGrid(gl); //force re-render
        undoStack.push(operation); //push to the redo stack
    }
}
function cbZoomHandler(e){
    zoomChecked = cbZoom.checked;
    if(!zoomChecked){
        Camera.zoomFactor = 1.0; //reset to 1
    }
    setEventHandlers(); //reset event handlers (for mouse functionality changes)
    document.getElementById("zoomLabel").textContent = Camera.zoomFactor;
    grid.renderGrid(gl);//force re-render
}
function btZoomInHandler(e){
    if(zoomChecked || currMode === 1){
        Camera.zoomFactor += ZOOM_STEP;
        document.getElementById("zoomLabel").textContent = Camera.zoomFactor;
        grid.renderGrid(gl);//force re-render
    }
}
function btZoomOutHandler(e){
    if(zoomChecked || currMode === 1){
        Camera.zoomFactor -= ZOOM_STEP;
        if(Camera.zoomFactor < 0.2){
            Camera.zoomFactor = 0.2; //hardcode
        }
        document.getElementById("zoomLabel").textContent = Camera.zoomFactor;
        grid.renderGrid(gl);//force re-render
    }
}

let cbZoom = document.getElementById("cbZoom");
cbZoom.addEventListener("change", cbZoomHandler);

// Attach the handler to multiple sliders
document.getElementById("blueSlider").addEventListener("change", slideHandler);
document.getElementById("redSlider").addEventListener("change", slideHandler);
document.getElementById("greenSlider").addEventListener("change", slideHandler);
document.getElementById("btUndo").addEventListener("click", undoHandler);
document.getElementById("btRedo").addEventListener("click", redoHandler);
document.getElementById("btZoomIn").addEventListener("click", btZoomInHandler);
document.getElementById("btZoomOut").addEventListener("click", btZoomOutHandler);
const radios = document.getElementsByName('mode');

radios.forEach(radio => {
    radio.addEventListener('change', e => {
        switch(e.target.value){
            case "brush": currMode = 0; break;
            case "zoom": currMode = 1; break;
            case "move": currMode = 2; break;
            case "line": currMode = 3; break;
        }
        console.log("Debug: currMode rb is", currMode);
        setEventHandlers(); //reset event handling
    })
});

const cbRender = document.getElementById('cbRenderOrder');

  // Add event listener to handle change event
  cbRender.addEventListener('change', e =>{
    const value = cbRender.value;
    renderOrderSelection = parseInt(value);

    firstGrid = grid0, midGrid = grid1, bottomGrid = grid2;
    firstIndexes = indexesGrid0, midIndexes = indexesGrid1, bottomIndexes = indexesGrid2;

    switch(renderOrderSelection){
        case 123: grid = grid0; break; //already set, only assign current grid to be edited to grid0
        case 132: 
            firstGrid = grid0, midGrid = grid2, bottomGrid = grid1;
            firstIndexes = indexesGrid0, midIndexes = indexesGrid2, bottomIndexes = indexesGrid1; 
            grid = grid0; break;
        case 213:
            firstGrid = grid1, midGrid = grid0, bottomGrid = grid2;
            firstIndexes = indexesGrid1, midIndexes = indexesGrid0, bottomIndexes = indexesGrid2; 
            grid = grid1; break;
        case 231:
            firstGrid = grid1, midGrid = grid2, bottomGrid = grid0;
            firstIndexes = indexesGrid1, midIndexes = indexesGrid2, bottomIndexes = indexesGrid0;
            grid = grid1; break;
        case 312:
            firstGrid = grid2, midGrid = grid0, bottomGrid = grid1;
            firstIndexes = indexesGrid2, midIndexes = indexesGrid0, bottomIndexes = indexesGrid1; 
            grid = grid2; break;
        case 321:
            firstGrid = grid2, midGrid = grid1, bottomGrid = grid0;
            firstIndexes = indexesGrid2, midIndexes = indexesGrid1, bottomIndexes = indexesGrid0; 
            grid = grid2; break;
    }

    indexesGridCurr = firstIndexes;
    //now invoke combinedRender
    Grid.renderCombinedGrid(gl, firstGrid, midGrid, bottomGrid, firstIndexes, midIndexes, bottomIndexes);
    Hexagon.strokeIndexData = firstIndexes[0];
    Hexagon.filledIndexData = firstIndexes[1];
  });

  document.getElementById("btSave").addEventListener("click", () => {
    const result = Grid.renderCombinedGrid(gl, firstGrid, midGrid, bottomGrid, firstIndexes, midIndexes, bottomIndexes);
    const content = Grid.serialize(result.instance, result.indexes);
    const blob = new Blob([content], { type: "text/plain" }); // You can change MIME type here if needed
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "example.txt"; // File name for download
    document.body.appendChild(link); // Append link to the DOM

    link.click(); // Programmatically click link to initiate download

    document.body.removeChild(link); // Clean up by removing the link
    URL.revokeObjectURL(url); // Release memory
});

document.getElementById("btLoad").addEventListener("click", () => {
    if(loadedFile !== null){
        let file = loadedFile[0];

        const reader = new FileReader();

        reader.onload = function(e) { //this onload is thrown when the file is read completely
            const data = Grid.deserialize(e.target.result);
            console.log("DDDDDDDDDDDDDDDDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBBBBBBBBBBBBBBBBBBBBBUG: data in onload is", data);

            //now reset grid0, grid1, grid2 and set the currently received grid to grid0, also update static hexagon fill stroke index datas
            grid = data.instance;
            grid1 = new Grid(n); //grid 0
            grid1.initGrid(firstTopRight);
            let grid0 = grid; //copy by reference
            let grid2 = grid1.deepCopy(); //grid 2

            Hexagon.strokeIndexData = data.indexes[0];
            Hexagon.filledIndexData = data.indexes[1];

            indexesGrid2 = Hexagon.setIndexData(gl, grid2.grid); //NOW ALSO static Hexagon indexes are set for grid 2
            indexesGrid1 = Hexagon.setIndexData(gl, grid1.grid);
            indexesGrid0 = Hexagon.setIndexData(gl, grid0.grid);
            indexesGridCurr = indexesGrid0; //update this along each operation namely save it into this

            cbRender.selectedIndex = 0;  //select programmatically to rerender
            grid.renderGrid(gl); //manual render
        };

        reader.readAsText(file); // Reads the file content as text
    }
});

let loadedFile = null;
document.getElementById('fileUpload').addEventListener('change', (event) => {
    const files = event.target.files;
    //console.log(files); // This will log a FileList containing the selected file(s)
    loadedFile = files;
});

//removes a given element by value from the given array
function removeByValue(array, item){
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
}

//Grid.locateLineIndexes(0, 8, 6, 1, grid);
//console.log("Debug: Hexagon.VERT_POS & Hexagon.VERTICES are", Hexagon.VERT_POS, Hexagon.VERTICES);

//grid.renderRectSelection(gl, 0.2, 0.2, 0.8, 0.8);
moveEnabled = true; //for testing
setEventHandlers(); //for testing

console.log("Debug: SHORTEST PATH YIELDS TEST", Grid.dijkstra(10, 0, 0, 4, 4));

//Grid.renderCombinedGrid(gl, grid0, grid1, grid2, indexesGrid0, indexesGrid1);

/*Camera.position.x += 0.4;
Camera.position.y += 0.8;
Camera.zoomFactor = 2;
console.log("Debug: initial mv matrix is:", Camera.getModelViewMatrix());*/