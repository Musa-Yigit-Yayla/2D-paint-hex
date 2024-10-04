//File for managing hexagon drawing

export class Hexagon{
    static shaders = {
        vs: 
            `#version 300 es
            
            in vec2 vertPos;
            uniform vec3 color; //uniform because a grid will have a single color

            void main(){
                gl_Position = vec4(vertPos, 0.0, 1.0); //later pass an attribute for z as well for layering
            }`,
        fs: 
            `#version 300 es
            precision mediump float;

            out vec4 outColor;

            void main(){
                outColor = vec4(color, 1.0);
            }`,
    }
    static strokeShaders = { //for rendering strokes
        vs: //draws in line loop
            `#version 300 es
            
            in vec2 vertPos;
            
            void main(){
                gl_Position = vec4(vertPos, 0.0, 1.0);
            }
            `,
        fs:
            `#version 300 es
            precision mediump float;

            const vec3 strokeColor = vec(0.0, 0.0, 0.0);
            out vec4 outColor;
            void main(){
                outColor = vec4(strokeColor, 1.0);
            }
            
            `,
            
    }
    static WORLD_SIDE_LENGTH = 10; //px in world coordinates
    static SIDE_LENGTH = this.WORLD_SIDE_LENGTH / 400.0; //in clipspace coordinates (this is also clipspace world ratio)
    static VERT_POS = [
        0, 0, //p1
        0 - Hexagon.SIDE_LENGTH, 0, //p2
        0 - ((1 + Math.sin(Math.PI / 6)) * Hexagon.SIDE_LENGTH), 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH, //p3
        0, 0, //p1
        0 - ((1 + Math.sin(Math.PI / 6)) * Hexagon.SIDE_LENGTH), 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH, //p3
        0 - (Math.cos(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), 0 - (Math.sin(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), //p4
        0, 0, //p1
        0 - (Math.cos(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), 0 - (Math.sin(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), //p4
        0, 0 - (Math.sin(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), //p5
        0, 0, //p1
        0, 0 - (Math.sin(Math.PI / 3) * Hexagon.SIDE_LENGTH * Math.sqrt(4.0 / 3)), //p5
        0 + Math.sin(Math.PI / 6) * Hexagon.SIDE_LENGTH, 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH,
    ];
    static LINE_INDEXES = [0, 1, 3, 4, 8, 11];

    static program = null;
    static programStroke = null;
    static posBuffer = null;
    static colorBuffer = null;
    static strokePosBuffer = null;

    static CANVAS_W;
    static CANVAS_H; //canvas attributes, must be passed from app
    

    topRightVert = {x, y}; //in worldspace coords
    color = {r: 1.0, g: 1.0, b: 1.0};
    strokeEnabled = true;

    /**
     * 
     * @param {*} topRightVert stands for top right of the flat hexagon, and is an object having x and y parameters
     * standing for canvas coordinate system location
     */
    constructor(topRightVert){
        this.topRightVert = topRightVert;
    }

    render(gl){
        //first render the interior
        gl.useProgram(Hexagon.program);

        //fetch the clipspace coordinates
        let clipCoords = [];
        for(let i = 0; i < Hexagon.VERT_POS.length - 1; i += 2){
            let x = Hexagon.VERT_POS[i], y = Hexagon.VERT_POS[i + 1];
            let clipCoord = this.translateCoords(x, y);

            clipCoords.push(clipCoord);
        }

        clipCoords = new Float32Array(clipCoords); //flatten

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, clipCoords, gl.STATIC_DRAW);

        let vertPosLoc = gl.getAttribLocation(Hexagon.program, 'vertPos');
        gl.enableVertexAttribArray(vertPosLoc); //enable GLSL attribute location
        gl.vertexAttribPointer(vertPosLoc, 2, gl.FLOAT, false, 0, 0);

        //now also pass the fill color
        let colorArr = new Float32Array([color.r, color.g, color.b]);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);

        let colorLoc = gl.getAttribLocation(Hexagon.program, 'color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

        const vertexCount = 6
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if(this.strokeEnabled){
            gl.useProgram(Hexagon.programStroke);

            //we will draw in line loop
            gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.strokePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, )
        }
    }

    

    /**
     * @param x
     * @param y world coords
     * 
     * Translates the given world coords returns it in its clipspace position in 2D
     * @return [cx, cy]
     */
    translateCoords(x, y){
        let cx = (x - Hexagon.CANVAS_W) / this.SIDE_LENGTH; //side length is also clipspace world ratio
        let cy = (y - Hexagon.CANVAS_H) / this.SIDE_LENGTH;

        return [cx, cy];
    }

    /**
     * 
     * @param {*} x 
     * @param {*} y world coords
     * 
     * @return array of stroke coordinates by applying given world coord translation
     */
    static getStrokeCoords(x, y){
        let result = [];

        for(let i = 0; i < Hexagon.LINE_INDEXES.length; i++){
            let currX = Hexagon.VERT_POS[2 * i];
            let currY = Hexagon.VERT_POS[2 * i + 1];

            result.push(translateCoords(currX, currY)); //MIGHT BE PROBLEMATIC TRANSLATION CHECK!
        }
        return result;
    }

    static initProgram(gl, canvasWidth, canvasHeight){
        Hexagon.CANVAS_W = canvasWidth;
        Hexagon.CANVAS_H = canvasHeight;

        Hexagon.program = gl.createProgram();
        Hexagon.programStroke = gl.createProgram();
        Hexagon.posBuffer = gl.createBuffer();
        Hexagon.colorBuffer = gl.createBuffer();
        Hexagon.strokePosBuffer = gl.createBuffer();

        //init shaders then link and compile program
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, Hexagon.shaders.vs);
        gl.shaderSource(fragmentShader, Hexagon.shaders.fs);

        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Hexagon Vertex Shader Error: " + gl.getShaderInfoLog(vertexShader));
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Hexagon Fragment Shader Error: " + gl.getShaderInfoLog(fragmentShader));
        }

        gl.attachShader(Hexagon.program, vertexShader);
        gl.attachShader(Hexagon.program, fragmentShader);

        gl.linkProgram(Hexagon.program);

        if (!gl.getProgramParameter(Hexagon.program, gl.LINK_STATUS)) {
            console.error("Shader Program Error: " + gl.getProgramInfoLog(Hexagon.program));
        }

        //now init the stroke related data fields

        let strokeVS = gl.createShader(gl.VERTEX_SHADER);
        let strokeFS = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(strokeVS, strokeShaders.vs);
        gl.shaderSource(strokeFS, strokeShaders.fs);

        gl.compileShader(strokeVS);
        gl.compileShader(strokeFS);

        if (!gl.getShaderParameter(strokeVS, gl.COMPILE_STATUS)) {
            console.error("Hexagon Stroke Vertex Shader Error: " + gl.getShaderInfoLog(strokeVS));
        }
        if (!gl.getShaderParameter(strokeFS, gl.COMPILE_STATUS)) {
            console.error("Hexagon Stroke Fragment Shader Error: " + gl.getShaderInfoLog(strokeFS));
        }

        gl.linkProgram(Hexagon.programStroke);

        if (!gl.getProgramParameter(Hexagon.programStroke, gl.LINK_STATUS)) {
            console.error("Shader Stroke Program Error: " + gl.getProgramInfoLog(Hexagon.programStroke));
        }
    }
}