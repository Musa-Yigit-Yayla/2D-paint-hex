/**
 * A simple camera class specific for this application, only able to move around and zoom in and out, without changing orientation
 */

export class Camera{
    position = {x: 0, y: 0}; //clipspace coords
    zoomFactor = 1.0;

    /**
     * @return a model view matrix 4x4 which is with respect to current position and zoomFactor
     */
    getModelViewMatrix(){
        let modelMatrix = Camera.getIdentityMatrix(4);
        let viewMatrix = Camera.getIdentityMatrix(4);

        let sx = this.zoomFactor, sy = this.zoomFactor;
        let tx = this.position.x, ty = this.position.y;

        Camera.scaleMat4(modelMatrix, sx, ty, 1.0);
        Camera.translateMat4(viewMatrix, -tx, -ty, 0.0); //camera will move in the opposite direction of our overall view

        let result = Camera.getIdentityMatrix(4);
        Camera.multiply(viewMatrix, modelMatrix, result);
        return result;
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

    //below are adopted from MV.js with slight implementation changes
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