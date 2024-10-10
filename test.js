import { Hexagon } from "./hexagon.js";
import { Grid } from "./grid.js";

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

let mousedown = false;

//WE NEED 1X1 ratio in canvas!
console.log("Debug: canvas width and height are", canvas.width, canvas.height);

Hexagon.initProgram(gl, canvas.width, canvas.height);
console.log("Debug: Hexagon regular vertPos is ", Hexagon.VERT_POS);

//let hex = new Hexagon({x: 30, y: 30});
//hex.render(gl);

function setEventHandlers(){
    canvas.onmousedown = e => {
        console.log("Debug: canvas mouse down has positions as " + e.x + ", " + e.y);
        mousedown = true;

        let gridIndexes = [];
        let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);
        paintHex(currHex, grid.brush, gridIndexes, grid.grid.length);
    }
    canvas.onmousemove = e => {
        if(mousedown){

            let gridIndexes = [];
            let currHex = grid.getGridEntry(e.x, e.y, gridIndexes);
            paintHex(currHex, grid.brush, gridIndexes, grid.grid.length)
        }
    }
    canvas.onmouseup = e => {
        mousedown = false;
    }
}

/**
 * 
 * @param {*} hex a Hexagon instance
 * @param {*} color expects an object having r, g, b attributes [0, 1]
 * forces re-render of the whole grid
 */
function paintHex(hex, color, gridIndexes, gridRowLength){
    //console.log("Debug: paintHex received hex", hex);
    console.log("Debug: hex filled index and stroke index arrays are: ", Hexagon.filledIndexData, Hexagon.strokeIndexData);
    if(hex !== null){
        hex.color = color;

        if(hex.strokeEnabled){
            //here we need to remove this empty cell's index from the static hexagon variable and place it into filledIndexArray
            let rowIndex = gridIndexes[0];
            let columnIndex = gridIndexes[1];
            let index = rowIndex * gridRowLength + columnIndex; 
            removeByValue(Hexagon.strokeIndexData, index);
            
            console.log("Debug: paintHex rowIndex columnIndex and index are:", rowIndex, columnIndex, index);
            Hexagon.filledIndexData.push(index);
        }

        hex.strokeEnabled = false; //disable stroke
        grid.renderGrid(gl);
        //hex.render(gl);
    }
}

setEventHandlers();
console.log("Debug: about to initialize grid then render a whole grid");
let n = 10;

let firstTopRight = {x: 30, y: 30};
let grid = new Grid(n);
grid.initGrid(firstTopRight);
Hexagon.setIndexData(gl, grid.grid);
grid.renderGrid(gl);


//removes a given element by value from the given array
function removeByValue(array, item){
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
}