/**
 * DisplayObject의 DOM 표시 부분
 * @todo 갤럭시 넥서스 ICS에서 CSS3d rotate 사용 시 overflow boundary가 잘못되는 문제점이 있어서 그 부분만 css2d로 동작하도록 변경 했지만, 렌더링 속도가 2d, 3d 차이나는 버그가 남아 있음.
 * @private
 * @class collie.DisplayObjectDOM
 * @param {collie.DisplayObject} oDisplayObject
 */
collie.DisplayObjectDOM = collie.Class(/** @lends collie.DisplayObjectDOM.prototype */{
    /**
     * @private
     * @constructs
     */
    $init : function (oDisplayObject) {
        this._oDisplayObject = oDisplayObject;
        this._htInfo = this._oDisplayObject.get();
        this._oLayer = null;
        this._elImage = null;
        this._aTransformValue = [];
        this._sTransformValue = null;
        this._sTransform = collie.util.getCSSPrefix("transform", true);
        this._sOrigin = collie.util.getCSSPrefix("transform-origin", true);
        this._bSupportCSS3 = collie.util.getSupportCSS3();
        this._bSupportCSS3d = collie.util.getSupportCSS3d();
        this._bUseTransform = this._bSupportCSS3 || this._bSupportCSS3d;
        this._htDeviceInfo = collie.util.getDeviceInfo();
        this._bIsAndroid = !!this._htDeviceInfo.android;
        this._nAndroidVersion = this._htDeviceInfo.android;
        this._bIsIEUnder8 = this._htDeviceInfo.ie && this._htDeviceInfo.ie < 9;
        this._bUseTranslateZ = true;
        this._bIsRetinaDisplay = null;
        this._htEvent = {};
        this._oEmptyObject = {};
        this._sCacheTransformValue = null;
        this._initElement();
    },
    
    _initElement : function () {
        // container
        this._elContainer = document.createElement("div");
        this._elContainer.id = collie.DisplayObjectDOM.ID + this._oDisplayObject.getId() + (this._htInfo.name ? "_" + this._htInfo.name : "");
        this._elContainer.className = collie.DisplayObjectDOM.CLASSNAME;
        this._elContainerStyle = this._elContainer.style;
        this._elContainerStyle.position = "absolute";
        
        // IE의 경우 크기가 정해져 있지 않으면 filter가 정상적으로 작동하지 않음
        if (this._bIsIEUnder8) {
            this._elContainerStyle.width = this._htInfo.width + "px";
            this._elContainerStyle.height = this._htInfo.height + "px"; 
        }

        if (this._htInfo.useCache) {
            this._elContainerStyle.overflow = "hidden";
            this._elContainerStyle.width = this._htInfo.width + "px";
            this._elContainerStyle.height = this._htInfo.height + "px"; 
        }
        
        // element
        this._el = document.createElement("div");
        this._elStyle = this._el.style;
        
        if (this._bSupportCSS3d) {
            this._elStyle[this._sTransform] = "translateZ(0)";
        }
        
        this._elStyle.position = "absolute";
        this._elStyle.width = this._htInfo.width + "px";
        this._elStyle.height = this._htInfo.height + "px";
        this._elStyle.overflow = "hidden";
        this._elContainer.appendChild(this._el);
    },
        
    load : function () {
        this._oLayer = this._oDisplayObject.getLayer();
        
        // 부모가 있으면 부모 엘리먼트에 직접 붙임
        if (this._oDisplayObject.getParent()) {
            this._oDisplayObject.getParent().getDrawing().getElement().appendChild(this._elContainer);
        } else {
            this._oLayer.getElement().appendChild(this._elContainer);
        }
        
        this._bIsRetinaDisplay = collie.Renderer.isRetinaDisplay();
    },
    
    unload : function () {
        this._oLayer = null;
        this._elContainer.parentNode.removeChild(this._elContainer);
    },
    
    /**
     * 현재 객체의 엘리먼트를 반환
     * 
     * @return {HTMLElement}
     */
    getElement : function () {
        return this._elContainer;
    },
    
    /**
     * 현재 객체의 아이템 엘리먼트를 반환
     * 
     * @return {HTMLElement}
     */
    getItemElement : function () {
        return this._el;
    },
    
    /**
     * 그리기
     * 
     * @private
     * @param {Number} nFrameDuration 진행된 프레임 시간
     * @param {Number} nX 객체의 절대 x좌표
     * @param {Number} nY 객체의 절대 y좌표
     * @param {Number} nLayerWidth 레이어 너비, update는 tick안에 있는 로직이기 때문에 성능 극대화를 위해 전달
     * @param {Number} nLayerHeight 레이어 높이
     */
    draw : function (nFrameDuration, nX, nY, nLayerWidth, nLayerHeight) {
        // 객체 재사용
        this._htEvent.displayObject = this;
        this._htEvent.element = this._el;
        this._htEvent.x = nX;
        this._htEvent.y = nY;
        
        var htInfo = this._htInfo;
        var htDirty = this._oDisplayObject.getDirty() || this._oEmptyObject;
        var htOrigin = this._oDisplayObject.getOrigin();
        var nRatio = (this._bIsRetinaDisplay ? 2 : 1);
        
        if (htDirty.visible) {
            this._elContainerStyle.display = htInfo.visible ? "block" : "none";
        }
        
        if (htDirty.width) {
            this._elStyle.width = htInfo.width + "px";
            
            if (this._bIsIEUnder8) {
                this._elContainerStyle.width = htInfo.width + "px";
            }
        }
        
        if (htDirty.height) {
            this._elStyle.height = htInfo.height + "px";
        }
        
        if (htDirty.opacity) {
            if (this._bIsIEUnder8) {
                this._elContainerStyle.filter = "alpha(opacity=" + (htInfo.opacity * 100) + ")";
            } else {
                this._elContainerStyle.opacity = htInfo.opacity;
                
                // Androind 4.1 workaround
                // TODO Androind 4.2에서 없어졌는지 확인해봐야 함
                if (this._elImage && this._nAndroidVersion && this._nAndroidVersion >= 4.1) {
                    this._elImage.style.opacity = htInfo.opacity;
                }
            }
        }
        
        if (htDirty.zIndex) {
            this._elContainerStyle.zIndex = htInfo.zIndex;
        }
        
        if (htDirty.backgroundColor) {
            this._elStyle.backgroundColor = htInfo.backgroundColor;
        }
        
        // 이동
        // transform은 여러 항목을 동시에 사용하기 때문에 겹쳐도 계산해야 한다.
        // 하지만 직접 style에 접근하는 경우는 변경될 때에만 값에 접근해 reflow를 줄인다
        if (this._bUseTransform) {
            this._aTransformValue.push(this._makeTranslate(htInfo.x, htInfo.y, htInfo.zIndex));
        } else if (htDirty.x || htDirty.y) {
            this._elContainerStyle.left = htInfo.x + "px";
            this._elContainerStyle.top = htInfo.y + "px";
        }
        
        //48~49
        
        // origin 적용
        if (this._bUseTransform) {
            if (htDirty.originX || htDirty.originY || htDirty.width || htDirty.height) {
                this._elContainerStyle[this._sOrigin] = htOrigin.x + "px " + htOrigin.y + "px";
            }
            
            if (htInfo.angle !== 0) {
                this._aTransformValue.push("rotate", (this._bSupportCSS3d && !this._bIsAndroid ? "Z" : ""), "(", htInfo.angle, "deg) ");
            }
            
            // scale이 translate보다 나중에 되야 한다
            if (htInfo.scaleX !== 1 || htInfo.scaleY !== 1) {
                this._aTransformValue.push("scale(", htInfo.scaleX, ", ", htInfo.scaleY, ") ");
            }
        }
        
        //46~47
        if (this._bUseTransform) {
            this._applyTransform();
        }
        
        //24
        this._drawImage(htInfo, htDirty);
        
        /**
         * If you define this method in your class, A DisplayObject will run this method when drawing an object with DOM rendering mode.
         * @name collie.DisplayObject#onDOMDraw
         * @delegate
         * @param {Object} htEvent
         * @param {collie.DisplayObject} htEvent.displayObject
         * @param {HTMLElement} htEvent.element 현재 엘리먼트
         * @param {Number} htEvent.x 객체의 절대 x 좌표
         * @param {Number} htEvent.y 객체의 절대 y 좌표
         */
        if ("onDOMDraw" in this._oDisplayObject) {
            this._oDisplayObject.onDOMDraw(this._htEvent);
        }
        
        this._oLayer.drawCount++;
    },
    
    /**
     * 이미지와 관련된 작업을 수행
     * 
     * @private
     */
    _drawImage : function (htInfo, htDirty) {
        var elSourceImage = this._oDisplayObject.getImage();
        var bUseRepeat = htInfo.backgroundRepeat && htInfo.backgroundRepeat !== 'no-repeat';
        var nImageWidth = 0;
        var nImageHeight = 0;
        
        // 이미지 늘리기
        if (this._oDisplayObject._htOption.fitImage) {
            nImageWidth = this._oDisplayObject._htOption.width;
            nImageHeight = this._oDisplayObject._htOption.height;
        } else {
            var htImageSize = this._oDisplayObject.getImageSize();
            nImageWidth = htImageSize.width;
            nImageHeight = htImageSize.height;
        }
        
        // CSSText를 쓰면 Dirty는 빼야 한다
        if (htDirty.backgroundImage || htDirty.backgroundRepeat) {
            
            // android trasnform에서 엘리먼트를 지우면 깜빡거림, 최대한 재사용 함
            if (this._elImage !== null && (!htInfo.backgroundImage || (htInfo.backgroundRepeat && htInfo.backgroundRepeat !== "no-repeat"))) {
            // if (this._elImage !== null) {
                this._el.removeChild(this._elImage);
                this._elImage = null;
            }
            
            if (htInfo.backgroundImage && elSourceImage) {
                if (!bUseRepeat && htInfo.backgroundImage) {
                    var elImageStyle;
                    
                    if (this._elImage === null) {
                        // android 3d trasnforms 버그 때문에 div로 감쌈
                        this._elImage = elSourceImage.cloneNode();
                        elImageStyle = this._elImage.style;
                        elImageStyle.position = "absolute";
                        elImageStyle.top = 0;
                        elImageStyle.left = 0;
                        elImageStyle.width = nImageWidth + "px";
                        elImageStyle.height = nImageHeight + "px";
                        elImageStyle.visibility = "visible";
                        
                        // Androind 4.1 workaround
                        // TODO Androind 4.2에서 없어졌는지 확인해봐야 함
                        if (this._nAndroidVersion && this._nAndroidVersion >= 4.1) {
                            elImageStyle.opacity = htInfo.opacity;
                        }
                        
                        if (this._bSupportCSS3d && this._bUseTranslateZ) {
                            elImageStyle[this._sTransform] = "translateZ(0)";
                        }
                        
                        if (this._el.hasChildNodes()) {
                            this._el.insertBefore(this._elImage, this._el.childNodes[0]);
                        } else {
                            this._el.appendChild(this._elImage);
                        }
                    } else {
                        this._elImage.src = elSourceImage.src;
                        elImageStyle = this._elImage.style;
                        elImageStyle.width = nImageWidth + "px";
                        elImageStyle.height = nImageHeight + "px";
                        elImageStyle.visibility = "visible";
                    }
                } else if (bUseRepeat) {
                    this._elStyle.backgroundImage = 'url("' + elSourceImage.src + '")';             
                    this._elStyle.backgroundRepeat = htInfo.backgroundRepeat;
                }
            }
        }
        
        if (htInfo.backgroundImage && this._elImage !== null) {
            // 레티나 이미지 처리
            if (this._bIsRetinaDisplay && bUseRepeat && (htDirty.width || htDirth.height || htDirty.backgroundRepeat || htDirty.backgroundImage)) {
                this._elStyle.backgroundSize = htInfo.width + "px " + htInfo.height + "px";
            }
            
            if (htDirty.offsetX || htDirty.offsetY) {
                if (this._bUseTransform) {
                    this._elImage.style[this._sTransform] = this._makeTranslate(-htInfo.offsetX, -htInfo.offsetY, 1);
                } else {
                    this._elImage.style.left = -htInfo.offsetX + "px";
                    this._elImage.style.top = -htInfo.offsetY + "px";
                }
            }
        }
    },
        
    /**
     * translate 구문 생성, 2d, 3d를 구분해서 생성한다
     * 
     * @private
     * @param {Number} nX
     * @param {Number} nY
     * @param {Number} nZ
     * @return {String} transform에 입력할 translate 값
     */
    _makeTranslate : function (nX, nY, nZ) {
        var sTranslate = '';
        var bUseCSS3d = (this._htInfo.angle !== 0 && this._bIsAndroid) ? false : this._bSupportCSS3d;
        // getAngle
        
        if (bUseCSS3d) {
            sTranslate = "translate3d(" + nX + "px, " + nY + "px, " + nZ + "px) ";
        } else if (this._bSupportCSS3) {
            sTranslate = "translate(" + nX + "px, " + nY + "px) ";
        }
        
        return sTranslate;
    },
    
    /**
     * 누적된 transform 속성을 적용한다
     * @private
     */
    _applyTransform : function () {
        var sValue = this._aTransformValue.join("");
        
        if (this._sCacheTransformValue !== sValue) {
            this._elContainerStyle[this._sTransform] = sValue;
            this._sCacheTransformValue = sValue;
            
            if (this._bIsAndroid && this._bUseTranslateZ && this._htInfo.angle !== 0) {
                this._elStyle[this._sTransform] = "";
                
                if (this._elImage) {
                    this._oDisplayObject.setChanged();
                }
                
                this._bUseTranslateZ = false;
            } else if (!this._bUseTranslateZ && (this._htInfo.angle === 0 || !this._bIsAndroid) && this._bSupportCSS3d) {
                this._elStyle[this._sTransform] = "translateZ(0)";
                
                if (this._elImage) {
                    this._oDisplayObject.setChanged();
                }
                
                this._bUseTranslateZ = true;
            }
        }
        
        this._aTransformValue = [];
    }
}, collie.Component);

/**
 * 엘리먼트 클래스 이름
 * @constants
 * @memberOf collie.DisplayObjectDOM
 */
collie.DisplayObjectDOM.CLASSNAME = "_collie_displayObject";
        
/**
 * 엘리먼트 아이디 prefixt
 * @constants
 * @memberOf collie.DisplayObjecDOM
 */
collie.DisplayObjectDOM.ID = "_collie_displayObject_";