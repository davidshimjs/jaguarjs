/**
 * 애니메이션 부모 클래스
 * 
 * @class collie.Animation
 * @extends collie.Component
 * @param {Function} fCallback 타이머 콜백 함수
 * @param {Number} nDuration 타이머 실행 시간, 지연 시간 (ms)
 * @param {Object} htOption 설정
 * @param {Boolean} htOption.useAutoStart TimerList에 추가될 때 자동으로 시작 된다
 * @param {Function} [htOption.on이벤트명] onComplete와 같이 이벤트명을 사용해서 attach를 직접하지 않고 옵션으로 할 수 있다
 */
collie.Animation = collie.Class(/** @lends collie.Animation.prototype */{
    /**
     * @constructs
     */
    $init : function (fCallback, nDuration, htOption) {
        this._nId = ++collie.Animation._idx;
        this._bIsPlaying = false;
        this._fCallback = fCallback;
        this._oTimerList = null;
        
        // AnimationQueue의 경우 nDuration자리에 htOption이 들어간다
        this.option("useAutoStart", true);
        this.option((typeof nDuration === "object" ? nDuration : htOption) || {});
        this.setDuration(nDuration);
        
        // 이벤트 핸들러 할당
        this.setOptionEvent(htOption);
    },
    
    /**
     * Option 설정을 event로 만듦
     * @private
     */
    setOptionEvent : function (htOption) {
        if (htOption) {
            for (var i in htOption) {
                if (i.toString().indexOf("on") === 0) {
                    this.attach(i.toString().replace(/^on/, '').toLowerCase(), htOption[i]);
                }
            }
        }
    },
    
    /**
     * Callback을 형태에 맞게 실행
     * 
     * @private
     * @param {Object} htParam
     */
    triggerCallback : function (htParam) {
        // callback에 DisplayObject 객체를 넘길 경우
        if (typeof this._fCallback !== "function" && this._htOption.set) {
            var htOption = {};
            
            // 배열 값 처리
            if (this._htOption.set instanceof Array) {
                for (var i = 0, len = this._htOption.set.length; i < len; i++) {
                    htOption[this._htOption.set[i]] = (htParam.value instanceof Array) ? htParam.value[i] : htParam.value;
                }
            } else {
                htOption[this._htOption.set] = htParam.value;
            }
            
            // 실행
            if (this._fCallback instanceof Array) {
                for (var j = 0, len = this._fCallback.length; j < len; j++) {
                    this._fCallback[j].set(htOption);
                }
            } else {
                this._fCallback.set(htOption);
            }
        } else if (this._fCallback) {
            this._fCallback(htParam);
        }
    },
    
    /**
     * Duration을 설정
     * 
     * @param {Number|String} nDuration 실행 시간, 지연 시간 설정 (ms)
     */
    setDuration : function (nDuration) {
        this._nDuration = parseInt(nDuration, 10);
    },
    
    /**
     * Duration을 반환
     * 
     * @return {Number} (ms)
     */
    getDuration : function () {
        return this._nDuration;
    },
    
    /**
     * TimerList에 추가될 때 알려 줌. stop할 때 목록에서 빼기 위함
     * 
     * @param {collie.TimerList}
     * @private
     */
    setTimerList : function (oTimerList) {
        this._oTimerList = oTimerList;
        
        if (this._htOption.useAutoStart) {
            this.start();
        }
    },
    
    /**
     * 애니메이션 인스턴스를 식별하는 아이디를 반환
     * 
     * @private
     * @return {Number} 아이디 (1...)
     */
    getId : function () {
        return this._nId;
    },
    
    /**
     * 애니메이션을 실행
     * 
     * @abstract
     * @param {Number} [nCurrentFrame] 현재 렌더러 프레임, 값이 없으면 자동으로 현재 렌더러 프레임을 가져 온다
     * @param {Number} [nDrameDuration] 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        throw new Error('abstract method');
    },
    
    /**
     * 설정 값을 초기화 할 때 사용
     * 
     * @abstract
     */
    reset : function () {
        throw new Error('abstract method');
    },
    
    /**
     * 애니메이션을 정지
     * @example
     * // stop/start
     * var timer = collie.Timer.repeat(function () {}, 1000);
     * timer.stop();
     * timer.start();
     * 
     * @param {Boolean} bSkipEvent 이벤트를 발생하지 않는다
     */
    stop : function (bSkipEvent) {
        if (this.isPlaying()) {
            if (this._oTimerList !== null) {
                this._oTimerList.remove(this);
            }
            
            this._bIsPlaying = false;
            this.reset();
            
            /**
             * 타이머를 정지할 때 발생. 정상적으로 complete된 경우에는 발생하지 않는다
             * @name collie.Animation#stop
             * @event
             * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
             */
            if (!bSkipEvent) {
                this.fireEvent("stop");
            }
        }
    },
    
    /**
     * 애니메이션을 일시정지
     * @example
     * // pause/start
     * var timer = collie.Timer.repeat(function () {}, 1000);
     * timer.pause();
     * timer.start();
     */
    pause : function () {
        if (this.isPlaying()) {
            this._bIsPlaying = false;
            
            /**
             * 타이머를 일시 정지할 때 발생
             * @name collie.Animation#pause
             * @event
             * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
             */
            this.fireEvent("pause");
            
            if (this._oTimerList !== null) {
                this._oTimerList.remove(this);
            }
        }
    },

    /**
     * 정지 상태인 타이머를 다시 실행
     */
    start : function () {
        if (!this.isPlaying()) {
            this._bIsPlaying = true;
            
            if (this._oTimerList !== null) {
                this._oTimerList.add(this);
            }
            
            /**
             * 타이머를 실행할 때 발생. Timer를 이용해서 생성할 때는 생성하는 순간 시작 상태이다.
             * @name collie.Animation#start
             * @event
             * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
             */
            this.fireEvent("start");
        }
    },
    
    /**
     * 타이머가 진행 중인지 여부를 반환
     * 
     * @return {Boolean} true면 실행 중
     */
    isPlaying : function () {
        return this._bIsPlaying;
    },
    
    /**
     * 애니메이션이 완료 됐을 때 실행
     */
    complete : function () {
        if (this.isPlaying()) {
            if (this._fCallbackComplete) {
                this._fCallbackComplete();
            }
            
            // complete 이벤트 발생 전에 멈춤
            this.stop(true);
            
            /**
             * 타이머가 정상적으로 종료되면 발생, repeat나 cycle의 loop가 0과 같이 지속적으로 반복되는 타이머에서는 일어나지 않는다
             * @name collie.Animation#complete
             * @event
             * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
             */
            this.fireEvent("complete");
        }
    }
    
    /**
     * 현재 타이머를 제거한다
     * 
     * @name collie.Animation#remove
     * @deprecated start, stop할 때 List에 추가되고 제거되기 때문에 별도로 remove를 할 필요가 없어졌다.
     */
}, collie.Component);

/**
 * @private
 */
collie.Animation._idx = 0;