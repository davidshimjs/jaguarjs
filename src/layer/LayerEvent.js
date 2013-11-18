/**
 * 레이어 이벤트 처리
 * 
 * @class collie.LayerEvent
 * @param {collie.Layer} oLayer
 */
collie.LayerEvent = collie.Class(/** @lends collie.LayerEvent.prototype */{
    /**
     * 클릭 탐지 값 (px)
     * TODO Androind에서는 반응이 느껴질 수 있으므로 수치를 크게 하는 것이 좋다. (약 12정도?)
     * @constant
     */
    THRESHOLD_CLICK : 7,

    /**
     * @constructs
     */
    $init : function (oLayer) {
        this._oLayer = oLayer;
        this._bHasTouchEvent = !!('ontouchstart' in window);
        this._fOnEvent = this._onEvent.bind(this);
        this._oMousedownObject = null;
        this._htEventRatio = {
            width : 1,
            height : 1
        };
        this._bAttached = false;
    },
    
    /**
     * @private
     */
    attachEvent : function () {
        var el = this._oLayer.getParent();
        
        if (this._bHasTouchEvent) {
            collie.util.addEventListener(el, "touchstart", this._fOnEvent);
            collie.util.addEventListener(el, "touchend", this._fOnEvent);
            collie.util.addEventListener(el, "touchmove", this._fOnEvent);
            collie.util.addEventListener(el, "touchcancel", this._fOnEvent);
        } else {
            collie.util.addEventListener(el, "mousedown", this._fOnEvent);
            collie.util.addEventListener(el, "mouseup", this._fOnEvent);
            collie.util.addEventListener(el, "mousemove", this._fOnEvent);
        }
        
        this._bAttached = true;
    },
    
    /**
     * @private
     */
    detachEvent : function () {
        var el = this._oLayer.getParent();
        
        if (this._bAttached) {
            if (this._bHasTouchEvent) {
                collie.util.removeEventListener(el, "touchstart", this._fOnEvent);
                collie.util.removeEventListener(el, "touchend", this._fOnEvent);
                collie.util.removeEventListener(el, "touchmove", this._fOnEvent);
                collie.util.removeEventListener(el, "touchcancel", this._fOnEvent);
            } else {
                collie.util.removeEventListener(el, "mousedown", this._fOnEvent);
                collie.util.removeEventListener(el, "mouseup", this._fOnEvent);
                collie.util.removeEventListener(el, "mousemove", this._fOnEvent);
            }
            
            this._bAttached = false;
        }
    },
    
    /**
     * 이벤트 핸들러
     * @private
     * @param {HTMLEvent} e
     */
    _onEvent : function (e) {
        // 이벤트를 사용하지 않으면 무시
        if (!this._oLayer._htOption.useEvent) {
            return;
        }
        
        e = e || window.event;
        var oEvent = this._bHasTouchEvent ? e.changedTouches[0] : e || window.event;
        var el =  this._bHasTouchEvent ? this._getEventTargetElement(e) : e.target || e.srcElement;
        var oDocument = el.ownerDocument || document;
        var oBody = oDocument.body || oDocument.documentElement;
        var nPageX = this._bHasTouchEvent ? oEvent.pageX : oEvent.pageX || oEvent.clientX + oBody.scrollLeft - oDocument.body.clientLeft;
        var nPageY = this._bHasTouchEvent ? oEvent.pageY : oEvent.pageY || oEvent.clientY + oBody.scrollTop - oDocument.body.clientTop;
        var sType = e.type;
        var oDisplayObject = null;
        
        // 이벤트가 일어난 곳의 상대 좌표를 계산
        var htPosition = this._oLayer.getParentPosition();
        var nRelatedX = nPageX - htPosition.x - this._oLayer._htOption.x;
        var nRelatedY = nPageY - htPosition.y - this._oLayer._htOption.y;
        nRelatedX = nRelatedX / this._htEventRatio.width;       
        nRelatedY = nRelatedY / this._htEventRatio.height;      
        
        if (sType === "touchcancel") {
            if (this._htEventStartPos !== null) {
                nRelatedX = this._htEventStartPos.x;
                nRelatedY = this._htEventStartPos.y;
            }
        }
        
        sType = this._convertEventType(sType);
        
        // 기본 액션을 멈춘다(isPreventDefault 상태일 때만)
        if (sType === "mousemove" || sType === "mousedown") {
            if (collie.Renderer.isPreventDefault()) {
                collie.util.stopEventDefault(e);
            }
        }
        
        // 좌표 기록
        //@TODO 객체 재 사용 해야 함
        if (sType === "mousedown") {
            this._htEventStartPos = {
                x : nRelatedX,
                y : nRelatedY
            };
        }

        // Layer 표현 방식대로 이벤트를 발생한다
        var bFiredEventOnTarget = this._fireEvent(e, sType, nRelatedX, nRelatedY);
        
        // 클릭 처리
        if (sType === "mouseup") {
            // 탐지 영역도 resize에 맞춰서 변경한다
            var nThresholdX = this.THRESHOLD_CLICK;
            var nThresholdY = this.THRESHOLD_CLICK;
            
            if (
                this._htEventStartPos &&
                this._htEventStartPos.x - nThresholdX <= nRelatedX &&
                nRelatedX <= this._htEventStartPos.x + nThresholdX &&
                this._htEventStartPos.y - nThresholdY <= nRelatedY &&
                nRelatedY <= this._htEventStartPos.y + nThresholdY
                ) {
                this._fireEvent(e, "click", nRelatedX, nRelatedY);
            }
            
            this._htEventStartPos = null;
        }
        
        // 이벤트 상태를 저장해서 다른 레이어에 표시객체 이벤트가 통과되지 않도록 방어한다
        collie.Renderer.setEventStatus(sType, bFiredEventOnTarget);
    },
    
    /**
     * 레이어에서 이벤트가 일어났을 때 표시 객체에 이벤트를 발생 시킨다
     * 
     * @param {Object} e 이벤트 원본
     * @param {String} sType 이벤트 타입, mouse 이벤트로 변형되서 들어온다
     * @param {Number} nX 이벤트가 일어난 상대좌표
     * @param {Number} nY 이벤트가 일어난 상대좌표
     * @return {Boolean} 표시 객체에 이벤트가 발생했는지 여부 
     * @private
     */
    _fireEvent : function (e, sType, nX, nY) {
        var oDisplayObject = null;
        var bIsNotStoppedBubbling = true;
        
        // 캔버스에서 이전 레이어에 객체에 이벤트가 일어났으면 다음 레이어의 객체에 전달되지 않는다
        if (sType !== "mousemove" && !collie.Renderer.isStopEvent(sType)) {
            var aDisplayObjects = this._oLayer.getChildren();
            oDisplayObject = this._getTargetOnHitEvent(aDisplayObjects, nX, nY);
            
            // mousedown일 경우 객체를 저장한다
            if (oDisplayObject) {
                bIsNotStoppedBubbling = this._bubbleEvent(oDisplayObject, sType, e, nX, nY);
                
                if (sType === "mousedown") {
                    this._setMousedownObject(oDisplayObject);
                }
                if (sType === "mouseup") {
                    this._unsetMousedownObject(oDisplayObject);
                }
            }
        }
        
        // mouseup 처리가 안된 경우 임의 발생
        if (sType === "mouseup" && this._getMousedownObject() !== null) {
            oDisplayObject = this._getMousedownObject();
            this._bubbleEvent(oDisplayObject, sType, e, nX, nY);
            this._unsetMousedownObject(oDisplayObject);
        }
        
        /**
         * click 이벤트, 모바일 환경일 때는 touchstart, touchend를 비교해서 좌표가 일정 이내로 움직였을 경우 click 이벤트를 발생한다d
         * @name collie.Layer#click
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 상대 x좌표
         * @param {Number} htEvent.y 상대 y좌표
         */
        /**
         * mousedown 이벤트, 모바일 환경일 때는 touchstart 이벤트도 해당 된다.
         * @name collie.Layer#mousedown
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 상대 x좌표
         * @param {Number} htEvent.y 상대 y좌표
         */
        /**
         * mouseup 이벤트, 모바일 환경일 때는 touchend 이벤트도 해당 된다.
         * @name collie.Layer#mouseup
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 상대 x좌표
         * @param {Number} htEvent.y 상대 y좌표
         */
        /**
         * mousemove 이벤트, 모바일 환경일 때는 touchmove 이벤트도 해당 된다.
         * @name collie.Layer#mouseup
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 상대 x좌표
         * @param {Number} htEvent.y 상대 y좌표
         */
        if (bIsNotStoppedBubbling) { // stop되면 Layer이벤트도 일어나지 않는다
            this._oLayer.fireEvent(sType, {
                event : e,
                displayObject : oDisplayObject,
                x : nX,
                y : nY
            });
        }
        
        return !!oDisplayObject;
    },
    
    /**
     * 이벤트 대상을 고른다
     * - 가장 위에 있는 대상이 선정되어야 한다
     * @private
     * @param {Array|collie.DisplayObject} vDisplayObject
     * @param {Number} nX 이벤트 상대 x 좌표
     * @param {Number} nY 이벤트 상대 y 좌표
     * @return {collie.DisplayObject|Boolean}
     */
    _getTargetOnHitEvent : function (vDisplayObject, nX, nY) {
        var oTargetObject = null;
        
        if (vDisplayObject instanceof Array) {
            for (var i = vDisplayObject.length - 1; i >= 0; i--) {
                // 자식부터
                if (vDisplayObject[i].hasChild()) {
                    oTargetObject = this._getTargetOnHitEvent(vDisplayObject[i].getChildren(), nX, nY);
                    
                    // 찾았으면 멈춤
                    if (oTargetObject) {
                        return oTargetObject;
                    }
                }

                // 본인도
                oTargetObject = this._getTargetOnHitEvent(vDisplayObject[i], nX, nY);
                
                // 찾았으면 멈춤
                if (oTargetObject) {
                    return oTargetObject;
                }
            }
        } else {
            return this._isPointInDisplayObjectBoundary(vDisplayObject, nX, nY) ? vDisplayObject : false;
        }
    },
    
    /**
     * 이벤트명 보정
     * 
     * @private
     * @param {String} sType 이벤트 타입
     * @return {String} 변환된 이벤트 타입
     */
    _convertEventType : function (sType) {
        var sConvertedType = sType;
        
        switch (sType) {
            case "touchstart" :
                sConvertedType = "mousedown";
                break;
                
            case "touchmove" :
                sConvertedType = "mousemove";
                break;
                
            case "touchend" :
            case "touchcancel" :
                sConvertedType = "mouseup";
                break;
                
            case "tap" :
                sConvertedType = "click";
                break;
        }
        
        return sConvertedType;
    },
    
    _getEventTargetElement : function (e) {
        var el = e.target;
        
        while (el.nodeType != 1) {
            el = el.parentNode;
        }
        
        return el;
    },
    
    /**
     * 이벤트 대상의 이벤트를 버블링으로 처리 한다
     * 
     * @private
     * @param {collie.DisplayObject} oDisplayObject 버블링 대상
     * @param {String} sType 이벤트명
     * @param {HTMLEvent} e
     * @param {Number} nX 이벤트 상대 x 좌표
     * @param {Number} nY 이벤트 상대 y 좌표
     * @param {collie.DisplayObject} oCurrentObject 이벤트 대상
     * @return {Boolean} 이벤트가 도중에 멈췄으면 false를 반환
     */
    _bubbleEvent : function (oDisplayObject, sType, e, nX, nY, oCurrentObject) {
        /**
         * click 이벤트, 모바일 환경일 때는 touchstart, touchend를 비교해서 좌표가 일정 이내로 움직였을 경우 click 이벤트를 발생한다d
         * @name collie.DisplayObject#click
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 이벤트 상대 x 좌표
         * @param {Number} htEvent.y 이벤트 상대 y 좌표
         */
        /**
         * mousedown 이벤트, 모바일 환경일 때는 touchstart 이벤트도 해당 된다.
         * @name collie.DisplayObject#mousedown
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 이벤트 상대 x 좌표
         * @param {Number} htEvent.y 이벤트 상대 y 좌표
         */
        /**
         * mouseup 이벤트, 모바일 환경일 때는 touchend 이벤트도 해당 된다.
         * @name collie.DisplayObject#mouseup
         * @event
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject 대상 객체
         * @param {Event} htEvent.event 이벤트 객체
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         * @param {Number} htEvent.x 이벤트 상대 x 좌표
         * @param {Number} htEvent.y 이벤트 상대 y 좌표
         */
        if (oDisplayObject.fireEvent(sType, { // stop() 하게 되면 버블링 멈춘다
            displayObject : oCurrentObject || oDisplayObject,
            event : e,
            x : nX,
            y : nY
        }) === false) {
            return false;
        }
        
        // 부모에 이벤트가 전달된다
        if (oDisplayObject.getParent() && !this._bubbleEvent(oDisplayObject.getParent(), sType, e, nX, nY, oDisplayObject)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * DisplayObject 범위 안에 PointX, PointY가 들어가는지 확인
     * 
     * @private
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Number} nPointX 확인할 포인트 X 좌표
     * @param {Number} nPointY 확인할 포인트 Y 좌표
     * @return {Boolean} 들어간다면 true
     */
    _isPointInDisplayObjectBoundary : function (oDisplayObject, nPointX, nPointY) {
        // 안보이는 상태거나 이벤트를 받지 않는다면 지나감
        if (
            !oDisplayObject._htOption.useEvent ||
            !oDisplayObject._htOption.visible ||
            !oDisplayObject._htOption.width ||
            !oDisplayObject._htOption.height ||
            (oDisplayObject._htOption.useEvent === "auto" && !oDisplayObject.hasAttachedHandler())
            ) {
            return false;
        }
        
        var htHitArea = oDisplayObject.getHitAreaBoundary();
        
        // 영역 안에 들어왔을 경우
        if (
            htHitArea.left <= nPointX && nPointX <= htHitArea.right &&
            htHitArea.top <= nPointY && nPointY <= htHitArea.bottom
        ) {
            // hitArea 설정이 없으면 사각 영역으로 체크
            if (!oDisplayObject._htOption.hitArea) {
                return true;
            } else {
                var htPos = oDisplayObject.getRelatedPosition();
                
                // 대상 Point를 상대 좌표로 변경
                nPointX -= htPos.x;
                nPointY -= htPos.y;
                
                // transform 적용
                var aHitArea = oDisplayObject._htOption.hitArea;
                aHitArea = collie.Transform.points(oDisplayObject, aHitArea);
                return this._isPointInPolygon(aHitArea, nPointX, nPointY);
            }
        }
        
        return false;
    },
    
    /**
     * 대상 Point가 폴리곤 안에 있는지 여부를 반환
     *
     * @private
     * @param {Array} 꼭지점 모음 [[x1, y1], [x2, y2], ... ]
     * @param {Number} nX 대상 점 x 좌표
     * @param {Number} nY 대상 점 y 좌표
     * @return {Boolean} true면 안에 있음
     */
    _isPointInPolygon : function (aVertices, nX, nY) {
        var bIntersects = false;
        
        for (var i = 0, j = aVertices.length - 1, len = aVertices.length; i < len; j = i++) {
            if (
                (aVertices[i][1] > nY) !== (aVertices[j][1] > nY) &&
                (nX < (aVertices[j][0] - aVertices[i][0]) * (nY - aVertices[i][1]) / (aVertices[j][1] - aVertices[i][1]) + aVertices[i][0])
            ) {
               bIntersects = !bIntersects;
            }
        }
        
        return bIntersects;
    },
    
    /**
     * mousedown 객체를 설정 한다
     * 이 객체를 설정하면 mouseup 이벤트가 나왔을 때 해당 객체에서 하지 않더라도 해당 객체에 mouseup을 일으켜준다
     * @param {collie.DisplayObject} oDisplayObject
     * @private
     */
    _setMousedownObject : function (oDisplayObject) {
        this._oMousedownObject = oDisplayObject;
    },
    
    /**
     * 지정된 mousedown 객체를 해제 한다. 같은 객체여야만 해제 된다
     * @private
     */
    _unsetMousedownObject : function (oDisplayObject) {
        if (this._oMousedownObject === oDisplayObject) {
            this._oMousedownObject = null;
        }
    },
    
    /**
     * mousedown 객체를 반환 한다
     * @private
     * @return {collie.DisplayObject}
     */
    _getMousedownObject : function () {
        return this._oMousedownObject;
    },
    
    /**
     * 이벤트 좌표 보정치를 설정 한다
     * 
     * @param {Number} nWidth
     * @param {Number} nHeight
     */
    setEventRatio : function (nWidth, nHeight) {
        this._htEventRatio.width = nWidth || this._htEventRatio.width;
        this._htEventRatio.height = nHeight || this._htEventRatio.height;
    },
    
    /**
     * 이벤트 좌표 보정치가 있다면 반환 한다
     * @private
     * @deprecated
     * @return {Object} htEventRatio
     * @return {Number} htEventRatio.width
     * @return {Number} htEventRatio.height
     */
    getEventRatio : function () {
        return this._htEventRatio;
    }
});