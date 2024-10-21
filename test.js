import { Hexagon } from "./hexagon.js";
import { Grid } from "./grid.js";
import { Operation } from "./operation.js";

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

// Add an event listener for right-click (contextmenu) on the canvas
canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the default browser menu from appearing
});
let leftMouseDown = false, rightMouseDown = false;

//WE NEED 1X1 ratio in canvas!
console.log("Debug: canvas width and height are", canvas.width, canvas.height);

Hexagon.initProgram(gl, canvas.width, canvas.height);
console.log("Debug: Hexagon regular vertPos is ", Hexagon.VERT_POS);

//let hex = new Hexagon({x: 30, y: 30});
//hex.render(gl);

function setEventHandlers(){
    canvas.onmousedown = e => {
        console.log("Debug: canvas mouse down has positions as " + e.x + ", " + e.y);
        
        //reset the curr operation regardless of previously held data
        currOperation.hexIndexes = new Set();
        currOperation.brush = grid.brush;
        currOperation.colorMap = new Map();

        if(e.button === 0){ //left click
            console.log("Debug: left click down");
            leftMouseDown = true;
            let gridIndexes = [];
            let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);
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
                    currOperation.colorMap.set(currIndex, prevColor);
                }
            }
        }
        else if(e.button === 2){ //right click
            console.log("Debug: right click down");
            rightMouseDown = true;
            let gridIndexes = [];
            let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);
            eraseHex(currHex, gridIndexes, grid.grid.length);
        }
    }
    canvas.onmousemove = e => {
        if(leftMouseDown){
            //console.log("Debug: left click move");
            let gridIndexes = [];
            let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);

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

            paintHex(currHex, grid.brush, gridIndexes, grid.grid.length);

            let currIndex = gridIndexes[0] * grid.grid.length + gridIndexes[1];
            //console.log("Debug: gridIndexes and grid.grid.length are respectively", gridIndexes, grid.grid.length);

            
            //console.log("Debug: prevColor and currHex are", prevColor, currHex);

            if(isNaN(currIndex)){
                console.log("Exception: currIndex yields NaN, hence cannot insert into operation indexes");
            }
            else if(!currOperation.hexIndexes.has(currIndex)){
                currOperation.hexIndexes.add(currIndex);
                currOperation.colorMap.set(currIndex, prevColor);
            }
            //console.log("Debug: pushed currIndex into currOperation", currIndex);
        }
        else if(rightMouseDown){
            console.log("Debug: right click move");
            let gridIndexes = [];
            let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);
            eraseHex(currHex, gridIndexes, grid.grid.length);
        }
    }
    canvas.onmouseup = e => {
        console.log("Debug: currOperation yielded", currOperation);
        if(e.button === 0){
            leftMouseDown = false;
        }
        else if(e.button === 2){
            rightMouseDown = false;
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
            Hexagon.filledIndexData.push(index);
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
            Hexagon.strokeIndexData.push(index);
            hex.strokeEnabled = true; //enable stroke
            grid.renderGrid(gl);
        }
    }
}

setEventHandlers();
console.log("Debug: about to initialize grid then render a whole grid");
let n = 20;

let firstTopRight = {x: 30, y: 30};
let grid = new Grid(n);
grid.initGrid(firstTopRight);
Hexagon.setIndexData(gl, grid.grid);
grid.renderGrid(gl);

let operationStack = []; //stack which will hold operations for undo redo
let currOperation = {hexIndexes: null, brush: null, colorMap: null}; //current operation in which we will keep track of

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
    console.log("Debug: undoHandler invoked");
    Operation.undo(grid, currOperation);
    grid.renderGrid(gl); //force re-render
}
function redoHandler(e){

}

// Attach the handler to multiple sliders
document.getElementById("blueSlider").addEventListener("change", slideHandler);
document.getElementById("redSlider").addEventListener("change", slideHandler);
document.getElementById("greenSlider").addEventListener("change", slideHandler);
document.getElementById("btUndo").addEventListener("click", undoHandler);
document.getElementById("btRedo").addEventListener("click", redoHandler);

//removes a given element by value from the given array
function removeByValue(array, item){
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
}