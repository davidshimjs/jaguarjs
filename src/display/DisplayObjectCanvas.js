/**
 * Canvas에 객체를 그릴 경우 사용할 Drawing 클래스
 * - 직접 사용되지 않는 클래스
 * 
 * @private
 * @class
 * @param {collie.DisplayObject} oDisplayObject
 */
collie.DisplayObjectCanvas = collie.Class(/** @lends collie.DisplayObjectCanvas.prototype */{
    $init : function (oDisplayObject) {
        this._oDisplayObject = oDisplayObject;
        this._bUseCache = false;
        this._oDebugHitArea = null;
        this._htEvent = {};
        this._oLayer = null;
        this._htInfo = this._oDisplayObject.get();
        this._bIsRetinaDisplay = null;
        
        // 캐시 사용
        if (this._htInfo.useCache) {
            this.loadCache();
        }
    },

    /**
     * 캔버스 캐시 사용
     * 
     * @private
     */
    loadCache : function () {
        if (!this._bUseCache) {
            this._bUseCache = true;
            this._elCache = document.createElement("canvas");
            this._elCache.width = this._htInfo.width;
            this._elCache.height = this._htInfo.height;
            this._oContextCache = this._elCache.getContext("2d");
        }
    },
    
    /**
     * 캔버스 버퍼 해제
     * @private
     */
    unloadCache : function () {
        if (this._bUseCache) {
            this._oContextCache = null;
            this._elCache = null;
            this._bUseCache = false;
        }
    },

    /**
     * 버퍼를 비움
     * @private
     */
    clearCache : function () {
        if (this._bUseCache) {
            this._oContextCache.clearRect(0, 0, this._elCache.width, this._elCache.height);
            this._elCache.width = this._htInfo.width * (this._bIsRetinaDisplay ? 2 : 1);
            this._elCache.height = this._htInfo.height * (this._bIsRetinaDisplay ? 2 : 1);
        }
    },
        
    /**
     * 이미지를 그린다
     * - 인자는 drawImage의 첫번째만 다른 인자
     * 직접 호출하지 않음
     * @private
     * @param {CanvasRenderingContext2D} oContext canvas Context
     * @param {Number} sx
     * @param {Number} sy
     * @param {Number} sw
     * @param {Number} sh
     * @param {Number} dx
     * @param {Number} dy
     * @param {Number} dw
     * @param {Number} dh
     */
    drawImage : function (oContext, sx, sy, sw, sh, dx, dy, dw, dh) {
        var oSource = this._oDisplayObject.getImage();
        var nImageWidth = this._oDisplayObject._nImageWidth; //TODO 임시
        var nImageHeight = this._oDisplayObject._nImageHeight;
        
        // 레티나 디스플레이일 경우 두배씩 증가
        if (collie.Renderer.isRetinaDisplay()) {
            for (i = 1, len = arguments.length; i < len; i++) {
                arguments[i] *= 2;
            }
            
            nImageWidth *= 2;
            nImageHeight *= 2;
        }
        
        try {
            oContext.drawImage(oSource, sx, sy, sw, sh, dx, dy, dw, dh);
        } catch (e) {
            throw new Error('invalid drawImage value : ' + sx + ',' + sy + ',' + sw + ',' + sh + ',' + dx + ',' + dy + ',' + dw + ',' + dh + ',' + this._oDisplayObject.getImage().src + ', original : ' + this._oDisplayObject.getImage().width + ',' + this._oDisplayObject.getImage().height + ',source : ' + oSource.width + ',' + oSource.height + ', isCached : ' + (this._elImageCached !== null ? 'true' : 'false'));
        }
    },
    
    /**
     * Layer에 붙을 때 실행
     * 
     * @private
     */
    load : function () {
        this._oLayer = this._oDisplayObject.getLayer();
        this._oContext = this._oDisplayObject.getLayer().getContext();
        this._bIsRetinaDisplay = collie.Renderer.isRetinaDisplay();
    },
    
    /**
     * Layer에서 빠질 때
     * 
     * @private
     */
    unload : function () {
        this._oLayer = null;
        this._oContext = null;
    },
    
    /**
     * 그리기
     * 
     * @param {Number} nFrameDuration 진행된 프레임 시간
     * @param {Number} nX 객체의 절대 x좌표
     * @param {Number} nY 객체의 절대 y좌표
     * @param {Number} nLayerWidth 레이어 너비, update는 tick안에 있는 로직이기 때문에 성능 극대화를 위해 전달
     * @param {Number} nLayerHeight 레이어 높이 
     * @param {Object} oContext Canvas Context, 없으면 기본 Context를 사용. 부모의 버퍼 Context를 물려 받을 때 사용
     * @private
     */
    draw : function (nFrameDuration, nX, nY, nLayerWidth, nLayerHeight, oContext) {
        var bUseParentContext = oContext ? true : false;
        oContext = oContext || this._oContext;
        var oTargetContext = this._bUseCache ? this._oContextCache : oContext; 
        var oParentContext = oContext;
        var htInfo = this._htInfo;
        var htDirty = this._oDisplayObject.getDirty();
        var htOrigin = this._oDisplayObject.getOrigin();
        var nTargetWidth = htInfo.width; 
        var nTargetHeight = htInfo.height;
        var nOriginX = htOrigin.x;
        var nOriginY = htOrigin.y;
        var nSavedX = nX;
        var nSavedY = nY;
        var nRatio = (this._bIsRetinaDisplay ? 2 : 1);
        var nSavedXRatio = nX * nRatio;
        var nSavedYRatio = nY * nRatio;
        var nSavedOpacity = 0;
        var bUseTransform = false;
        var oTransformContext = oContext;
        
        // 캐시를 사용 중이면 oContext 값을 자신의 버퍼로 변경
        if (htInfo.useCache) {
            oContext = this._oContextCache;
        }
        
        // 레티나 디스플레이 대응
        if (this._bIsRetinaDisplay) {
            nX *= 2;
            nY *= 2;
            nOriginX *= 2;
            nOriginY *= 2;
            nTargetWidth *= 2;
            nTargetHeight *= 2; 
        }
        
        // transform 값을 써야할 경우에만 사용
        if (this._bUseCache || htInfo.scaleX !== 1 || htInfo.scaleY !== 1 || htInfo.angle !== 0 || htInfo.opacity !== 1) {
            bUseTransform = true;
            
            if (this._bUseCache) {
                oTransformContext = !bUseParentContext ? this._oContext : oParentContext;
            }
            
            oTransformContext.save();
            oTransformContext.translate(nX + nOriginX, nY + nOriginY);
        
            if (htInfo.opacity !== 1) {
                nSavedOpacity = oTransformContext.globalAlpha;
                oTransformContext.globalAlpha = oTransformContext.globalAlpha === 0 ? htInfo.opacity : oTransformContext.globalAlpha * htInfo.opacity;
            }
            
            if (htInfo.angle !== 0) {
                oTransformContext.rotate(collie.util.toRad(htInfo.angle));
            }
            
            if (htInfo.scaleX !== 1 || htInfo.scaleY !== 1) {
                oTransformContext.scale(htInfo.scaleX, htInfo.scaleY);
            }
            
            oTransformContext.translate(-nOriginX, -nOriginY);
            nX = nY = 0;
        }
        
        // 이벤트 객체 재사용
        this._htEvent.displayObject = this;
        this._htEvent.context = oTargetContext;
        this._htEvent.x = nX;
        this._htEvent.y = nY;
        
        // 캐시를 사용하지 않거나 변경되었을 때만 처리
        if (!this._bUseCache || (this._oDisplayObject.isChanged() && !this._oDisplayObject.isChanged(true))) {
            // 캐시 그리기 전에 비워줌
            this.clearCache();
            
            // 배경색 처리
            if (htInfo.backgroundColor) {
                oTargetContext.fillStyle = htInfo.backgroundColor;
                oTargetContext.fillRect(nX, nY, nTargetWidth, nTargetHeight);
            }
            
            if (this._oDisplayObject.getImage()) {
                var elSourceImage = this._oDisplayObject.getImage();
                var htImageSize = this._oDisplayObject.getImageSize();
                
                // 반복 처리
                if (htInfo.backgroundRepeat && htInfo.backgroundRepeat !== 'no-repeat') {
                    var nCountWidth = (htInfo.backgroundRepeat === 'repeat' || htInfo.backgroundRepeat === 'repeat-x') ? Math.ceil(htInfo.width / htImageSize.width) : 1;
                    var nCountHeight = (htInfo.backgroundRepeat === 'repeat' || htInfo.backgroundRepeat === 'repeat-y') ? Math.ceil(htInfo.height / htImageSize.height) : 1;
                    
                    // 이미지 반복 처리
                    if (nCountWidth > 0 || nCountHeight > 0) {
                        for (var nLeftOffset = 0; nLeftOffset < nCountWidth; nLeftOffset++) {
                            for (var nTopOffset = 0; nTopOffset < nCountHeight; nTopOffset++) {
                                var nOffsetX = nLeftOffset * htImageSize.width + htImageSize.width;
                                var nOffsetY = nTopOffset * htImageSize.height + htImageSize.height;
                                var nPieceWidth = nOffsetX > htInfo.width ? htImageSize.width - (nOffsetX - htInfo.width) : htImageSize.width;
                                var nPieceHeight = nOffsetY > htInfo.height ? htImageSize.height - (nOffsetY - htInfo.height) : htImageSize.height;
                                
                                this.drawImage(
                                    oTargetContext,
                                    0,
                                    0,
                                    nPieceWidth,
                                    nPieceHeight,
                                    (nX / nRatio) + nLeftOffset * htImageSize.width,
                                    (nY / nRatio) + nTopOffset * htImageSize.height,
                                    nPieceWidth,
                                    nPieceHeight
                                );
                            }
                        }
                    }
                } else {
                    var nDrawingWidth = Math.min(htImageSize.width, htInfo.width);
                    var nDrawingHeight = Math.min(htImageSize.height, htInfo.height);
                    
                    //TODO 사이트 이펙트 디바이스 테스트 해야 함 1.0.8
                    this.drawImage(
                        oTargetContext,
                        htInfo.offsetX,
                        htInfo.offsetY,
                        htInfo.fitImage ? htImageSize.width : nDrawingWidth,
                        htInfo.fitImage ? htImageSize.height : nDrawingHeight,
                        nX / nRatio, //TODO floating value 어떻게 해야할까... 처리하면 계단현상 생김
                        nY / nRatio,
                        htInfo.fitImage ? htInfo.width : nDrawingWidth,
                        htInfo.fitImage ? htInfo.height : nDrawingHeight
                    );
                }
            }
            
            /**
             * If you define this method in your class, A DisplayObject will run this method when drawing an object with canvas rendering mode.
             * @name collie.DisplayObject#onCanvasDraw
             * @delegate
             * @param {Object} htEvent
             * @param {collie.DisplayObject} htEvent.displayObject
             * @param {Object} htEvent.context 캔버스 Context 객체
             * @param {Number} htEvent.x 상대 x좌표
             * @param {Number} htEvent.y 상대 y좌표
             */
            if ("onCanvasDraw" in this._oDisplayObject) {
                this._oDisplayObject.onCanvasDraw(this._htEvent);
            }
        }
        
        // hitArea 그리기
        if (htInfo.debugHitArea && htInfo.hitArea) {
            if (this._oDebugHitArea === null) {
                this._oDebugHitArea = new collie.Polyline({
                    x : 0,
                    y : 0,
                    width : htInfo.width,
                    height : htInfo.height,
                    strokeColor : htInfo.debugHitArea === true ? "yellow" : htInfo.debugHitArea,
                    strokeWidth : 3
                }).addTo(this._oDisplayObject);
                this._oDebugHitArea.setPointData(htInfo.hitArea);
            }
        }
        
        // 자식에게 전파
        // 부모에게서 Context를 물려 받았거나, 자신이 useCache를 사용하고 있다면 자식에게 Context를 물려줌. 부모의 설정이 우선시 됨
        if (this._oDisplayObject.hasChild() && (!htInfo.useCache || (this._oDisplayObject.isChanged() && !this._oDisplayObject.isChanged(true)))) {
            var aDisplayObjects = this._oDisplayObject.getChildren();
            
            for (var i = 0, len = aDisplayObjects.length; i < len; i++) {
                aDisplayObjects[i].update(
                    nFrameDuration,
                    // 0,
                    // 0,
                    // htInfo.useCache ? 0 : nSavedX, // cache를 사용하면 현재 기준으로 절대 좌표를 넘김
                    // htInfo.useCache ? 0 : nSavedY,
                    htInfo.useCache || bUseTransform ? 0 : nSavedX, // cache를 사용하면 현재 기준으로 절대 좌표를 넘김
                    htInfo.useCache || bUseTransform ? 0 : nSavedY,
                    nLayerWidth,
                    nLayerHeight,
                    bUseParentContext || htInfo.useCache ? oContext : null
                );
                aDisplayObjects[i].unsetChanged();
                aDisplayObjects[i]._resetDirty();
            }
        }
        
        // 캐시 기능을 사용하면 자식까지 그린 후에 자기를 그림
        if (htInfo.useCache) {
            // (bUseParentContext ? oParentContext : this._oContext).drawImage(oContext.canvas, nSavedXRatio, nSavedYRatio);
            // (bUseParentContext ? oParentContext : this._oContext).drawImage(oContext.canvas, bUseParentContext ? nSavedXRatio : 0, bUseParentContext ? nSavedYRatio : 0);
            (bUseParentContext ? oParentContext : this._oContext).drawImage(oContext.canvas, 0, 0);
        }
        
        this._oLayer.drawCount++;

        // 원위치
        if (bUseTransform) {
            oTransformContext.restore();
        }
    }
});