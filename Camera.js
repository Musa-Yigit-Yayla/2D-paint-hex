/**
 * A simple camera class specific for this application, only able to move around and zoom in and out, without changing orientation
 */

export class Camera{
    static position = {x: 0, y: 0}; //clipspace coords
    static zoomFactor = 1.0;
    //static projectionMatrix; //flattened already

    /**
     * @return a model view matrix 4x4 which is with respect to current position and zoomFactor
     */
    /*static getModelViewMatrix(){
        let modelMatrix = Camera.getIdentityMatrix(4);
        let viewMatrix = Camera.getIdentityMatrix(4);

        let sx = Camera.zoomFactor, sy = Camera.zoomFactor;
        let tx = Camera.position.x, ty = Camera.position.y;

        Camera.scaleMat4(modelMatrix, sx, sy, 1.0);
        Camera.translateMat4(viewMatrix, -tx, -ty, 0.0); //camera will move in the opposite direction of our overall view
        console.log("Debug: scaled model matrix is", modelMatrix, " with sx and sy respectively", sx, sy);
        console.log("Debug: translated view matrix is ", viewMatrix, " with tx and ty respectively", tx, ty);

        let result = Camera.getIdentityMatrix(4);
        Camera.multiply(viewMatrix, modelMatrix, result);
        console.log("Debug: resulting mv matrix is", result);
        return result;
    }
    //Invoke only once to set the projection matrix to ortho
    /*static setProjectionMatrix(canvas){
        console.log("Debug: Camera SPM invoked");
        Camera.projectionMatrix = Camera.ortho(0, canvas.width, 0, canvas.height, -1, 1);
        console.log("Debug: after setting projectionMatrix we have", Camera.projectionMatrix);
    }*/
        static getModelViewMatrix(){
            let modelMatrix = Camera.getIdentityMatrix(3);
            let viewMatrix = Camera.getIdentityMatrix(3);
        
            let sx = Camera.zoomFactor, sy = Camera.zoomFactor;
            let tx = Camera.position.x, ty = Camera.position.y;
        
            Camera.scaleMat3(modelMatrix, sx, sy);
            Camera.translateMat3(viewMatrix, -tx, -ty);
            //console.log("Debug: scaled model matrix is", modelMatrix, " with sx and sy respectively", sx, sy);
            //console.log("Debug: translated view matrix is ", viewMatrix, " with tx and ty respectively", tx, ty);
        
            let result = Camera.getIdentityMatrix(3);
            Camera.multiply(viewMatrix, modelMatrix, result);
            //console.log("Debug: resulting mv matrix is", result);
            return result;
        }
        
        // Adjust scaleMat and translateMat to work with 3x3 matrices
        static scaleMat3(mat, sx, sy){
            mat[0][0] *= sx;
            mat[1][1] *= sy;
        }
        static translateMat3(mat, tx, ty){
            mat[0][2] += tx;
            mat[1][2] += ty;
        }

    /**
     * 
     * @param {*} n matrix length
     * @return creates a nxn identity matrix
     */
    static getIdentityMatrix(n){
        let mat = [];
        for(let i = 0; i < n; i++){
            let row = [];
            for(let j = 0; j < n; j++){
                if(i === j){
                    row.push(1);
                }
                else{
                    row.push(0);
                }
            }
            mat.push(row);
        }
        return mat;
    }
    static scaleMat4(mat, sx, sy, sz){
        mat[0][0] *= sx;
        mat[1][1] *= sy;
        mat[2][2] *= sz;
    }
    static translateMat4(mat, tx, ty, tz){
        mat[0][3] += tx;
        mat[1][3] += ty;
        mat[2][3] += tz;
    }

    //Flattens a 2d matrix into a 1d Float32Array
    static flattenMat(mat){
        let result = [];
        for(let i = 0; i < mat.length; i++){
            for(let j = 0; j < mat[i].length; j++){
                result.push(mat[i][j]);
            }
        }
        return new Float32Array(result);
    }

    // This function multiplies
    // mat1[][] and mat2[][], and
    // stores the result in res[][]
    //assumes that mat1 and mat2 are matrices of same length
    static multiply(mat1, mat2, res)
    {
        let N = mat1.length;
        let i, j, k;
        for (i = 0; i < N; i++) {
            for (j = 0; j < N; j++) {
                res[i][j] = 0;
                for (k = 0; k < N; k++)
                    res[i][j] += mat1[i][k] * mat2[k][j];
            }
        }
    }

    //below are adopted from MV.js
    static translate( x, y, z )
    {
        if ( Array.isArray(x) && x.length == 3 ) {
            z = x[2];
            y = x[1];
            x = x[0];
        }

        var result = Camera.getIdentityMatrix();
        result[0][3] = x;
        result[1][3] = y;
        result[2][3] = z;

        return result;
    }
    static scale( x, y, z )
    {
        if ( Array.isArray(x) && x.length == 3 ) {
            z = x[2];
            y = x[1];
            x = x[0];
        }

        var result = Camera.getIdentityMatrix();
        result[0][0] = x;
        result[1][1] = y;
        result[2][2] = z;

        return result;
    }
    
}
//below are adopted from MV.js
function vec4()
{
    var result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    case 2: result.push( 0.0 );
    case 3: result.push( 1.0 );
    }

    return result.splice( 0, 4 );
}
function mat4()
    {
        var v = _argumentsToArray( arguments );
    
        var m = [];
        switch ( v.length ) {
        case 0:
            v[0] = 1;
        case 1:
            m = [
                vec4( v[0], 0.0,  0.0,   0.0 ),
                vec4( 0.0,  v[0], 0.0,   0.0 ),
                vec4( 0.0,  0.0,  v[0],  0.0 ),
                vec4( 0.0,  0.0,  0.0,  v[0] )
            ];
            break;
    
        default:
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );
            break;
        }
    
        m.matrix = true;
    
        return m;
    }
function ortho( left, right, bottom, top, near, far )
    {
        if ( left == right ) { throw "ortho(): left and right are equal"; }
        if ( bottom == top ) { throw "ortho(): bottom and top are equal"; }
        if ( near == far )   { throw "ortho(): near and far are equal"; }
    
        var w = right - left;
        var h = top - bottom;
        var d = far - near;
    
        var result = mat4();
        result[0][0] = 2.0 / w;
        result[1][1] = 2.0 / h;
        result[2][2] = -2.0 / d;
        result[0][3] = -(left + right) / w;
        result[1][3] = -(top + bottom) / h;
        result[2][3] = -(near + far) / d;
    
        return result;
    }
    function _argumentsToArray( args )
{
    return [].concat.apply( [], Array.prototype.slice.apply(args) );
}
