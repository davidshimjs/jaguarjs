/**
 * Layer를 등록해서 그리는 렌더링 파이프라인
 * @namespace
 * @TODO frame을 기록하는 클래스의 경우 stop되고 다시 시작되면 0부터 시작하므로
자기가 기록한 frame이 현재 frame보다 클 때 보정 처리를 반드시 해줘야 한다.
이는 나중에 frame이 int 풀카운트가 되었을 때 처리가 있을지도 모르므로 필수
 */
collie.Renderer = collie.Renderer || new (collie.Class(/** @lends collie.Renderer */{
    /**
     * 기본 렌더링 FPS
     * @type {String}
     */
    DEFAULT_FPS : "60fps",
    
    /**
     * 레티나 디스플레이 여부 auto 값일 경우 자동 판단, true/false 값은 수동
     * auto 일 때 자동 판단 됨
     * @type {String|Boolean}
     */
    RETINA_DISPLAY : false,
    
    /**
     * 이 값을 true로 변경하면 가상 딜레이를 발생할 수 있다.
     * 가상 딜레이 발생 상태에서는 requestAnimationFrame이 동작하지 않으며
     * 타이머 등이 스킵될 때 어떻게 동작하는지 확인할 수 있다.
     *
     * @type {Boolean}
     * @example
     * collie.Renderer.DEBUG_USE_DELAY = true;
     * collie.Renderer.DEBUG_MAX_DELAY = 200;
     * collie.Renderer.start();
     */
    DEBUG_USE_DELAY : false,
    
    /**
     * 가상 딜레이 최대값(랜덤하게 발생, ms)
     * @type {Number}
     */
    DEBUG_MAX_DELAY : 200,
    
    /**
     * 렌더링 모드 [auto|canvas|dom]
     * @type {String}
     */
    DEBUG_RENDERING_MODE : "auto",
    
    /**
     * 자동 일시정지를 해제한다
     * @type {Boolean} 
     */
    USE_AUTO_PAUSE : true,

    /**
     * If The Renderer can't render the screen in this time, It should be paused.
     * (ms)
     * @type {Number}
     */
    DELAY_LIMIT : 3 * 1000,
    
    $init : function () {
        this._sVisibilityChange = this._getNamePageVisibility();
        this._bPlaying = false;
        this._bPause = false;
        this._nFPS = 0;
        this._nDuration = 0; // ms
        this._nCurrentFrame = 0;
        this._nSkippedFrame = 0;
        this._nBeforeFrameTime = null; // ms
        this._nBeforeRenderingTime = 0; // ms
        this._aLayerList = [];
        this._fRender = this._render.bind(this);
        this._fCallback = null;
        this._htCallback = {};
        this._elContainer = document.createElement("div");
        this._elContainer.className = "_collie_container";
        this._elContainer.style.position = "relative";
        this._elContainer.style.overflow = "hidden";
        this._elParent = null;
        this._nDebugDelayedTime = 0;
        this._oRenderingTimer = null;
        this._bLoaded = false;
        this._sRenderingMode = null;
        this._bUseRetinaDisplay = null;
        this._htEventStatus = {};
        this._htPosition = {};
        this._bIsPreventDefault = true;
        this._htDeviceInfo = collie.util.getDeviceInfo();
        this._fOnChangeVisibility = this._onChangeVisibility.bind(this);
        this._fOnPageShow = this._onPageShow.bind(this);
        this._fOnPageHide = this._onPageHide.bind(this);
        this._fRefresh = this.refresh.bind(this);
    },
    
    /**
     * 페이지를 진입할 때 렌더러 처리
     * @private
     */
    _onPageShow : function () {
        if (!this.USE_AUTO_PAUSE) {
            return;
        }
        
        if (!this.isPlaying() && this._bPause) {
            this.resume();
        }
    },
    
    /**
     * 페이지를 이탈할 때 렌더러 처리
     * @private
     */
    _onPageHide : function () {
        if (!this.USE_AUTO_PAUSE) {
            return;
        }
        
        if (this.isPlaying()) {
            this.pause();
        }
    },
    
    /**
     * @private
     */
    _onChangeVisibility : function () {
        if (!this.USE_AUTO_PAUSE) {
            return;
        }
        
        var state = document.visibilityState || document.webkitVisibilityState || document.mozVisibilityState;

        if (state === "hidden") {
            this.pause();
        } else if (state === "visible") {
            this.resume();
        }
    },
    
    /**
     * 렌더링 엘리먼트의 위치를 갱신한다
     * 만일 렌더링 엘리먼트의 위치가 load 후에 변경될 경우 refresh 메소드를 실행시켜줘야 한다
     */
    refresh : function () {
        if (this._elParent !== null) {
            this._htPosition = collie.util.getPosition(this._elParent);
        }
    },
    
    /**
     * 렌더러 엘리먼트의 현재 위치를 반환
     * 렌더러가 load되지 않았다면 false를 반환
     * 
     * @private
     * @return {Object|Boolean} htResult
     * @return {Number} htResult.x 페이지 처음부터의 x좌표
     * @return {Number} htResult.y 페이지 처음부터의 y좌표 
     * @return {Number} htResult.width 너비
     * @return {Number} htResult.height 높이
     */
    getPosition : function () {
        return this._bLoaded ? this._htPosition : false;
    },
    
    /**
     * 렌더러에 적용할 레이어를 추가 한다
     * 
     * @param {collie.Layer} oLayer
     */
    addLayer : function (oLayer) {
        if (!oLayer || !("type" in oLayer) || oLayer.type !== "layer") {
            throw new Error('oLayer is not Layer instnace');
        }
        
        // 이미 추가된 레이어라면 무시
        for (var i = 0, len = this._aLayerList.length; i < len; i++) {
            if (this._aLayerList[i] === oLayer) {
                return;
            }
        }
        
        this._aLayerList.push(oLayer);
        
        // 로드된 상태에서는 자동으로 붙기
        if (this._bLoaded) {
            oLayer.load(this._elContainer, this._aLayerList.length);
            this.resetLayerEvent();
        }
    },
    
    /**
     * 렌더러에 적용한 레이어를 제거 한다
     * 
     * @param {collie.Layer} oLayer
     */
    removeLayer : function (oLayer) {
        for (var i = 0, len = this._aLayerList.length; i < len; i++) {
            if (this._aLayerList[i] === oLayer) {
                this._aLayerList[i].unload(); // 로딩되어 있으면 해제 시킴
                this._aLayerList.splice(i, 1);
                return;
            }
        }
    },
    
    /**
     * 등록된 모든 레이어를 제거 한다
     */
    removeAllLayer : function () {
        for (var i = this._aLayerList.length - 1; i >= 0; i--) {
            this._aLayerList[i].unload();
        }
        
        this._aLayerList = [];
    },
    
    /**
     * 등록된 레이어를 모두 반환
     * 
     * @return {Array}
     */
    getLayers : function () {
        return this._aLayerList;
    },
    
    /**
     * 이벤트를 모두 해제하고 다시 건다
     * @private
     */
    resetLayerEvent : function () {
        for (var i = 0, len = this._aLayerList.length; i < len; i++) {
            this._aLayerList[i].detachEvent();
        }

        // 레이어 역순으로 이벤트가 동작해야 하기 때문에 이벤트는 역순으로 건다
        for (var i = this._aLayerList.length - 1; i >= 0; i--) {
            this._aLayerList[i].attachEvent();
        }
    },
    
    /**
     * 렌더러의 컨테이너 엘리먼트를 반환
     * @return {HTMLElement}
     */
    getElement : function () {
        return this._elContainer;
    },
    
    /**
     * 렌더러에 적용된 시간을 반환
     * 
     * @return {Number} ms
     */
    getDuration : function () {
        return this._nDuration;
    },
    
    /**
     * 렌더러 정보를 반환
     * 
     * @return {Object} htInfo
     * @return {Number} htInfo.frame 현재 프레임 수
     * @return {Number} htInfo.skippedFrame 지나간 누적 프레임 수
     * @return {Number} htInfo.fps
     * @return {Number} htInfo.duration 지연시간(ms)
     * @return {Number} htInfo.renderingTime 이전에 발생했던 렌더링 시간(ms)
     * @return {Number} htInfo.beforeFrameTime 이전에 렌더러가 실행됐던 시간(timestamp)
     */
    getInfo : function () {
        // 객체 재활용
        this._htCallback.frame = this._nCurrentFrame;
        this._htCallback.skippedFrame = this._nSkippedFrame;
        this._htCallback.fps = this._nFPS;
        this._htCallback.duration = this._nDuration;
        this._htCallback.renderingTime = this._nBeforeRenderingTime;
        this._htCallback.beforeFrameTime = this._nBeforeFrameTime;
        return this._htCallback;
    },
    
    /**
     * 렌더링 모드를 반환
     * - 두개의 방식을 섞어 쓰는 것은 속도가 느려서 1가지 방식을 사용하는 것이 낫다
     * @return {String} [dom|canvas]
     */
    getRenderingMode : function () {
        if (this._sRenderingMode === null) {
            var htDeviceInfo = collie.util.getDeviceInfo();
            this._sRenderingMode = this.DEBUG_RENDERING_MODE;

            if (!this._sRenderingMode || this._sRenderingMode === "auto") {
                // 안드로이드 2.2 미만, 캔버스를 지원하지 않거나 ios 5 미만인 경우
                // 안드로이드 4 버전대에서 DOM 불안정성이 발견됨
                // 안드로이드 4.2.2 galaxy S4 부터 canvas가 더 빨라짐           
                if (
                    (
                        htDeviceInfo.android && !htDeviceInfo.chrome && (
                            (htDeviceInfo.android < 4.2 && htDeviceInfo.android >= 3) ||
                            htDeviceInfo.android < 2.2
                        )
                    ) ||
                    !htDeviceInfo.supportCanvas ||
                    (htDeviceInfo.ios && htDeviceInfo.ios < 5)
                ) {
                    this._sRenderingMode = "dom";
                } else {
                    this._sRenderingMode = "canvas";
                }
            }
            
            // 캔버스를 지원하지 않으면 무조건 DOM 모드로
            if (!htDeviceInfo.supportCanvas) {
                this._sRenderingMode = "dom";
            }
        }
        
        return this._sRenderingMode;
    },
    
    /**
     * 렌더링 모드를 변경 한다
     * 
     * @param {String} sMode [auto|dom|canvas]
     * @example collie를 사용하기 전에 사용해야 한다.
     * collie.Renderer.setRenderingMode("dom");
     * collie.ImageManager.add({
     *  ...
     * }, function () {
     *  ...
     * });
     */
    setRenderingMode : function (sMode) {
        this.DEBUG_RENDERING_MODE = sMode.toString().toLowerCase();
        this._sRenderingMode = null;
    },
    
    /**
     * 레티나 디스플레이를 사용하고 있는지 여부
     * IE9 미만에서는 무조건 false를 반환
     * 
     * @return {Boolean}
     */
    isRetinaDisplay : function () {
        if (this._bUseRetinaDisplay === null) {
            // android 4.0 이상도 retina 지원 추가
            this._bUseRetinaDisplay = this.RETINA_DISPLAY !== "auto" ? this.RETINA_DISPLAY : window.devicePixelRatio >= 2 && (!collie.util.getDeviceInfo().android || collie.util.getDeviceInfo().android >= 4);
            var htDeviceInfo = collie.util.getDeviceInfo();
            
            // background-size를 지원하지 않는 상태에서 고해상도 디스플레이 모드 사용할 수 없음
            if (htDeviceInfo.ie && htDeviceInfo.ie < 9) {
                this._bUseRetinaDisplay = false;
            }
        }
        
        return this._bUseRetinaDisplay;
    },
    
    /**
     * 레티나 디스플레이 방식을 변경 한다
     * @param {Boolean|String} vMode [false|true|"auto"]
     * @example collie를 사용하기 전에 사용해야 한다.
     * collie.Renderer.setRetinaDisplay(true);
     * collie.ImageManager.add({
     *  ...
     * }, function () {
     *  ...
     * });
     */
    setRetinaDisplay : function (vMode) {
        this.RETINA_DISPLAY = vMode;
        this._bUseRetinaDisplay = null;
    },
    
    /**
     * requestAnimationFrame 사용 여부 반환
     * 
     * @private
     * @param {Boolean} bCancelName true면 CancelAnimationFrame 이름을 반환
     * @return {bool|String} 사용 가능하면 함수명을 반환
     */
    _getNameAnimationFrame : function (bCancelName) {
        if (typeof window.requestAnimationFrame !== "undefined") {
            return bCancelName ? "cancelAnimationFrame" : "requestAnimationFrame";
        } else if (typeof window.webkitRequestAnimationFrame !== "undefined") {
            return bCancelName ? "webkitCancelAnimationFrame" : "webkitRequestAnimationFrame";
        } else if (typeof window.msRequestAnimationFrame !== "undefined") {
            return bCancelName ? "msCancelAnimationFrame" : "msRequestAnimationFrame";
        } else if (typeof window.mozRequestAnimationFrame !== "undefined") {
            return bCancelName ? "mozCancelAnimationFrame" : "mozRequestAnimationFrame";
        } else if (typeof window.oRequestAnimationFrame !== "undefined") {
            return bCancelName ? "oCancelAnimationFrame" : "oRequestAnimationFrame";
        } else {
            return false;
        }
    },
    
    /**
     * Page Visibility Event 이름을 반환
     * @private
     * @return {String|Boolean}
     */
    _getNamePageVisibility : function () {
        if ("hidden" in document) {
            return "visibilitychange";
        } else if ("webkitHidden" in document) {
            return "webkitvisibilitychange";
        } else if ("mozHidden" in document) {
            return "mozvisibilitychange";
        } else {
            return false;
        } 
    },
    
    /**
     * 표현할 레이어를 elParent에 붙인다 시작전에 반드시 해야함
     * 
     * @param {HTMLElement|String} elParent
     */
    load : function (elParent) {
        this.unload();
        this._bLoaded = true;
        
        // string이면 엘리먼트를 구해 줌
        if (typeof elParent === "string") {
            elParent = document.getElementById(elParent);
        }
        
        this._elParent = elParent;
        this._elParent.appendChild(this._elContainer);
        this.refresh();
        
        if (this._aLayerList.length) {
            for (var i = 0, len = this._aLayerList.length; i < len; i++) {
                this._aLayerList[i].load(this._elContainer, i);
            }
            
            // 레이어 역순으로 이벤트가 동작해야 하기 때문에 이벤트는 역순으로 건다
            for (var i = this._aLayerList.length - 1; i >= 0; i--) {
                this._aLayerList[i].attachEvent();
            }
        }
        
        // PageVisibility API를 사용할 수 있다면 사용
        if (this._sVisibilityChange) {
            collie.util.addEventListener(document, this._sVisibilityChange, this._fOnChangeVisibility);
        // 모바일이라면 pageshow/pagehide를 사용
        // In-App Browser일 때 pageshow/pagehide가 정상적으로 호출 안되는 문제점이 있음
        } else if (!this._htDeviceInfo.desktop) {
            collie.util.addEventListener(window, "pageshow", this._fOnPageShow);
            collie.util.addEventListener(window, "pagehide", this._fOnPageHide);
        }
        
        // 렌더러 엘리먼트의 위치를 저장해 놓는다
        collie.util.addEventListener(window, "resize", this._fRefresh);
    },
    
    /**
     * 부모 엘리먼트에 붙인 레이어를 지움
     */
    unload : function () {
        if (this._bLoaded) {
            for (var i = 0, len = this._aLayerList.length; i < len; i++) {
                this._aLayerList[i].unload();
            }
    
            this._elParent.removeChild(this._elContainer);
            this._elParent = null;
            this._bLoaded = false;
            
            if (this._sVisibilityChange) {
                collie.util.removeEventListener(document, this._sVisibilityChange, this._fOnChangeVisibility);
            } else if (!this._htDeviceInfo.desktop) {
                collie.util.removeEventListener(window, "pageshow", this._fOnPageShow);
                collie.util.removeEventListener(window, "pagehide", this._fOnPageHide);
            }
            
            collie.util.removeEventListener(window, "resize", this._fRefresh);
        }
    },
    
    /**
     * 렌더링 시작
     * - callback 안에서 false를 반환하면 rendering을 멈춘다
     * 
     * @param {Number|String} vDuration 렌더러의 시간 간격(ms), fps를 붙이면 fps 단위로 입력된다.
     * @param {Function} fCallback 프레임마다 실행할 함수, 없어도 되고 process 이벤트를 받아서 처리해도 된다.
     * @param {Number} fCallback.frame 현재 프레임
     * @param {Number} fCallback.skippedFrame 시간이 밀려서 지나간 프레임 수
     * @param {Number} fCallback.fps FPS
     * @param {Number} fCallback.duration 지연 시간 (ms)
     * @example
     * fps를 붙이면 FPS단위로 입력할 수 있다.
     * ```
     * collie.Renderer.start("30fps");
     * collie.Renderer.start(1000 / 30);
     * ```
     */
    start : function (vDuration, fCallback) {
        if (!this._bPlaying) {
            // this.stop();
            vDuration = vDuration || this.DEFAULT_FPS;
            this._nDuration = (/fps$/i.test(vDuration)) ? 1000 / parseInt(vDuration, 10) : Math.max(16, vDuration);
            this._fCallback = fCallback || null;
            this._bPlaying = true;
            
            // FPS가 60일 때만 requestAnimationFrame을 사용한다
            if (this._nDuration < 17) {
                this._sRequestAnimationFrameName = this._getNameAnimationFrame();
                this._sCancelAnimationFrameName = this._getNameAnimationFrame(true);
            } else {
                this._sRequestAnimationFrameName = false;
                this._sCancelAnimationFrameName = false;
            }
            
            /**
             * 렌더링 시작
             * @name collie.Renderer#start
             * @event
             * @param {Object} oEvent
             */
            this.fireEvent("start");
            this._trigger(0);
        }
        
    },
    
    _trigger : function (nDelay) {
        if (!this._sVisibilityChange && this.USE_AUTO_PAUSE && window.screenTop < -30000) {
            this.pause();
        }
        
        if (typeof nDelay === "undefined") {
            nDelay = 0;
        } else {
            nDelay = parseInt(nDelay, 10);
        }
        
        // 가상 딜레이를 적용하려면 requestAnimationFrame을 제거
        if (this._sRequestAnimationFrameName !== false && !this.DEBUG_USE_DELAY && this.USE_AUTO_PAUSE) {
            this._oRenderingTimer = window[this._sRequestAnimationFrameName](this._fRender);
        } else {
            this._oRenderingTimer = setTimeout(this._fRender, nDelay);
        }
    },
    
    /**
     * 실제 화면을 렌더링
     * 
     * @private
     * @param {Number} nSkippedFrame collie.Renderer#draw 에서 넘어온 인자
     * @param {Boolean} 실행중 여부와 관계 없이 그림
     */
    _render : function (nSkippedFrame, bForcePlay) {
        // stop 시점이 비동기라서 시점이 안맞을 수도 있음. 렌더링이 바로 중단되야 함
        if (!this._bPlaying && !bForcePlay) {
            return;
        }

        var nTime = this._getDate();
        var nRealDuration = 0;
        var nFrameStep = 1; // 진행할 프레임 단계
        
        // 진행된 프레임이면 시간 계산
        if (this._nBeforeFrameTime !== null) {
            nRealDuration = nTime - this._nBeforeFrameTime; // 실제 걸린 시간
            nFrameStep = nSkippedFrame || Math.max(1, Math.round(nRealDuration / this._nDuration)); // 60fps 미만으로는 버린다
            
            if (nRealDuration > this.DELAY_LIMIT) {
                this.pause();
                return;
            }

            // requestAnimationFrame 인자가 들어옴
            if (this._sRequestAnimationFrameName !== false && this.USE_AUTO_PAUSE) {
                nSkippedFrame = 0;
                nFrameStep = 1;
            }
            
            this._nSkippedFrame += Math.max(0, nFrameStep - 1);
            this._nFPS = Math.round(1000 / (nTime - this._nBeforeFrameTime));
        }
        
        this._nCurrentFrame += nFrameStep;
        var htInfo = this.getInfo();
        
        // callback이 없거나 callback 실행 결과가 false가 아니거나 process 이벤트 stop이 발생 안한 경우에만 진행
        /**
         * 렌더링 진행
         * @name collie.Renderer#process
         * @event
         * @param {Object} oEvent
         * @param {Function} oEvent.stop stop 하면 렌더링이 멈춘다
         */     
        if ((this._fCallback === null || this._fCallback(htInfo) !== false) && this.fireEvent("process", htInfo) !== false) {
            collie.Timer.run(this._nCurrentFrame, nRealDuration);
            this._update(nRealDuration);
            var nDebugDelayedTime = 0; 
            
            // 가상 딜레이 적용
            if (this.DEBUG_USE_DELAY) {
                nDebugDelayedTime = Math.round(Math.random() * this.DEBUG_MAX_DELAY);
                this._nDebugDelayedTime += nDebugDelayedTime;
            }
                        
            this._nBeforeRenderingTime = this._getDate() - nTime;
            this._nBeforeFrameTime = nTime;
            
            if (this._bPlaying) {
                this._trigger(Math.max(0, this._nDuration - this._nBeforeRenderingTime + nDebugDelayedTime * 2));
            }
        } else {
            this.stop();
        }
    },
    
    /**
     * 원하는 프레임으로 스킵해서 그린다
     * 
     * @param {Number} nSkippedFrame 값이 없으면 스킵 없이, 값이 있으면 그 값만큼 프레임을 스킵해서 그린다
     */
    draw : function (nSkippedFrame) {
        this._fRender(nSkippedFrame, true);
    },
    
    /**
     * 현재 시간을 가져 온다
     * @private
     * @return {Number} timestamp
     */
    _getDate : function () {
        return (+new Date()) + (this.DEBUG_USE_DELAY ? this._nDebugDelayedTime : 0);
    },

    /**
     * 렌더링을 멈춘다
     */
    stop : function () {
        if (this._bPlaying) {
            this._bPlaying = false;
            this._resetTimer();
            
            /**
             * 렌더링 멈춤
             * @name collie.Renderer#stop
             * @event
             * @param {Object} oEvent
             */
            this.fireEvent("stop", this.getInfo());

            this._sRenderingMode = null;
            this._bUseRetinaDisplay = null;         
            this._fCallback = null;
            this._nCurrentFrame = 0;
            this._nBeforeRenderingTime = 0;
            this._nSkippedFrame = 0;
            this._nBeforeFrameTime = null;          
        }
    },
    
    _resetTimer : function () {
        if (this._oRenderingTimer !== null) {
            if (this._sCancelAnimationFrameName !== false) {
                window[this._sCancelAnimationFrameName](this._oRenderingTimer);
            } else {
                clearTimeout(this._oRenderingTimer);
            }

            //TODO debug            
            window.tempTimer = window.tempTimer || [];
            window.tempTimer.push(this._oRenderingTimer);
            this._oRenderingTimer = null;
        }
    },
    
    /**
     * 잠시 멈춘다
     */
    pause : function () {
        if (this._bPlaying) {
            this._bPlaying = false;
            this._bPause = true;
            
            /**
             * 렌더러가 일시 정지 때 발생. getInfo 값이 이벤트 인자로 넘어간다
             * @name collie.Renderer#pause
             * @event
             * @see collie.Renderer.getInfo
             */
            this.fireEvent("pause", this.getInfo());
            
            // 진행되고 있는 타이머를 해제
            this._resetTimer();         
        }
    },
    
    /**
     * 잠시 멈춘것을 다시 실행 한다
     */
    resume : function () {
        if (this._bPause) {
            this._nBeforeFrameTime = this._getDate();
            this._nBeforeRenderingTime = 0;
            this._bPlaying = true;
            this._bPause = false;
            
            /**
             * 렌더러가 일시 정지에서 해제될 때 발생. getInfo 값이 이벤트 인자로 넘어간다
             * @name collie.Renderer#resume
             * @event
             * @see collie.Renderer.getInfo
             */
            this.fireEvent("resume", this.getInfo());
            this._trigger(0);
        }
    },
    
    /**
     * 현재 실행 중인지 여부를 반환
     * 
     * @return {Boolean}
     */
    isPlaying : function () {
        return this._bPlaying;
    },
    
    /**
     * 레이어 업데이트, 주로 다시 그리거나 동작 등을 업데이트 한다
     * 
     * @param {Number} nFrameDuration 실제 진행된 시간
     * @private
     */
    _update : function (nFrameDuration) {
        for (var i = 0, len = this._aLayerList.length; i < len; i++) {
            this._aLayerList[i].update(nFrameDuration);
        }
    },
    
    /**
     * 이벤트의 레이어간 전달을 막기 위한 이벤트 상태를 설정 한다
     * 
     * @private
     * @param {String} sEventType 이벤트 타입
     * @param {Boolean} bFiredOnTarget 이벤트가 대상에 발생했는지 여부
     */
    setEventStatus : function (sEventType, bFiredOnTarget) {
        this._htEventStatus = {
            type : sEventType,
            firedOnTarget : bFiredOnTarget
        };
    },
    
    /**
     * 객체 이벤트를 멈춰야 하는지 여부
     * @private
     * @param {String} sEventType 이벤트 타입
     * @return {Boolean} 이벤트를 멈춰야 하는지 여부
     */
    isStopEvent : function (sEventType) {
        // click 이벤트는 임의로 발생시키기 때문에 mouseup 으로 간주
        if (sEventType === "click") {
            sEventType = "mouseup";
        }
        
        return sEventType === this._htEventStatus.type && this._htEventStatus.firedOnTarget;
    },
    
    /**
     * 이벤트의 레이어간 전달을 막기 위한 이벤트 상태를 가져 온다
     * 
     * @private
     * @return {Object} htEventStatus
     * @return {String} htEventStatus.type 이벤트 타입
     * @return {Boolean} htEventStatus.firedOnTarget 이벤트가 대상에 발생했는지 여부
     */
    getEventStatus : function () {
        return this._htEventStatus;
    },
    
    /**
     * 레이어 위에서 기본 이벤트(mousemove, mousedown) 동작을 막을지 여부를 설정 한다.
     * 
     * @param {Boolean} bPreventDefault true면 기본 동작을 막는다.
     */
    setPreventDefault : function (bPreventDefault) {
        this._bIsPreventDefault = !!bPreventDefault;
    },
    
    /**
     * 기본 동작을 막는지 여부를 반환
     * 
     * @return {Boolean} true일 때 막는다, 기본값이 true
     */
    isPreventDefault : function () {
        return this._bIsPreventDefault;
    },
    
    /**
     * 렌더러에 등록된 모든 레이어의 크기를 변경 한다
     * 
     * @param {Number} nWidth
     * @param {Number} nHeight
     * @param {Boolean} bExpand 확장할지 크기만 변경할지 여부
     */
    resize : function (nWidth, nHeight, bExpand) {
        for (var i = 0, len = this._aLayerList.length; i < len; i++) {
            this._aLayerList[i].resize(nWidth, nHeight, bExpand);
        }
    }
}, collie.Component))();