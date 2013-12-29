/**
 * DOM 방식의 렌더링
 * 
 * @private
 * @class
 * @param {collie.Layer} oLayer
 */
collie.LayerDOM = collie.Class(/** @lends collie.LayerDOM.prototype */{
    $init : function (oLayer) {
        this._oLayer = oLayer;
        this._oEvent = oLayer.getEvent();
        this._htOption = oLayer.option();
        this._initElement();
        this._rxDisplayObjectId = new RegExp(collie.DisplayObjectDOM.ID + '([0-9]+)');
    },
    
    _initElement : function () {
        this._el = document.createElement("div");
        this._el.className = "_collie_layer";
        this._el.style.position = "absolute";
        this._el.style.left = this._htOption.x + "px";
        this._el.style.top = this._htOption.y + "px";
        this._el.style.width = this._htOption.width + "px";
        this._el.style.height = this._htOption.height + "px";
        this._el.style.overflow = "hidden";
    },
    
    /**
     * 부모를 탐색하면서 표시 객체 엘리먼트를 찾는다
     * 
     * @deprecated
     * @private
     * @param {HTMLElement} el
     * @return {HTMLElement|Boolean}
     */
    findDisplayObjectElement : function (el) {
        while (el && el.nodeType == 1) {
            if (this.isDisplayObjectElement(el) && el.parentNode === this._el) {
                return el;
            }
            
            el = el.parentNode;
        }
        
        return false;
    },
    
    /**
     * 표시 객체 엘리먼트인 경우
     * 
     * @deprecated
     * @private
     * @param {HTMLElement} el
     * @return {Boolean} 표시 객체 엘리먼트일 때 true
     */
    isDisplayObjectElement : function (el) {
        if ("classList" in el) {
            return el.classList.contains(collie.DisplayObjectDOM.CLASSNAME);
        } else {
            return (" " + el.className + " ").indexOf(" " + collie.DisplayObjectDOM.CLASSNAME + " ") > -1;
        }
    },
    
    /**
     * 현재 레이어 엘리먼트를 반환
     * 
     * @private
     * @return {HTMLElement}
     */
    getElement : function () {
        return this._el;
    },
    
    /**
     * 화면을 갱신
     * @private
     */
    clear : function () {
        return true;        
    },
    
    /**
     * 리사이즈
     * @private
     * @param {Number} nWidth 너비
     * @param {Number} nHeight 높이
     * @param {Boolean} bExpand 확장 여부
     */
    resize : function (nWidth, nHeight, bExpand) {
        if (bExpand) {
            var nRatioWidth = parseFloat(nWidth / this._oLayer.option("width")).toFixed(2);
            var nRatioHeight = parseFloat(nHeight / this._oLayer.option("height")).toFixed(2);
            this._oEvent.setEventRatio(nRatioWidth, nRatioHeight);
            this._el.style[collie.util.getCSSPrefix("transform-origin", true)] = "0 0";
            
            if (collie.util.getSupportCSS3d()) {
                this._el.style[collie.util.getCSSPrefix("transform", true)] = "scale3d(" + nRatioWidth + ", " + nRatioHeight + ", 1)";
            } else if (collie.util.getSupportCSS3()) {
                this._el.style[collie.util.getCSSPrefix("transform", true)] = "scale(" + nRatioWidth + ", " + nRatioHeight + ")";
            } else {
                // support IE, This method is very heavy.
                this._el.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11=" + nRatioWidth + ",M12=0,M21=0,M22=" + nRatioHeight + ");";
            }
        } else {
            this._el.style.width = nWidth + 'px';
            this._el.style.height = nHeight + 'px';
        }
    }
});