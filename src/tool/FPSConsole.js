/**
 * 렌더러 측정 정보를 보여주는 도구
 * - FPSConsole을 사용시 애니메이션 속도에 영향을 줄 수 있습니다.
 * @param {Object} htOption
 * @param {String} [htOption.color="gray"] 콘솔 폰트 색상
 * @param {Number} [htOption.left=0] 콘솔 left 위치
 * @param {Number} [htOption.top=0] 콘솔 top 위치
 * @param {Number} [htOption.interval=60] 갱신 주기 (단위는 s)
 * @param {Boolean} [htOption.visible=true] 콘솔을 화면에 표시 여부
 * @param {Number} [htOption.start=0] 콘솔 자료 수집 시작 시점(frame)
 * @param {Number} [htOption.limit=0] 렌더링할 프레임 수(0이면 임의로 멈추지 않는다)
 * @param {Boolean} [htOption.useConsole=false] 콘솔을 화면에 표시 안할 때 window.console에 표시할지 여부
 * @param {Boolean} [htOption.useDrawingCount=false] 레이어에서 몇 번이나 draw가 일어났는지 확인
 * @example
 * var oConsole = new collie.FPSConsole().load();
 * oConsole.add("test", "testValue", "testTitle"); // Add a custom data
 * collie.Renderer.start();
 * @requires collie.tool.js
 * @extends collie.Component
 * @class
 */
