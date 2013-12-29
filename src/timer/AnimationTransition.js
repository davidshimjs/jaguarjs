/**
 * collie.Effect를 사용한 Transition 타이머
 * [튜토리얼 보기](../tutorial/timer_transition.html)
 *
 * @example
 * ```
 * 여러 개의 값으로 트랜지션
 * collie.Timer.transition(function (oEvent) {
 *  oDisplayObject.set("opacity", oEvent.value[0]);
 *  oDisplayObject.set("x", oEvent.value[1]);
 * }, 1000, {
 *  from : [1, 100],
 *  to : [0, 300]
 * });
 * ```
 * 
 * @example
 * DisplayObject를 callback으로 사용해서 여러 속성을 변경하는 방법
 * ```
 * collie.Timer.transition(oDisplayObject, 1000, {
 *  from : [10, 10], // from 은 생략 가능, 생략하면 현재 값이 자동으로 입력 됨
 *  to : [100, 200],
 *  set : ["x", "y"]
 * });  
 * ```
 * 하지만 이 때에는 DisplayObject의 move 메서드를 사용하는 것이 좋음
 * 
 * @example
 * 여러 개의 DisplayObject를 한꺼번에 실행할 수도 있음
 * ```
 * collie.Timer.transition([oDisplayObjectA, oDisplayObjectB], 1000, {
 *  from : 0, // 이 때에는 from 생략 불가능
 *  to : 1,
 *  set : "opacity"
 * });
 * ```
 * 
 * @see collie.Timer
 * @class
 * @extends collie.Animation
 * @param {Function|collie.DisplayObject|Array} fCallback 실행될 콜백 함수, DisplayObject를 넣게 되면 해당 객체에 관한 내용만 변경함. htOption의 set 참조.
 * @param {collie.AnimationCycle} fCallback.timer 현재 타이머 인스턴스
 * @param {Number} fCallback.frame 현재 프레임
 * @param {Number} fCallback.duration 타이머에 설정된 duraiton 값
 * @param {Number} fCallback.cycle 반복 횟수
 * @param {Number} fCallback.runningTime 타이머 시작 후 실행된 시간 (ms)
 * @param {Number|Array} fCallback.value 적용할 값. from, to 값이 배열일 경우 이 값도 배열로 반환
 * @param {Number|Array} fCallback.from 시작 값, 시작 값을 입력하지 않고 fCallback에 DisplayObject를 넣으면 해당 객체의 현재 값이 자동으로 입력됨
 * @param {Number|Array} fCallback.to 끝 값
 * @param {Number} nDuration 실행 시간
 * @param {Object} htOption 설정
 * @param {Number|Array} htOption.from 시작 값(배열로 넣을 수 있음)
 * @param {Number|Array} htOption.to 끝 값(배열로 넣을 수 있음)
 * @param {Number} [htOption.loop=1] 반복 횟수
 * @param {collie.Effect} [htOption.effect=collie.Effect.linear] 효과 함수
 * @param {String|Array} [htOption.set] fCallback에 DisplayObject를 넣을 경우 set을 이용해서 특정 값을 변경한다. 배열로 넣을 경우 여러 속성을 변경할 수 있다
 * @see collie.Effect
 */
