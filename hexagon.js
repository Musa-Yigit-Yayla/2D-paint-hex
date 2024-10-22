//File for managing hexagon drawing

const DEBUG_LOG = false;

export class Hexagon{
    static shaders = {
        vs: 
            `#version 300 es
            
            in vec2 vertPos;
            in vec3 fillColor;
            out vec3 color;

            void main(){
                color = fillColor;
                gl_Position = vec4(vertPos, 0.0, 1.0); //later pass an attribute for z as well for layering
            }`,
        fs: 
            `#version 300 es
            precision mediump float;

            out vec4 outColor;
            in vec3 color;

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
                //gl_PointSize = 5.0;
            }
            `,
        fs:
            `#version 300 es
            precision mediump float;

            const vec3 strokeColor = vec3(0.0, 0.0, 0.0);
            out vec4 outColor;
            void main(){
                outColor = vec4(strokeColor, 1.0);
            }
            
            `,
            
    }
    static WORLD_SIDE_LENGTH = 20; //px in world coordinates
    static SIDE_LENGTH; //in clipspace coordinates (this is also clipspace world ratio)
    static VERT_POS;
    //static LINE_INDEXES = [0, 1, 3, 4, 8, 11];

    static program = null;
    static programStroke = null;
    static posBuffer = null;
    static strokePosBuffer = null;
    static fillColorBuffer = null;

    //data of each hexagon in our grid
    static vertPosData = [];
    static colorData = [];
    static strokeIndexData = []; //will hold indices of hexagons which are empty
    static filledIndexData = []; //will hold indices of hexagons which are currently painted

    static vertPosLength; //total length of vertPosData which is passed to the buffer

    static CANVAS_W;
    static CANVAS_H; //canvas attributes, must be passed from app
    

    topRightVert = {x: 0, y: 0}; //in worldspace coords
    color = {r: 0.8, g: 0.8, b: 0.8};
    strokeEnabled = true;
    renderEnabled = true; //when false, we do not render this hexagon

    /**
     * 
     * @param {*} topRightVert stands for top right of the flat hexagon, and is an object having x and y parameters
     * standing for canvas coordinate system location
     */
    constructor(topRightVert){
        this.topRightVert = topRightVert;
    }

    //Method for rendering a single hexagon !!!DEPRECATED METHOD
    render(gl){
        if(!this.renderEnabled){
            return;
        }
        //first render the interior
        gl.useProgram(Hexagon.program);

        //fetch the clipspace coordinates
        let clipCoords = [];
        let topRightConverted = this.translateCoords(this.topRightVert.x, this.topRightVert.y);
        DEBUG_LOG && console.log("Debug: topRightConverted is", topRightConverted);
        for(let i = 0; i < Hexagon.VERT_POS.length - 1; i += 2){

            let x = Hexagon.VERT_POS[i], y = Hexagon.VERT_POS[i + 1];

            clipCoords.push(x + topRightConverted.x, y + topRightConverted.y);
        }

        DEBUG_LOG && console.log("Debug: Hexagon.SIDE_LENGTH is ", Hexagon.SIDE_LENGTH);

        clipCoords = new Float32Array(clipCoords); //flatten
        DEBUG_LOG && console.log("Debug: clip space coords for hexagon is: ", clipCoords);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, clipCoords, gl.STATIC_DRAW);

        let vertPosLoc = gl.getAttribLocation(Hexagon.program, 'vertPos');
        gl.enableVertexAttribArray(vertPosLoc); //enable GLSL attribute location
        gl.vertexAttribPointer(vertPosLoc, 2, gl.FLOAT, false, 0, 0);

        //now also pass the fill color as uniform3fv
        let colorArr = new Float32Array([this.color.r, this.color.g, this.color.b]);

        let colorLoc = gl.getUniformLocation(Hexagon.program, 'color');
        gl.uniform3fv(colorLoc, colorArr);

        const vertexCount = 6
        gl.drawArrays(gl.TRIANGLES, 0, 2 * vertexCount);

        if(this.strokeEnabled){
            gl.useProgram(Hexagon.programStroke);

            let strokeCoords = new Float32Array(this.getStrokeCoords());

            DEBUG_LOG && console.log("Debug: hexagon.vertices are: ", Hexagon.VERTICES);
            DEBUG_LOG && console.log("Debug: strokeCoords is:", strokeCoords);

            //we will draw in line loop
            gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.strokePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, strokeCoords, gl.STATIC_DRAW);

