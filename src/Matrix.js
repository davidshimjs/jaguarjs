/**
 * 행렬
 * @namespace
 */
collie.Matrix = {
    /**
     * 행렬 곱셈
     * 
     * @param {Array} a1
     * @param {Array} a2
     */
    multiple : function (a1, a2) {
        var matrix = [];
        
        for (var row2 = 0, len = a2.length; row2 < len; row2++) {
            var r = [];
            
            for (var col2 = 0, len2 = a2[0].length; col2 < len2; col2++) {
                var s = 0;
                
                for (var col1 = 0, len3 = a1[0].length; col1 < len3; col1++) {
                    s += a1[row2][col1] * a2[col1][col2];
                }
                
                r.push(s);
            }
            
            matrix.push(r);
        }
        
        return matrix;
    },
    
    /**
     * translate와 관련된 계산 행렬을 반환
     * 
     * @param {Number} nX
     * @param {Number} nY
     * @return {Array}
     */
    translate : function (nX, nY) {
        return [
            [1, 0, nX],
            [0, 1, nY],
            [0, 0, 1]
        ];
    },
    
    /**
     * scale 계산 행렬 반환
     * 
     * @param {Number} nX
     * @param {Number} nY
     * @return {Array}
     */
    scale : function (nX, nY) {
        return [
            [nX, 0, 0],
            [0, nY, 0],
            [0, 0, 1]
        ];
    },
    
    /**
     * 회전 계산 행렬 반환
     * 
     * @param {Number} nAngle
     * @return {Array}
     */
    rotate : function (nAngle) {
        var nRad = collie.util.toRad(nAngle);
        var nCos = Math.cos(nRad);
        var nSin = Math.sin(nRad);
        
        return [
            [nCos, -nSin, 0],
            [nSin, nCos, 0],
            [0, 0, 1]
        ];
    },
    
    /**
     * 대상 point를 변형
     * 
     * @param {Array} a 적용할 계산 행렬
     * @param {Number} nX 대상 x좌표
     * @param {Number} nY 대상 y좌표
     * @return {Object} htResult
     * @return {Number} htResult.x 변경된 x좌표
     * @return {Number} htResult.y 변경된 y좌표
     */
    transform : function (a, nX, nY) {
        var aResult = this.multiple(a, [
            [nX],
            [nY],
            [1]
        ]);
        
        return {
            x : aResult[0][0],
            y : aResult[1][0]
        };
    }
};