/**
 * 캔버스 방식의 렌더링
 * 
 * @private
 * @class collie.LayerCanvas
 * @param {collie.Layer} oLayer
 */
collie.LayerCanvas = collie.Class(/** @lends collie.LayerCanvas.prototype */{
    /**
     * @private
     * @constructs
     */
    $init : function (oLayer) {
        this._oLayer = oLayer;
        this._oEvent = oLayer.getEvent();
        this._htDeviceInfo = collie.util.getDeviceInfo();
        this._initCanvas();
    },
    
    _initCanvas : function () {
        var htSize = this._getLayerSize();
        this._elCanvas = document.createElement("canvas");
        this._elCanvas.width = htSize.width;
        this._elCanvas.height = htSize.height;
        this._elCanvas.className = "_collie_layer";
        this._elCanvas.style.position = "absolute";
        this._elCanvas.style.left = this._oLayer.option("x") + "px";
        this._elCanvas.style.top = this._oLayer.option("y") + "px";
        
        if (collie.Renderer.isRetinaDisplay()) {
            this._elCanvas.style.width = (htSize.width / 2) + "px";
            this._elCanvas.style.height = (htSize.height / 2) + "px";
        }
        
        this._oContext = this._elCanvas.getContext('2d');
    },
    
    /**
     * 현재 레이어 사이즈를 반환, 레티나일 경우에는 두배로 반환 한다 (캔버스일 경우에만)
     * 
     * @param {Number} nWidth 레이어 너비, 지정하지 않으면 Layer에서 값을 가져온다
     * @param {Number} nHeight 레이어 높이, 지정하지 않으면 Layer에서 값을 가져온다
     * @return {Object} htSize
     * @return {Number} htSize.width
     * @return {Number} htSize.height
     */
    _getLayerSize : function (nWidth, nHeight) {
        nWidth = nWidth || this._oLayer.option("width");
        nHeight = nHeight || this._oLayer.option("height");
        
        // 레티나 디스플레이 대응
        if (collie.Renderer.isRetinaDisplay()) {
            nWidth *= 2;
            nHeight *= 2;
        }
        
        return {
            width : nWidth,
            height : nHeight
        };
    },
    
    /**
     * Canvas Context를 반환
     * @private
     * @return {Boolean|Object}
     */
    getContext : function () {
        return this._oContext;
    },
    
    /**
     * @private
     */
    getElement : function () {
        return this._elCanvas;
    },

    /**
     * @private
     */
    clear : function (oContext) {
        oContext = oContext || this.getContext();
        
        // workaround: samsung galaxy s3 LTE 4.0.4, LG Optimus G pro 4.1.1에서 딱 맞춰서 clear하면 잔상이 생기거나 오류가 생김      
        if (!this._htDeviceInfo.android || (this._htDeviceInfo.android < 4.12 && this._htDeviceInfo.android >= 4.2)) {
            oContext.clearRect(0, 0, this._elCanvas.width + 1, this._elCanvas.height + 1);
        } else {
            // but 4.1.2 still has problem with the clearRect method
            this._elCanvas.width = this._elCanvas.width;
        }
    },
    
    /**
     * 캔버스 리사이즈
     * 
     * @param {Number} nWidth
     * @param {Number} nHeight
     * @param {Boolean} bExpand
     */
    resize : function (nWidth, nHeight, bExpand) {
        var htSize = this._getLayerSize(nWidth, nHeight);

        if (bExpand) {
            this._elCanvas.style.width = nWidth + "px";
            this._elCanvas.style.height = nHeight + "px";
            var nRatioWidth = nWidth / this._oLayer.option("width");
            var nRatioHeight = nHeight / this._oLayer.option("height");         
            this._oEvent.setEventRatio(nRatioWidth, nRatioHeight);
        } else {
            var nCanvasWidth = typeof nWidth === 'number' ? htSize.width : this._elCanvas.width;
            var nCanvasHeight = typeof nHeight === 'number' ? htSize.height : this._elCanvas.height;
            this.clear(this._oContext);
            this._oLayer.setChanged();
            this._elCanvas.width = nCanvasWidth;
            this._elCanvas.height = nCanvasHeight;
            
            if (collie.Renderer.isRetinaDisplay()) {
                this._elCanvas.style.width = nCanvasWidth / 2 + "px";
                this._elCanvas.style.height = nCanvasHeight / 2 + "px";
            }
        }
    }
});