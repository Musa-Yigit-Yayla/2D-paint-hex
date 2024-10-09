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
        let currHex = grid.getGridEntry(e.x, e.y);
        paintHex(currHex, grid.brush)
    }
    canvas.onmousemove = e => {
        if(mousedown){
            let currHex = grid.getGridEntry(e.x, e.y);
            paintHex(currHex, grid.brush)
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
function paintHex(hex, color){
    console.log("Debug: paintHex received hex", hex);
    if(hex !== null){
        hex.color = color;
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
grid.renderGrid(gl);
