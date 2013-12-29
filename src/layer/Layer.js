/**
 * A Layer contains many displayObjects.
 * In Canvas mode, one layer is one canvas element.
 * If you have been using just one canvas element, try to have a few layers. But not too many.
 * @class
 * @extends collie.Component
 * @param {Object} [htOption]
 * @param {Number} [htOption.width=320] (px) It only works when initialize this class. It's different from a set method in displayObject.
 * @param {Number} [htOption.height=480] (px)
 * @param {Number} [htOption.x=0] (px)
 * @param {Number} [htOption.y=0] (px)
 * @param {Boolean} [htOption.useEvent=true] Use event on this layer. If you want to improve performance of event, you can set this option as false.
 * @param {Boolean} [htOption.visible=true] Visibility
 * @param {Boolean} [htOption.freeze=false] A Layer will not updated more.
 * @param {Boolean} [htOption.renderingMode=inherit] You can use DOM mixed with Canvas to each layers. [inherit|dom|canvas]
 */
collie.Layer = collie.Class(/** @lends collie.Layer.prototype */{
    /**
     * Class name
     * @type {String}
     */
    type : "layer",
    
    $init : function (htOption) {
        this.option({
            x : 0,
            y : 0,
            width : 320,
            height : 480,
            useEvent : true,
            visible : true,
            freeze : false,
            renderingMode : "inherit"
        });
        
        // 정렬을 해야한다면 일단 0으로 만들어 놓고 load될 때 정렬함
        this._sAlignLeft = null;
        this._sAlignTop = null;
        
        if (htOption !== undefined) {
            if (("x" in htOption) && (htOption.x === "left" || htOption.x === "right" || htOption.x === "center")) {
                this._sAlignLeft = htOption.x;
                htOption.x = 0;
            }
             
            if (("y" in htOption) && (htOption.y === "top" || htOption.y === "bottom" || htOption.y === "center")) {
                this._sAlignTop = htOption.y;
                htOption.y = 0;
            }
            
            this.option(htOption);
        }
        
        this._renderingMode = this._htOption.renderingMode === "inherit" ? collie.Renderer.getRenderingMode() : this._htOption.renderingMode;
        
        if (this._renderingMode === "canvas" && !collie.util.getDeviceInfo().supportCanvas) {
            this._renderingMode = "dom";
        }
        
        this.drawCount = 0; // debugging 용 draw count
        this.optionSetter("visible", this._setVisible.bind(this)); // 처음 set은 Drawing이 생성된 후에 실행 된다
        this._elParent = null;
        this._bChanged = false;
        this._aDisplayObjects = [];
        this._bLoaded = false;
        this._oEvent = new collie.LayerEvent(this);
        this._makeDrawing();
        this._setVisible();
    },
    
    /**
     * 렌더링 방법을 선택해서 Drawing 객체를 생성 한다
     * @private
     */
    _makeDrawing : function () {
        this._oDrawing = this._renderingMode === "dom" ? new collie.LayerDOM(this) : new collie.LayerCanvas(this);
    },
    
    /**
     * Return a drawing instance.
     * @return {collie.LayerCanvas|collie.LayerDOM}
     */
    getDrawing : function () {
        return this._oDrawing;
    },
    
    /**
     * Return a rendering mode of a current layer
     * @return {String} [dom|canvas]
     */
    getRenderingMode : function () {
        return this._renderingMode;
    },
    
    /**
     * Return a event instance
     * @return {collie.LayerEvent}
     */
    getEvent : function () {
        return this._oEvent;
    },
    
    /**
     * Return a HTMLElement of a parent
     * @return {HTMLElement}
     */
    getParent : function () {
        return this._elParent || false;
    },
    
    /**
     * 컨테이너에 엘리먼트 추가. 렌더러에서 load할 때 실행 된다
     * - 로드할 때 가장 큰 레이어를 기준으로 컨테이너의 크기를 정함
     * 
     * @private
     * @param {HTMLElement} elParent
     * @param {Number} nZIndex
     */
    load : function (elParent, nZIndex) {
        this.unload();
        this._bLoaded = true;
        this._elParent = this._elParent || elParent;
        this._elParent.style.width = Math.max(parseInt(this._elParent.style.width || 0, 10), this.option("width")) + "px";
        this._elParent.style.height = Math.max(parseInt(this._elParent.style.height || 0, 10), this.option("height")) + "px";
        this.getElement().style.zIndex = nZIndex;
        
        // 생성자 옵션에 정렬이 포함돼 있으면 load, unload를 반복하더라도 정렬을 계속한다.
        // 하지만 사용자가 직접 offset을 사용하는 경우에는 reset되도록 세 번째 인자를 통해 조치한다.
        if (this._sAlignLeft !== null) {
            this.offset(this._sAlignLeft, null, true);
        }
        
        if (this._sAlignTop !== null) {
            this.offset(null, this._sAlignTop, true);
        }
        
        this._elParent.appendChild(this.getElement());
    },
    
    /**
     * @private
     */
    unload : function () {
        if (this.isLoaded()) {
            this._oEvent.detachEvent();
            this._elParent.removeChild(this.getElement());
            this._elParent = null;
            this._bLoaded = false;
        }
    },
    
    /**
     * Layer의 attach Event를 순서 조작을 위해 Layer가 하지 않고 Renderer가 한다
     * @private
     */
    attachEvent : function () {
        this._oEvent.attachEvent();
    },
    
    /**
     * Layer의 detach Event를 순서 조작을 위해 Layer가 하지 않고 Renderer가 한다
     * @private
     */
    detachEvent : function () {
        this._oEvent.detachEvent();
    },
    
    /**
     * CSS의 display 속성과 유사
     * @private
     */
    _setVisible : function () {
        // Drawing이 생성되기 전에 옵션이 설정될 수도 있음
        if (this.getElement()) {
            this.getElement().style.display = this.option("visible") ? "block" : "none";
        }
    },
    
    /**
     * @private
     * @return {Boolean} 로딩 되어있는지 여부
     */
    isLoaded : function () {
        return this._bLoaded;
    },
    
    /**
     * Add a displayObject on this layer
     * @param {collie.DisplayObject} oDisplayObject
     */
    addChild : function (oDisplayObject) {
        // 추가할 때마다 정렬하기
        collie.util.pushWithSort(this._aDisplayObjects, oDisplayObject);
        oDisplayObject.setLayer(this);
        this.setChanged();
    },
    
    /**
     * Add many displayObjects in one time
     * @param {Array} aList An Array to contain DisplayObjects
     */
    addChildren : function (aList) {
        for (var i = 0, len = aList.length; i < len; i++) {
            this.addChild(aList[i]);
        }
    },
    
    /**
     * Remove a displayObject from this layer
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Number} nIdx If you know an index of the displayObject, you can improve performance a little.
     */
    removeChild : function (oDisplayObject, nIdx) {
        oDisplayObject.unsetLayer();
        
        if (typeof nIdx !== "undefined") {
            this._aDisplayObjects.splice(nIdx, 1);
        } else {
            for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
                if (this._aDisplayObjects[i] === oDisplayObject) {
                    this._aDisplayObjects.splice(i, 1);
                    break;
                }
            }
        }
        
        this.setChanged();
    },
    
    /**
     * Remove displayObjects from this layer
     * @param {Array} aList An Array to contain DisplayObjects
     */
    removeChildren : function (aList) {
        for (var i = aList.length - 1; i >= 0; i--) {
            if (aList[i]) {
                this.removeChild(aList[i], i);
            }
        }
    },
    
    /**
     * Add layer to a Renderer(like a addTo method in DisplayObject)
     * @param {collie.Renderer} [oRenderer] A Renderer that will add a this layer. Default value is a collie.Rencerer. 
     * @return {collie.Layer} For method chaining
     * @example
     * before
     * ```
     * var layer = new collie.Layer();
     * collie.Renderer.addLayer(layer);
     * ```
     * after
     * ```
     * var layer = new collie.Layer().addTo();
     * ```
     */
    addTo : function (oRenderer) {
        oRenderer = oRenderer || collie.Renderer;
        oRenderer.addLayer(this);
        return this;
    },
    
    /**
     * zIndex가 변경되었다면 이 메소드를 호출
     * @private
     * @param {collie.DisplayObject} oDisplayObject
     */
    changeDisplayObjectZIndex : function (oDisplayObject) {
        this.removeChild(oDisplayObject);
        this.addChild(oDisplayObject);
    },
    
    /**
     * Return children that added to this layer
     * @return {Array}
     */
    getChildren : function () {
        return this._aDisplayObjects;
    },
    
    /**
     * Return a boolean value that is whether this layer has a child or not
     * @return {Boolean}
     */
    hasChild : function () {
        return this._aDisplayObjects && this._aDisplayObjects.length > 0;
    },
    
    /**
     * 변경된 사항이 있을 경우 DisplayObject에서 Layer에 setChanged를 해서 알린다. setChange된 레이어만 그리기 대상
     * @private
     */
    setChanged : function () {
        this._bChanged = true;
    },
    
    /**
     * If this layer needs to update display, It'll return value as true
     * @return {Boolean} true면 변경된 점 있음
     */
    isChanged : function () {
        return this._bChanged;
    },
    
    /**
     * 변경되지 않은 상태로 되돌린다
     * @private
     */
    unsetChanged : function () {
        this._bChanged = false;
    },
    
    /**
     * Return a Context2D instance
     * @return {Boolean|Object}
     */
    getContext : function () {
        return ("getContext" in this._oDrawing) ? this._oDrawing.getContext() : false;
    },
    
    /**
     * Return a HTMLElement of this layer
     * @return {HTMLElement}
     */
    getElement : function () {
        return ("getElement" in this._oDrawing) ? this._oDrawing.getElement() : false;
    },
    
    /**
     * Update children that added to this layer
     * 
     * @private
     * @param {Number} nFrameDuration 진행된 프레임 시간
     */
    update : function (nFrameDuration) {
        this.drawCount = 0;
        
        // 바뀐게 없으면 지나감
        if (!this.isChanged() || this.option("freeze")) {
            return;
        }
        
        this.clear();
        this.unsetChanged();
        var nWidth = this.option("width");
        var nHeight = this.option("height");
        
        // 등록된 객체 업데이트
        for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
            this._aDisplayObjects[i].update(nFrameDuration, 0, 0, nWidth, nHeight);
        }
    },
    
    /**
     * Clear a display. It only works with Canvas mode. 
     * 화면을 지운다. Canvas일 때만 작동
     */
    clear : function () {
        this._oDrawing.clear();
    },
    
    /**
     * Resize this layer
     * If you want to resize all of layers, you can use the resize method in Renderer.
     * @param {Number} nWidth
     * @param {Number} nHeight
     * @param {Boolean} bExpand If you want to resize contents in the layer, you should set this value as true
     * @see collie.Renderer#resize
     */ 
    resize : function (nWidth, nHeight, bExpand) {
        if (!bExpand) {
            this.option("width", nWidth || this._htOption.width);
            this.option("height", nHeight || this._htOption.height);
        }
        
        if (this._oDrawing) {
            this._oDrawing.resize(nWidth, nHeight, bExpand);
        }
        
        if (this._elParent) {
            this._elParent.style.width = Math.max(parseInt(this._elParent.style.width || 0, 10), nWidth || this.option("width")) + "px";
            this._elParent.style.height = Math.max(parseInt(this._elParent.style.height || 0, 10), nHeight || this.option("height")) + "px";
        }
        
        /**
         * Occur when this layer resized 
         * @event
         * @name collie.Layer#resize
         */
        this.fireEvent("resize");
    },
    
    /**
     * Change a coordinate of this layer.
     * 레이어의 부모의 크기는 등록된 레이어 중 가장 큰 레이어의 크기에 맞게 변경된다.
     * 
     * @param {Number|String} [nX] x좌표(px), left, right, center를 입력하면 Renderer의 크기 기준으로 정렬된다. 렌더러의 크기가 변하더라도 자동으로 움직이지 않는다.
     * @param {Number|String} [nY] y좌표(px), top, bottom, center를 입력하면 Renderer의 크기 기준으로 정렬된다. 렌더러의 크기가 변하더라도 자동으로 움직이지 않는다.
     * @param {Boolean} [bSkipResetInitAlign] private용 변수, 직접 쓰지 않는다.
     */
    offset : function (nX, nY, bSkipResetInitAlign) {
        var el = this.getElement();
        
        if (typeof nX !== "undefined" && nX !== null) {
            switch (nX) {
                case "left" :
                    nX = 0;
                    break;
                    
                case "right" :
                    nX = parseInt(this._elParent.style.width, 10) - this._htOption.width;
                    break;
                    
                case "center" :
                    nX = parseInt(this._elParent.style.width, 10) / 2 - this._htOption.width / 2;
                    break;
            }
            
            this.option("x", nX);
            el.style.left = nX + "px";
            
            if (!bSkipResetInitAlign) {
                this._sAlignLeft = null;
            }
        }
        
        if (typeof nY !== "undefined" && nY !== null) {
            switch (nY) {
                case "top" :
                    nY = 0;
                    break;
                    
                case "bottom" :
                    nY = parseInt(this._elParent.style.height, 10) - this._htOption.height;
                    break;
                    
                case "center" :
                    nY = parseInt(this._elParent.style.height, 10) / 2 - this._htOption.height / 2;
                    break;
            }
            
            this.option("y", nY);
            el.style.top = nY + "px";
            
            if (!bSkipResetInitAlign) {
                this._sAlignTop = null;
            }
        }
    },
    
    /**
     * 고민 중... 부모를 렌더러가 아닌 다른 엘리먼트에 붙이는 행위
     * 
     * @param {HTMLElement|String} elParent
     */
    setParent : function (elParent) {
        // string이면 엘리먼트를 구해 줌
        if (typeof elParent === "string") {
            elParent = document.getElementById(elParent);
        }
        
        if (this._bLoaded) {
            this._oEvent.detachEvent();
            this._elParent.removeChild(this.getElement());
            this._elParent = elParent;
            this._elParent.appendChild(this.getElement());
            this._oEvent.attachEvent();
        } else {
            this._elParent = elParent;
        }
    },
    
    /**
     * @private
     * @return {Object}
     */
    getParentPosition : function () {
        if (this._elParent !== null) {
            return this._elParent === collie.Renderer.getElement() ? collie.Renderer.getPosition() : collie.util.getPosition(this._elParent);
        }
    },
    
    /**
     * Clone a layer
     * 
     * @param {Boolean} bRecursive Whether clone a layer with displayObjects that added this layer or not
     * @return {collie.Layer}
     */
    clone : function (bRecursive) {
        var oLayer = new this.constructor(this._htOption);
        
        if (bRecursive && this._aDisplayObjects.length) {
            for (var i = 0, l = this._aDisplayObjects.length; i < l; i++) {
                this._aDisplayObjects[i].clone(true).addTo(oLayer);
            }
        }
        
        return oLayer;
    }
}, collie.Component);