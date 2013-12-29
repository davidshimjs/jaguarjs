/**
 * Text
 * - 말줄임은 Canvas일 때만 된다. DOM은 미구현
 * @todo Text는 말줄임과 자동 줄바꿈 때문에 모바일에서 사용하면 굉장히 느리다. WebWorker를 쓸 수 있는지 확인해 봐야 할 것
 * @class
 * @extends collie.DisplayObject
 * @param {Object} [htOption]
 * @param {Object} [htOption.fontFamily='Arial'] 글꼴
 * @param {Object} [htOption.fontWeight=''] 스타일, bold 면 진하게
 * @param {Object} [htOption.fontSize=12] 크기 (px)
 * @param {Object} [htOption.fontColor='#000000'] 글꼴 색상
 * @param {Object} [htOption.lineHeight="auto"] 라인 간격 (px), auto면 자동으로 맞춰짐
 * @param {Object} [htOption.textAlign='left'] 텍스트 정렬  left, center, right
 * @param {Object} [htOption.padding="0 0 0 0"] 텍스트 패딩 (px) top right bottom left
 * @param {Object} [htOption.ellipsisMaxLine=0] 최대 라인 수. 라인 수를 넘을 경우 말줄임 함. (0이면 사용 안함)
 * @param {Object} [htOption.ellipsisString='...'] 말줄임 할 때 대체할 텍스트
 * @param {Object} [htOption.useEllipsis=false] 말줄임 사용 여부
 * @example
 * 기본적인 사용법
 * ```
 * var oText = new collie.Text({
 *  width : 100, // 너비와 높이를 반드시 지정해야 합니다.
 *  height : 100,
 *  x : 0,
 *  y : 0,
 *  fontColor : "#000000"
 * }).text("테스트 입니다");
 * ```
 */