collie.FPSConsole = collie.Class(/** @lends collie.FPSConsole.prototype */{
    $init : function (htOption) {
        this.option({
            color : 'gray',
            left : 10,
            top : 10,
            useConsole : false,
            useDrawingCount : false,
            visible : true,
            limit : 0,
            start : 0,
            interval : 60
        });
        
        
        if (typeof htOption !== "undefined") {
            this.option(htOption);
        }
        
        this._elContainer = null;
        this._elParent = null;
        this._aList = [];
        this._bLoaded = false;
        this._bStart = false;
        this._nWidth = 100;
        this._nHeight = 13;
        this._nPadding = 2;
        this._nLastUpdatedFrame = 0;
        this._htData = {};
        this._htInfo = {};
        this._htFPS = {
            average : 0,
            min : null,
            max : null,
            total : 0,
            count : 0
        };

        this._htEvent = {
            process : this._onProcess.bind(this),
            stop : this._onProcess.bind(this)
        };
        
        this.optionSetter("visible", function (value) {
            if (!value) {
                this._elContainer.style.display = "none";
            } else {
                this._elContainer.style.display = "block";
            }
        }.bind(this));
        
        this._initElement();
    },
    
    /**
     * @private
     */
    _initElement : function () {
        this._elContainer = document.createElement("ul");
        this._elContainer.id = "__collie_fpsconsole";
        this._elContainer.style.position = "absolute";
        this._elContainer.style.top = this.option("top") + "px";
        this._elContainer.style.left = this.option("left") + "px";
        this._elContainer.style.margin = "0";
        this._elContainer.style.padding = "0";
        this._elContainer.style.width = this._nWidth + "px";
        this._elContainer.style.height = this._nHeight + "px";
        this._elContainer.style.font = "bold 0.75em Helvetica";
        this._elContainer.style.color = this.option("color");
        this._elContainer.style.zIndex = 9999;
        this._elContainer.style.display = (this.option("console") ? 'none' : 'block');
        
        // 기본 2개 엘리먼트
        this.add("fps", 0, "FPS");
        this.add("mode", "");
    },
    
    /**
     * FPSConsole을 로드 한다
     * 
     * @param {HTMLElement|String} elParent console을 붙일 엘리먼트, 없으면 document.body에 붙는다.
     * @return {collie.FPSConsole}
     */
    load : function (elParent) {
        if (typeof elParent === "string") {
            elParent = document.getElementById(elParent);
        }
        
        if (typeof elParent !== "undefined") {
            this._elParent = elParent;
            this._elParent.appendChild(this._elContainer);
        }
        
        collie.Renderer.attach(this._htEvent);
        this._bLoaded = true;
        return this;
    },
    
    /**
     * FPSConsole을 unload한다
     * 
     * @return {collie.FPSConsole}
     */
    unload : function () {
        if (this._bLoaded) {
            if (this._elParent !== null) {
                this._elParent.removeChild(this._elContainer);
                this._elParent = null;
            }
            
            collie.Renderer.detach(this._htEvent);
            this._bLoaded = false;
            this._bStart = false;
        }
        
        return this;
    },
    
    /**
     * Console 엘리먼트를 반환
     * @return {HTMLElement}
     */
    getElement : function () {
        return this._elContainer;
    },
    
    /**
     * Add a new data for display in the FPSConsole list.
     * 
     * @param {String} sName For handling value of a new data. It's used in the change method.
     * @param {Variable} vValue
     * @param {String} [sTitle] The Title for a new data is optional.
     * @return {collie.FPSConsole} For method chaining
     * @example
     * var oConsole = new FPSConsole({
     *  color : "#fff"
     * }).load();
     * 
     * oConsole.add("test", "testValue", "testTitle"); // It looks like "<b>testTitle</b> testValue" 
     */
    add : function (sName, vValue, sTitle) {
        if (sName in this._htOption) {
            throw new Error("Exists data name in FPSConsole");
            return false;
        }
 
        var el = document.createElement("li");
        el.style.listStyleType = "none";
        el.style.height = this._nHeight + "px";
        el.style.paddingTop = this._nPadding + "px";
        el.innerHTML = (typeof sTitle !== "undefined" ? "<b>" + sTitle + ":</b> " : "");
        
        var elContent = document.createElement("span");
        elContent.style.fontWeight = "bold";
        elContent.innerHTML = vValue;
        el.appendChild(elContent);
        this._elContainer.appendChild(el);
        var nLength = this._aList.push({
            name : sName,
            value : vValue,
            element : elContent
        });
        
        this._elContainer.style.height = (nLength * this._nHeight) + "px";
        this._htData[sName] = nLength - 1;
        return this;
    },
    
    /**
     * 추가한 값을 변경
     * 
     * @param {String} sName
     * @param {Variable} vValue
     */
    change : function (sName, vValue) {
        if (typeof this._htData[sName] !== "undefined") {
            var htContent = this._aList[this._htData[sName]];
            htContent.value = vValue;
            htContent.element.innerHTML = vValue;
        }
    },
    
    /**
     * @private
     */
    _onProcess : function (oEvent) {
        if (this._htOption.start > oEvent.frame) {
            return;
        }
        
        // 처음 시작할 때
        if (!this._bStart) {
            if (this._elParent === null) {
                this._elParent = collie.Renderer.getElement();
                this._elParent.appendChild(this._elContainer);
            }
            
            this.change("mode", this._setMode());
            this._bStart = true;
        }
        
        this._setValue(oEvent, oEvent.type === "stop");
        
        if (this._htOption.limit && oEvent.frame > this._htOption.limit) {
            collie.Renderer.stop();
        }
    },
    
    /**
     * @private
     */
    _setMode : function () {
        var sMode = collie.Renderer.getRenderingMode() + (collie.Renderer.isRetinaDisplay() ? "(retina)" : "");
        sMode = sMode.toUpperCase();
        return sMode; 
    },
    
    _setFPS : function () {
        return this._htInfo.fps;
    },
    
    /**
     * @private
     * @param {Object} htInfo
     * @param {Boolean} bForceView 조건이 충족되지 않아도 view에 표시한다
     */
    _setValue : function (htInfo, bForceView) {
        this._htInfo.frame = htInfo.frame;
        this._htInfo.skippedFrame = htInfo.skippedFrame;
        this._htInfo.fps = htInfo.fps;
        this._htInfo.renderingTime = htInfo.renderingTime;
        this._htFPS.total += htInfo.fps;
        this._htFPS.count++;
        this._htInfo.fpsAverage = Math.round((this._htFPS.total / this._htFPS.count) * 100) / 100;
        this._htInfo.fpsMin = this._htFPS.min = this._htFPS.min !== null ? Math.min(this._htFPS.min, htInfo.fps) : htInfo.fps;
        this._htInfo.fpsMax = this._htFPS.max = this._htFPS.max !== null ? Math.max(this._htFPS.max, htInfo.fps) : htInfo.fps;

        // stop된 경우
        if (this._nLastUpdatedFrame > htInfo.frame) {
            this._nLastUpdatedFrame = 0;
        }
        
        if (bForceView || this._nLastUpdatedFrame + this._htOption.interval <= htInfo.frame) {
            this._update();
        }
        
        return this;
    },
    
    /**
     * @private
     * @param {String} [sName] 없으면 객체 반환
     * @return {Object|Variable}
     */
    _getValue : function (sName) {
        return !sName ? this._htInfo : this._htInfo[sName];
    },
        
    /**
     * 화면에 표시 한다
     * 
     * @private
     */
    _update : function () {
        this.change("fps", this._setFPS());
        
        if (!this.option("visible")) {
            if (this.option("useConsole")) {
                for (var i = 0, l = this._aList.length; i < l; i++) {
                    console.log(this._aList[i].name + ": " + this._aList[i].value);
                }
            }
        } else if (this._bLoaded) {
            this._nLastUpdatedFrame = this._htInfo.frame;
            
            if (this._htOption.useDrawingCount) {
                for (var i = 0, l = collie.Renderer._aLayerList.length; i < l; i++) {
                    this._addDrawingCount(i);
                    this.change("layer" + i, collie.Renderer._aLayerList[i].drawCount);
                }
            }
        }
    },
    
    /**
     * drawingCount 추가
     * 
     * @private
     * @param {Number} i 레이어 순서
     */
    _addDrawingCount : function (i) {
        var sName = "layer" + i;
        
        if (!this._htData[sName]) {
            this.add(sName, 0, "#" + i);
        }
    }
}, collie.Component);