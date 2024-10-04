import { Hexagon } from "./hexagon.js";

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');



Hexagon.initProgram(gl, canvas.clientWidth, canvas.clientHeight);

let hex = new Hexagon({x: 30, y: 30});
hex.render(gl);