collie.Text = collie.Class(/** @lends collie.Text.prototype */{
    $init : function (htOption) {
        this._sText = "";
        this.option({
            fontFamily : 'Arial', // 글꼴 스타일
            fontWeight : '', // bold
            fontSize : 12, // px
            fontColor : '#000000', // 글꼴 색상
            lineHeight : "auto", // 라인 간격, px null이면 auto면 자동
            textAlign : 'left', // 텍스트 정렬 left, center, right
            padding : "0 0 0 0", // 텍스트 패딩
            ellipsisMaxLine : 0, // 최대 라인 수. 지정하면 말줄임 함
            ellipsisString : '...', // 말줄임 텍스트
            useEllipsis : false, // 말줄임 사용 여부
            useCache : true // useCache 기본값 true
        }, null, true /* Don't overwrite options */);
        
        this._elText = null;
        this._nTextWidth = 0;
        this._nRatio = 1;
        this._aCallbackTextWidth = [];
    },
    
    _initElement : function () {
        if (this._elText === null) {
            this._elText = document.createElement("div");
            this._elText.style.display = "inline";
            this.getDrawing().getItemElement().appendChild(this._elText);
        }
    },
    
    /**
     * Delegate
     * @private
     */
    onCanvasDraw : function (oEvent) {
        this._nRatio = this._sRenderingMode === "canvas" && this._bRetinaDisplay ? 2 : 1;
        this._oContext = oEvent.context;
        var nMaxWidth = this._getMaxWidth();
        this._oContext.font = this._getFontText();
        this._oContext.fillStyle = this._htOption.fontColor;
        this._oContext.textBaseline = "top";
        this._fillTextMultiline(this._wordWrap(nMaxWidth).split("\n"), oEvent.x, oEvent.y);
        this._triggerGetTextWidth();
    },
    
    /**
     * Delegate
     * @private
     */
    onDOMDraw : function (oEvent) {
        this._initElement();
        var oDrawing = this.getDrawing();
        var el = oEvent.element;
        var sText = this._sText.replace(/\n/g, "<br />");
        var elStyle = el.style;
        elStyle.font = this._getFontText();
        elStyle.color = this._htOption.fontColor;
        elStyle.padding = this._getPadding().replace(/ /g, "px ") + "px";
        elStyle.width = this._getMaxWidth() + "px";
        elStyle.height = this._getMaxHeight() + "px";
        elStyle.lineHeight = this._getLineHeight() + "px";
        elStyle.textAlign = this._htOption.textAlign;
        
        if (this._elText.innerHTML != sText) {
            this._elText.innerHTML = sText;
        }
        
        this.unsetChanged();
        this._getDOMTextWidth();
        this._triggerGetTextWidth();
    },
    
    _getDOMTextWidth : function () {
        if (this._elText !== null) {
            this._nTextWidth = this._elText.offsetWidth;
        }
    },
    
    _getFontText : function () {
        return this._htOption.fontWeight + " " + (this._htOption.fontSize * this._nRatio) + "px " + this._htOption.fontFamily;
    },
    
    _getLineHeight : function () {
        return this._htOption.lineHeight === "auto" ? (this._htOption.fontSize * this._nRatio) : this._htOption.lineHeight * this._nRatio;
    },
    
    /**
     * 여러 줄의 텍스트를 연달아 쓴다
     * 
     * @private
     * @param {Array} aText 한 배열 당 한 줄
     */
    _fillTextMultiline : function (aText, nX, nY) {
        var nLeft = this._getPadding("left");
        var nMaxLine = this._htOption.ellipsisMaxLine;
        this._nTextWidth = 0;
        
        for (var i = 0; i < aText.length; i++) {
            if (nMaxLine && i >= nMaxLine - 1) {
                // 말줄임이 필요하면
                if (aText.length > nMaxLine) {
                    aText[i] = this._insertEllipsisText(aText[i]);
                    aText.splice(i + 1, aText.length - (i + 1)); // 멈춤
                }
            }
            
            var nTextWidth = this._oContext.measureText(aText[i]).width;
            
            if (this._htOption.textAlign === "center") {
                nLeft = this._getMaxWidth() / 2 - nTextWidth / 2 + this._getPadding("left");
            } else if (this._htOption.textAlign === "right") {
                nLeft = ((this._htOption.width * this._nRatio) - this._getPadding("right")) - nTextWidth;
            }
            
            this._oContext.fillText(aText[i], nX + nLeft, nY + this._getTopPosition(i + 1));
            this._nTextWidth = Math.max(this._nTextWidth, nTextWidth);
        }
    },
    
    _getMaxWidth : function () {
        return (this._htOption.width * this._nRatio) - (this._getPadding("left") + this._getPadding("right"));
    },
    
    _getMaxHeight : function () {
        return (this._htOption.height * this._nRatio) - (this._getPadding("top") + this._getPadding("bottom"));
    },
    
    /**
     * 시작 top 위치를 반환
     * 
     * @private
     * @param {Number} nLine 라인번호, 1부터 시작
     */
    _getTopPosition : function (nLine) {
        return this._getLineHeight() * (nLine - 1) + this._getPadding("top");
    },
    
    /**
     * 해당 포지션의 패딩 값을 반환한다
     * 
     * @param {String} sPositionName top, right, bottom, left, 값이 없으면 전체 문자열을 반환, 단위는 쓰지 않는다. px
     * @return {Number|String}
     * @private
     */
    _getPadding : function (sPositionName) {
        var sPadding = this._htOption.padding || "0 0 0 0";
        var aPadding = sPadding.split(" ");
        
        for (var i = 0, len = aPadding.length; i < len; i++) {
            aPadding[i] = parseInt(aPadding[i], 10) * this._nRatio;
        }
        
        switch (sPositionName) {
            case "top" :
                return aPadding[0];
                
            case "right" :
                return aPadding[1];
                
            case "bottom" :
                return aPadding[2];
                
            case "left" :
                return aPadding[3];
                
            default :
                return aPadding.join(" ");
        }
    },
    
    /**
     * 말줄임된 텍스트를 반환
     * @private
     */
    _insertEllipsisText : function (sText) {
        var nWidth = this._getMaxWidth();
        var sEllipsizedText = '';
        
        for (var i = sText.length; i > 0; i--) {
            sEllipsizedText = sText.substr(0, i) + this._htOption.ellipsisString;
            
            if (this._oContext.measureText(sEllipsizedText).width <= nWidth) {
                return sEllipsizedText;
            }
        }
        
        return sText;
    },
    
    /**
     * 자동 줄바꿈
     * - 재귀 호출
     *
     * @ignore
     * @param {Number} nWidth 줄바꿈 될 너비
     * @param {String} sText 텍스트, 재귀호출 되면서 나머지 길이의 텍스트가 들어간다
     * @return {String} 줄바꿈된 테스트
     */
    _wordWrap : function (nWidth, sText) {
        var sOriginalText = sText || this._sText;
        var nCount = 1;
        
        // 원본 문자가 없으면
        if (!sOriginalText) {
            return '';
        }
        
        sText = sOriginalText.substr(0, 1);
        
        // 첫자부터 시작해서 해당 너비까지 도달하면 자르기
        while (this._oContext.measureText(sText).width <= nWidth) {
            nCount++;
            
            // 더이상 못자르면 반환
            if (nCount > sOriginalText.length) {
                return sText;
            }
            
            // 자르기
            sText = sOriginalText.substr(0, nCount);
            
            // 줄바꿈 문자면 지나감
            if (sOriginalText.substr(nCount - 1, 1) === "\n") {
                break;
            }
        }
        
        nCount = Math.max(1, nCount - 1);
        sText = sOriginalText.substr(0, nCount);
        
        // 다음 문자가 줄바꿈문자면 지나감
        if (sOriginalText.substr(nCount, 1) === "\n") {
            nCount++;
        }
        
        // 뒤에 더 남아있다면 재귀 호출
        if (sOriginalText.length > nCount) {
            sText += "\n" + (this._wordWrap(nWidth, sOriginalText.substr(nCount)));
        }
        
        return sText;
    },
    
    /**
     * 텍스트를 쓴다
     * Write text
     * 
     * @param {String} sText 출력할 데이터 text data
     * @return {collie.Text} 메서드 체이닝을 위해 자기 자신을 반환. return self instance for method chaining
     */
    text : function (sText) {
        this._nTextWidth = 0;
        this._aCallbackTextWidth = [];
        this._sText = sText.toString();
        this.setChanged();
        return this;
    },
    
    /**
     * 텍스트 최대 너비를 반환, 그려지기 전에는 반환이 되지 않기 때문에 callback 함수를 넣어 그려진 후에 값을 받아올 수 있다
     * 콜백 함수 첫번째 인자가 너비 값
     * @param {Function} fCallback
     * @return {Number} 텍스트 최대 너비
     */
    getTextWidth : function (fCallback) {
        if (fCallback) {
            this._aCallbackTextWidth.push(fCallback);
        }
        
        if (this._nTextWidth) {
            this._triggerGetTextWidth();
            return this._nTextWidth / this._nRatio;
        }
    },
    
    _triggerGetTextWidth : function () {
        if (this._aCallbackTextWidth.length > 0) {
            for (var i = 0, len = this._aCallbackTextWidth.length; i < len; i++) {
                this._aCallbackTextWidth[i](this._nTextWidth / this._nRatio);
            }
            
            this._aCallbackTextWidth = [];
        }
    },
    
    /**
     * 문자열로 클래스 정보 반환
     * 
     * @return {String}
     */
    toString : function () {
        return "Text" + (this._htOption.name ? " " + this._htOption.name : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);