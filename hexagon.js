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
    static strokeShaders = {
        vs: 
            ``,
        fs:
            ``,
            
    }

    topRightVert;

    /**
     * 
     * @param {*} topRightVert stands for top right of the flat hexagon, and is an object having x and y parameters
     * standing for canvas coordinate system location
     */
    constructor(topRightVert){
        this.topRightVert = topRightVert;
    }

    render(gl){

    }
}