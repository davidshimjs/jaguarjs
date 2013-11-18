/**
 * Transform Matrix
 * - 기본으로 상대 좌표로 계산한다
 * - getBoundary와 같은 특수한 경우만 절대좌표로 반환
 * - 나중에 IE filter로 사용할 때는 points에 절대좌표 기능을 넣어야 함
 * @namespace
 */
collie.Transform = {
    _htBoundary : {
        left : 0,
        top : 0,
        right : 0,
        bottom : 0
    },
    _bIsIEUnder8 : collie.util.getDeviceInfo().ie && collie.util.getDeviceInfo().ie < 9,
    
    /**
     * Transform된 표시 객체의 Boundary를 반환 한다 (0, 0에서 시작)
     * TODO Transform 상속 구현 안됨!
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Boolean} bWithPoints 좌표를 반환하는지 여부, Sensor의 box hittest에서 쓰임
     * @return {Object} htResult 상대 좌표 영역
     * @return {Number} htResult.left
     * @return {Number} htResult.right
     * @return {Number} htResult.top
     * @return {Number} htResult.bottom
     * @return {Number} htResult.isTransform
     * @return {Number} htResult.points
     */
    getBoundary : function (oDisplayObject, bWithPoints) {
        var htInfo = oDisplayObject.get();
        var aPoints = [[0, 0], [htInfo.width, 0], [htInfo.width, htInfo.height], [0, htInfo.height]];
        var aTransformedPoints = this.points(oDisplayObject, aPoints);
        var htBoundary = collie.util.getBoundary(aTransformedPoints);
        this._htBoundary.left = htBoundary.left;
        this._htBoundary.right = htBoundary.right;
        this._htBoundary.bottom = htBoundary.bottom;
        this._htBoundary.top = htBoundary.top;
        this._htBoundary.isTransform = this.isUseTransform(oDisplayObject);
        
        if (bWithPoints) {
            this._htBoundary.points = aTransformedPoints; // sensor용 point
        }
        
        return this._htBoundary;
    },
    
    /**
     * 해당 표시 객체에 맞게 점들을 transform한 결과를 반환 한다
     * 
     * @param {collie.DisplayObject} oDisplayObject 대상 표시 객체
     * @param {Array} aPoints transform을 적용할 점들 (ex: [[x1, y1], [x2, y2], ...])
     */
    points : function (oDisplayObject, aPoints) {
        var aMatrix
        
        if (!this._bIsIEUnder8) {
            aMatrix = this.getMatrixRecusively(oDisplayObject);
        }

        // 계산할 필요가 없다면 그대로 반환
        if (!aMatrix) {
            return aPoints;
        }
        
        var aPointsAfter = [];
        
        for (var i = 0, len = aPoints.length; i < len; i++) {
            var htPoint = collie.Matrix.transform(aMatrix, aPoints[i][0], aPoints[i][1]);
            aPointsAfter.push([htPoint.x, htPoint.y]);
        }
        
        return aPointsAfter;
    },
    
    /**
     * 상속된 Transform을 적용한 Matrix를 반환
     * TODO 속도 체크해 봐야 함!
     * 
     * @param {collie.DisplayObject} oDisplayObject 최하위 객체
     * @return {Array} Matrix
     */
    getMatrixRecusively : function (oDisplayObject) {
        var self = oDisplayObject;
        var aMatrix = null;
        var nX = 0;
        var nY = 0;
        
        while (self) {
            if (this.isUseTransform(self)) {
                var aSelfMatrix = this.getMatrix(self, nX, nY);
                aMatrix = aMatrix !== null ? collie.Matrix.multiple(aMatrix, aSelfMatrix) : aSelfMatrix;
            }
            
            nX -= self._htOption.x;
            nY -= self._htOption.y;
            self = self.getParent();
        }
        
        return aMatrix;
    },
    
    /**
     * 대상 표시 객체에 맞는 Matrix를 구한다
     * 상대좌표의 matrix로 반환되며 최종 결과의 translate는 별도로 적용해야 한다
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Number} nX 좌표 보정치
     * @param {Number} nY
     * @return {Array} Matrix
     */
    getMatrix : function (oDisplayObject, nX, nY) {
        if (typeof nX === "undefined") {
            nX = 0;
        }
        
        if (typeof nY === "undefined") {
            nY = 0;
        }
        
        var htOrigin = oDisplayObject.getOrigin();
        var htInfo = oDisplayObject.get();
        var aMatrix = collie.Matrix.translate(htOrigin.x + nX, htOrigin.y + nY);
        
        if (htInfo.angle !== 0) {
            aMatrix = collie.Matrix.multiple(aMatrix, collie.Matrix.rotate(htInfo.angle));
        }
        
        if (htInfo.scaleX !== 1 || htInfo.scaleY !== 1) {
            aMatrix = collie.Matrix.multiple(aMatrix, collie.Matrix.scale(htInfo.scaleX, htInfo.scaleY));
        }
        
        aMatrix = collie.Matrix.multiple(aMatrix, collie.Matrix.translate(-(htOrigin.x + nX), -(htOrigin.y + nY)));
        return aMatrix;
    },
    
    /**
     * Transform을 사용하고 있는 경우
     * @return {Boolean}
     */
    isUseTransform : function (oDisplayObject) {
        return (oDisplayObject._htOption.scaleX !== 1 || oDisplayObject._htOption.scaleY !== 1 || oDisplayObject._htOption.angle !== 0);
    }
};