collie.AnimationTransition = collie.Class(/** @lends collie.AnimationTransition.prototype */{
    $init : function (fCallback, nDuration, htOption) {
        this.option({
            from : null, // 시작 값(배열로 넣을 수 있음)
            to : null, // 끝 값(배열로 넣을 수 있음)
            set : "",
            loop : 1,
            effect : collie.Effect.linear // 이펙트 함수
        });
        this._htCallback = {};
        this.option(htOption || {});
        var fReset = this.reset.bind(this);
        this.optionSetter("from", fReset);
        this.optionSetter("to", fReset);
        this._nCount = 0;
        this._nCountCycle = 0;
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;
        this._bIsArrayValue = false;
    },
    
    /**
     * 시작할 때 실행되는 메서드
     * @override
     */
    start : function () {
        // 시작 값이 없을 떄 객체의 현재 값을 입력
        if (this._htOption.from === null && typeof this._fCallback !== "function") {
            this._setDefaultFromValues();
        }
        
        if (this._nFrameAtRunLastest === null) {
            this.reset();
        }
        
        this.constructor.$super.start.call(this);
    },
    
    /**
     * @private
     */
    _setDefaultFromValues : function () {
        var vFrom = null;
        
        if (this._htOption.set) {
            if (this._htOption.set instanceof Array) {
                vFrom = [];
                for (var i = 0, len = this._htOption.set.length; i < len; i++) {
                    vFrom.push(this._fCallback.get(this._htOption.set[i]));
                }
            } else {
                vFrom = this._fCallback.get(this._htOption.set)
            }
            
            this.option("from", vFrom);
        }
    },
    
    /**
     * 값을 초기화
     */
    reset : function () {
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;
        this._nValue = this._htOption.from;
        this._bIsArrayValue = this._htOption.from instanceof Array;
        this._nCount = 0;
        this._nCountCycle = 0;
        
        // 값이 배열일 경우 처리
        if (this._bIsArrayValue) {
            this._fEffect = [];
            var fEffect = null;
            
            for (var i = 0, len = this._htOption.from.length; i < len; i++) {
                fEffect = (this._htOption.effect instanceof Array) ? this._htOption.effect[i] : this._htOption.effect; 
                this._fEffect[i] = fEffect(this._htOption.from[i], this._htOption.to[i]);
            }
        } else {
            this._fEffect = this._htOption.effect(this._htOption.from, this._htOption.to);
        }
    },
    
    /**
     * 현재 값을 설정
     * 
     * @param {Variables} vValue
     */
    setValue : function (vValue) {
        this._nValue = vValue;
    },
    
    /**
     * 현재 값을 반환
     * 
     * @return {Variables}
     */
    getValue : function () {
        return this._nValue;
    },
    
    /**
     * 애니메이션을 실행
     * 
     * @param {Number} [nCurrentFrame] 현재 렌더러 프레임, 값이 없으면 자동으로 현재 렌더러 프레임을 가져 온다
     * @param {Number} [nFrameDuration] 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        if (nCurrentFrame === undefined) {
            nCurrentFrame = collie.Renderer.getInfo().frame;
        }
        
        // 렌더러가 stop 된 경우
        if (this._nFrameAtRunLastest > nCurrentFrame) {
            this.reset();
            return;
        }
        
        // 시작 프레임 저장
        if (this._nFrameAtRunLastest === null) {
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunningTime = 0;
            nFrameDuration = 0;
        }
        
        this._nRunningTime += nFrameDuration;
        this._nCount++;
        
        // 시간이 지났으면 멈춤
        if (this._nRunningTime >= this._nDuration) {
            this._nCountCycle++;
            
            // 끝나는 값이 아니면 끝나는 값으로 만듦(한번 더 실행), 루프의 마지막일 때만 보정함.
            if (!this._isEndValue() && this._htOption.loop && this._htOption.loop <= this._nCountCycle) {
                this._setEndValue();
            } else if (!this._htOption.loop || this._htOption.loop > this._nCountCycle) {
                /**
                 * loop가 있을 경우 트랜지션이 한번 끝났을 때 발생
                 * @name collie.AnimationTransition#end
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.fireEvent("end");
                this._nFrameAtRunLastest = nCurrentFrame;
                this._nRunningTime = this._nRunningTime - this._nDuration; // loop면 처음부터 다시 시작이 아니라 이어서 시작
                this._nValue = this._htOption.from;
                this._transitionValue(this._nRunningTime);
            } else {
                /**
                 * 트랜지션이 끝난 후 발생
                 * @name collie.AnimationTransition#complete
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.complete();
                return;
            }
        } else if (this._nRunningTime > 0) {
            this._transitionValue(this._nRunningTime);
        }
        
        // 객체 재활용
        this._htCallback.timer = this;
        this._htCallback.frame = nCurrentFrame;
        this._htCallback.duration = this._nDuration;
        this._htCallback.cycle = this._nCountCycle;
        this._htCallback.runningTime = this._nRunningTime;
        this._htCallback.from = this._htOption.from;
        this._htCallback.to = this._htOption.to;
        this._htCallback.value = this._nValue; // 값이 배열이면 이것도 배열로 반환됨
        this.triggerCallback(this._htCallback);
        
        if (this._nRunningTime > 0) {
            this._nFrameAtRunLastest = nCurrentFrame;
        }
    },
    
    /**
     * 현재 프레임 값을 받아 현재 값을 transition된 값으로 변경 한다
     * @private
     * @param {Number} nCurrentRunningTime 현재 진행된 시간(ms)
     */
    _transitionValue : function (nCurrentRunningTime) {
        if (this._bIsArrayValue) {
            this._nValue = [];
            
            for (var i = 0, len = this._htOption.from.length; i < len; i++) {
                this._nValue[i] = parseFloat(this._fEffect[i](Math.max(0, Math.min(1, nCurrentRunningTime / this._nDuration))));
            }
        } else {
            this._nValue = parseFloat(this._fEffect(Math.max(0, Math.min(1, nCurrentRunningTime / this._nDuration))));
        }
    },
    
    /**
     * 끝 값인지 여부를 반환
     * @private
     * @return {Boolean} true면 끝 값
     */
    _isEndValue : function () {
        if (this._bIsArrayValue) {
            for (var i = 0, len = this._htOption.to.length; i < len; i++) {
                if (this._nValue[i] !== parseFloat(this._fEffect[i](1))) {
                    return false;
                }
            }
            
            return true;
        } else {
            return this._nValue === parseFloat(this._fEffect(1));
        }
    },
    
    /**
     * 현재 값을 끝 값으로 설정 한다
     * @private
     * @param {Number} nValue
     */
    _setEndValue : function () {
        if (this._bIsArrayValue) {
            for (var i = 0, len = this._htOption.to.length; i < len; i++) {
                this._nValue[i] = parseFloat(this._fEffect[i](1));
            }
        } else {
            this._nValue = parseFloat(this._fEffect(1));
        }
    }
}, collie.Animation);