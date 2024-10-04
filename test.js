import { Hexagon } from "./hexagon.js";

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

//WE NEED 1X1 ratio in canvas!
console.log("Debug: canvas width and height are", canvas.width, canvas.height);

Hexagon.initProgram(gl, canvas.width, canvas.height);
console.log("Debug: Hexagon regular vertPos is ", Hexagon.VERT_POS);

let hex = new Hexagon({x: 30, y: 30});
hex.render(gl);