            let strokeVertLoc = gl.getAttribLocation(Hexagon.programStroke, 'vertPos');
            gl.enableVertexAttribArray(strokeVertLoc);
            gl.vertexAttribPointer(strokeVertLoc, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.LINE_LOOP, 0, vertexCount);
        }
    }

    /**
     * 
     * @param {*} gl 
     * @param {*} grid 2d array of Hexagon instances
     * @param {*} brush color object with r g b attributes 0-1
     * render the whole grid at once to overcome CPU-GPU bottleneck
     * IMPORTANT: updates buffer data in place
     */
    static renderGrid(gl, grid, brush){
        Hexagon.updateBufferData(gl, grid); //update here in place
        DEBUG_LOG && console.log("Debug: executing Hexagon.renderGrid with grid and brush", grid, brush);
        //render the interior
        gl.useProgram(Hexagon.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.posBuffer);
        let vertPosLoc = gl.getAttribLocation(Hexagon.program, 'vertPos');
        gl.enableVertexAttribArray(vertPosLoc); //enable GLSL attribute location
        gl.vertexAttribPointer(vertPosLoc, 2, gl.FLOAT, false, 0, 0);
        
        //pass fill color buffer
        let colorArr = new Float32Array([brush.r, brush.g, brush.b]);
        DEBUG_LOG && console.log("Debug: colorArr in renderGrid is", colorArr);
        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.fillColorBuffer);
        //gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);
        let fillColorPosLoc = gl.getAttribLocation(Hexagon.program, 'fillColor');
        gl.enableVertexAttribArray(fillColorPosLoc);
        gl.vertexAttribPointer(fillColorPosLoc, 3, gl.FLOAT, false, 0, 0);

        //now initalize stroke pos array from index array and pass it
        let strokePosArr = [];
        for(let i = 0; i < Hexagon.strokeIndexData.length; i++){
            let currIndex = Hexagon.strokeIndexData[i];

            let currRow = Math.floor(currIndex / grid.length);
            let currColumn = currIndex % grid.length;
            DEBUG_LOG && console.log("Debug: renderGrid loop currIndex, curr row and column are", currIndex, currRow, currColumn);

            let currHex = grid[currRow][currColumn];
            let strokeCoords = currHex.getStrokeCoords();

            for(let j = 0; j < strokeCoords.length - 3; j += 2){// - 1; j++){
                strokePosArr.push(strokeCoords[j], strokeCoords[j + 1], strokeCoords[j + 2], strokeCoords[j + 3]);//, strokeCoords[j + 1]);
            }
            //now push the very last and first vertices
            strokePosArr.push(strokeCoords[strokeCoords.length - 2], strokeCoords[strokeCoords.length - 1], strokeCoords[0], strokeCoords[1]);
        }
        strokePosArr = new Float32Array(strokePosArr); //flatten
        gl.drawArrays(gl.TRIANGLES, 0, Hexagon.vertPosLength / 2);
        DEBUG_LOG && console.log("Debug: Hexagon.vertPosLength is ", Hexagon.vertPosLength);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.strokePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, strokePosArr, gl.STREAM_DRAW);
        
        gl.useProgram(Hexagon.programStroke);
        let strokeVertLoc = gl.getAttribLocation(Hexagon.programStroke, 'vertPos');
        gl.enableVertexAttribArray(strokeVertLoc);
        gl.vertexAttribPointer(strokeVertLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, strokePosArr.length / 2);
    }

    /**
     * 
     * @param {*} gl 
     * @param {*} grid 2d array of Hexagon instances
     * set index data for all hexagons 
     * INVOKE BEFORE INVOKING renderGrid for the first time
     */
    static setIndexData(gl, grid){
        //fetch the clipspace coordinates of ALL renderable hexagons
        let clipCoords = [];
        let fillColors = [];
        let strokeIndexes = [];
        let filledIndexes = [];
        const vertexCount = 6;

        for(let i = 0; i < grid.length; i++){
            for(let j = 0; j < grid[i].length; j++){
                let currHex = grid[i][j];
                let currIndex = i * grid[0].length + j;

                if(!currHex.strokeEnabled){
                    /*let topRightConverted = currHex.translateCoords(currHex.topRightVert.x, currHex.topRightVert.y);
                    for(let k = 0; k < Hexagon.VERT_POS.length - 1; k += 2){
            
                        let x = Hexagon.VERT_POS[k], y = Hexagon.VERT_POS[k + 1];
            
                        clipCoords.push(x + topRightConverted.x, y + topRightConverted.y);

                        let vCounter = 0;
                        while(vCounter < vertexCount){
                            fillColors.push(currHex.color.r, currHex.color.g, currHex.color.b);
                            vCounter++;
                        }
                    }*/
                    filledIndexes.push(currIndex);
                }
                else{
                    //push the index of this hexagon, we will infer the exact position later on
                    strokeIndexes.push(currIndex);
                }
            }
        }
        Hexagon.vertPosData = clipCoords;
        Hexagon.colorData = fillColors;
        Hexagon.strokeIndexData = strokeIndexes;
        Hexagon.filledIndexData = filledIndexes;
        

        console.log("Debug: upon Hexagon.setBufferData vertPosData, colorData and strokeIndexData yields respectively: ", Hexagon.vertPosData, Hexagon.colorData, Hexagon.strokeIndexData);
    }
    /**
     * 
     * @param {*} gl 
     * @param {*} grid 
     * update buffer data so that we fill color and vertPos arrays set beforehand
     */
    static updateBufferData(gl, grid){
        let clipCoords = [];
        let colorArr = [];

        for(let i = 0; i < Hexagon.filledIndexData.length; i++){
            let currIndex = Hexagon.filledIndexData[i]; //we assume that this data is always persistent (it must be ensured)
            let currRow = Math.floor(currIndex / grid.length);
            let currColumn = currIndex % grid.length;

            let currHex = grid[currRow][currColumn];
            //console.log("Debug: hex " + i + " color is", currHex.color);
            
            
            let topRightConverted = currHex.translateCoords(currHex.topRightVert.x, currHex.topRightVert.y);
            DEBUG_LOG && console.log("Debug: topRightConverted is", topRightConverted);
            for(let i = 0; i < Hexagon.VERT_POS.length - 1; i += 2){

                let x = Hexagon.VERT_POS[i], y = Hexagon.VERT_POS[i + 1];

                clipCoords.push(x + topRightConverted.x, y + topRightConverted.y);
                colorArr.push(currHex.color.r, currHex.color.g, currHex.color.b); //push the color for every vertex
            }
        }
        //console.log("Debug: before flatten color arr is ", colorArr);
        clipCoords = new Float32Array(clipCoords); //flatten
        colorArr = new Float32Array(colorArr); //flatten
        //console.log("De bug: flattened updateBufferData colorArr is:", colorArr);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, clipCoords, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, Hexagon.fillColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);

        Hexagon.vertPosLength = clipCoords.length;
        //const vertexCount = 6
        //gl.drawArrays(gl.TRIANGLES, 0, 2 * vertexCount);
    }

    /**
     * @param x
     * @param y world coords
     * 
     * Translates the given world coords returns it in its clipspace position in 2D
     * @return {x: cx, y: cy}
     */
    translateCoords(x, y){
        let cx = (x - Hexagon.CANVAS_W / 2.0) * (2.0 / Hexagon.CANVAS_W); //side length is also clipspace world ratio
        let cy = -1.0 * (y - Hexagon.CANVAS_H / 2.0) * (2.0 / Hexagon.CANVAS_H);

        DEBUG_LOG && console.log("Debug: cx and cy are respectively", cx, cy, "where given x and y parameters are", x, y);
        return {x: cx, y: cy};
    }

    /**
     * 
     * @param {*} x 
     * @param {*} y world coords
     * 
     * @return array of stroke coordinates by applying current world coord translation
     */
    getStrokeCoords(){
        let result = [];

        let topRightConverted = this.translateCoords(this.topRightVert.x, this.topRightVert.y);
        for(let i = 0; i < Hexagon.VERTICES.length; i+=2){
            let currX = Hexagon.VERTICES[i] + topRightConverted.x;
            let currY = Hexagon.VERTICES[i + 1] + topRightConverted.y;

            //let clipCoord = this.translateCoords(currX, currY);
            result.push(currX, currY); //MIGHT BE PROBLEMATIC TRANSLATION CHECK!
        }
        return result;
    }

    /**
     * 
     * @param {*} px 
     * @param {*} py coordinates of a point in world coordinate system
     * @return true when given point is contained by this hexagon or on a side of the hexagon
     */
    containsPoint(px, py){
        console.log("Debug: containsPoint invoked with px, py and this.topRightVert as ", px, py, this.topRightVert);
        console.log("Debug: conditions separated by && yield", px <= this.topRightVert.x + Hexagon.WORLD_SIDE_LENGTH / 2.0, px >= this.topRightVert.x - 1.5 * Hexagon.WORLD_SIDE_LENGTH, py >= this.topRightVert.y);
        return px <= this.topRightVert.x + Hexagon.WORLD_SIDE_LENGTH / 2.0 && px >= this.topRightVert.x - 1.5 * Hexagon.WORLD_SIDE_LENGTH && py >= this.topRightVert.y;
    }

    static initProgram(gl, canvasWidth, canvasHeight){
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //clear for each render once in grid!!!

        //set length properties
        Hexagon.CANVAS_W = canvasWidth;
        Hexagon.CANVAS_H = canvasHeight;
        Hexagon.SIDE_LENGTH = 2.0 * Hexagon.WORLD_SIDE_LENGTH / Hexagon.CANVAS_W;

        //init vertex positions
        Hexagon.VERT_POS = [
            0, 0, //p1
            0 - Hexagon.SIDE_LENGTH, 0, //p2
            0 - ((1 + Math.sin(Math.PI / 6)) * Hexagon.SIDE_LENGTH), 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH, //p3
            0, 0, //p1
            0 - ((1 + Math.sin(Math.PI / 6)) * Hexagon.SIDE_LENGTH), 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH, //p3
            0 - Hexagon.SIDE_LENGTH, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p4
            0, 0, //p1
            0 - Hexagon.SIDE_LENGTH, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p4
            0, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p5
            0, 0, //p1
            0, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p5
            0 + Math.sin(Math.PI / 6) * Hexagon.SIDE_LENGTH, 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH,
        ];

        Hexagon.VERTICES = [
            0, 0, //p1
            0 - Hexagon.SIDE_LENGTH, 0, //p2
            0 - ((1 + Math.sin(Math.PI / 6)) * Hexagon.SIDE_LENGTH), 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH, //p3
            0 - Hexagon.SIDE_LENGTH, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p4
            0, (0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH) * 2, //p5
            0 + Math.sin(Math.PI / 6) * Hexagon.SIDE_LENGTH, 0 - Math.cos(Math.PI / 6) * Hexagon.SIDE_LENGTH //p6
        ]
    
        Hexagon.program = gl.createProgram();
        Hexagon.programStroke = gl.createProgram();
        Hexagon.posBuffer = gl.createBuffer();
        Hexagon.strokePosBuffer = gl.createBuffer();
        Hexagon.fillColorBuffer = gl.createBuffer();

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

        gl.shaderSource(strokeVS, Hexagon.strokeShaders.vs);
        gl.shaderSource(strokeFS, Hexagon.strokeShaders.fs);

        gl.compileShader(strokeVS);
        gl.compileShader(strokeFS);

        if (!gl.getShaderParameter(strokeVS, gl.COMPILE_STATUS)) {
            console.error("Hexagon Stroke Vertex Shader Error: " + gl.getShaderInfoLog(strokeVS));
        }
        if (!gl.getShaderParameter(strokeFS, gl.COMPILE_STATUS)) {
            console.error("Hexagon Stroke Fragment Shader Error: " + gl.getShaderInfoLog(strokeFS));
        }

        gl.attachShader(Hexagon.programStroke, strokeVS);
        gl.attachShader(Hexagon.programStroke, strokeFS);

        gl.linkProgram(Hexagon.programStroke);

        if (!gl.getProgramParameter(Hexagon.programStroke, gl.LINK_STATUS)) {
            console.error("Shader Stroke Program Error: " + gl.getProgramInfoLog(Hexagon.programStroke));
        }
    }
}