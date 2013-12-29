/**
 * 특정 시간 동안 실행된 후 대기 시간 이후에 다시 실행되는 싸이클 애니메이션
 * 주로 Sprite 애니메이션에 사용 된다.
 * 
 * [튜토리얼 보기](../tutorial/timer_cycle.html)
 * 
 * timeline ------------------------------------&gt;
 * action   *-duration-* delay *-duration-* delay
 * 
 * @see collie.Timer
 * @class
 * @extends collie.Animation
 * @param {Function|collie.DisplayObject|Array} fCallback 실행될 콜백 함수, DisplayObject를 넣게 되면 해당 객체에 관한 내용만 변경함. htOption의 set 참조.
 * @param {collie.AnimationCycle} fCallback.timer 현재 타이머 인스턴스
 * @param {Number} fCallback.frame 현재 프레임
 * @param {Number} fCallback.duration 타이머에 설정된 duraiton 값
 * @param {Number} fCallback.count 실행 횟수
 * @param {Number} fCallback.skippedCount 지나간 실행 횟수
 * @param {Number} fCallback.runningTime 타이머 시작 후 실행된 시간 (ms)
 * @param {Variables} fCallback.value 싸이클 값
 * @param {Number} fCallback.cycle 싸이클 반복 횟수
 * @param {Number} fCallback.step 단계 값
 * @param {Number} fCallback.from 시작 값
 * @param {Number} fCallback.to 끝 값
 * @param {Number|String} nDuration 시간 간격 (ms), fps 단위를 사용할 수 있다.
 * @param {Number} htOption 설정
 * @param {Number} htOption.from=0 싸이클 시작 값
 * @param {Number} htOption.to=0 싸이클 끝 값
 * @param {Number} [htOption.step=1] 증감 값
 * @param {Number} [htOption.loop=0] 0이 아니면 해당 횟수만큼 반복
 * @param {Number} [htOption.useRealTime=true] SkippedFrame을 적용해서 싸이클을 현재 시간과 일치
 * @param {Array} [htOption.valueSet] 비 규칙적 cycle을 사용할 때 valueSet에 배열을 넣고 순서대로 값을 꺼내 쓸 수 있다
 * @param {String|Array} [htOption.set="spriteX"] fCallback에 DisplayObject를 넣을 경우 set을 이용해서 특정 값을 변경한다. 배열로 넣을 경우 여러 속성을 변경할 수 있다  
 * @param {Number} [htOption.start] from 값이 아닌 값부터 시작할 경우 값을 설정. ex) from:0, to:3 일 때 2, 3, 0, 1, 2, 3... 으로 진행할 경우 start:2 값을 설정
 * @example
 * valueSet 사용 방법, step, from, to 옵션은 자동으로 설정된다
 * ```
 * collie.Timer.cycle(function () {
 *  // 0, 1, 2, 1, 0 순으로 플레이
 * }, 1000, {
 *  valueSet : [0, 1, 2, 1, 0]
 * });
 * ```
 * 
 * DisplayObject를 callback으로 사용해서 스프라이트 애니메이션을 구현하는 방법
 * ```
 * collie.Timer.cycle(oDisplayObject, 1000, {
 *  valueSet : [0, 1, 2, 1, 0]
 * });
 * ```
 * 
 * fps 단위를 쓰면 프레임 당 재생 속도를 설정할 수 있다. 8프레임이니 이 경우에 24fps는 (1000 / 24 * 8)ms가 된다.
 * <code>
 * collie.Timer.cycle(oDisplayObject, "24fps", {
 *  from : 0,
 *  to : 7
 * });
 * </code>
 */
collie.AnimationCycle = collie.Class(/** @lends collie.AnimationCycle.prototype */{
    $init : function (fCallback, nDuration, htOption) {
        this._nFPS = null;
        this._htCallback = {};
        var fSetterFPS = this._setterFPS.bind(this);
        this.optionSetter("valueSet", this._setterValueSet.bind(this));
        this.optionSetter("to", fSetterFPS);
        this.optionSetter("from", fSetterFPS);
        this.option({
            delay : 0, // 다음 싸이클 까지의 대기 시간 ms
            from : 0, // 시작 값
            to : 0, // 끝 값
            step : 1, // 단계 값
            loop : 0, // 0이 아니면 반복횟수 제한
            set : "spriteX",
            useRealTime : true,
            valueSet : null,
            start : null // 시작값이 아닌 값부터 시작할 경우 지정
        });
        this.option(htOption || {});
        this._nFrameAtRunLastest = null;
        this._nRunLastestTime = null;
        this._nRunningTime = null;
        this._nCountCycle = 0;
        this._nCountCycleBefore = 0;
        this.setDuration(nDuration);
        this.reset();
    },
    
    /**
     * 값을 초기화
     */
    reset : function () {
        this._nCount = 0;
        this._nCountCycle = 0;
        this._nCountCycleBefore = 0;
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;
        this._nRunLastestTime = null;
        this._nValue = (this._htOption.start !== null ? this._htOption.start : this._htOption.from) - this._htOption.step;      
    },
    
    /**
     * valueSet의 setter
     * @private
     */
    _setterValueSet : function () {
        var aValueSet = this._htOption.valueSet;
        
        // valueSet에 맞춰서 나머지 옵션을 변경 한다
        if (aValueSet && aValueSet instanceof Array) {
            this.option({
                from : 0,
                to : aValueSet.length - 1,
                step : 1
            });
        } 
    },
    
    /**
     * @private
     */
    _setterFPS : function () {
        if (this._nFPS !== null && typeof this._htOption.to !== "undefined" && typeof this._htOption.from !== "undefined") {
            var nCount = (this._htOption.to - this._htOption.from) + 1;
            this._nDuration = Math.round(1000 / this._nFPS * nCount); 
        }
    },
    
    /**
     * fps 처리
     * 
     * @param {Number|String} nDuration 
     * @private
     */
    setDuration : function (nDuration) {
        this._nDuration = parseInt(nDuration, 10);
        
        if (/fps/i.test(nDuration) && typeof this._htOption.to !== "undefined" && typeof this._htOption.from !== "undefined") {
            this._nFPS = parseInt(nDuration, 10);
            this._setterFPS();
        } else {
            this._nFPS = null;
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
        return this._htOption.valueSet ? this._htOption.valueSet[this._nValue] : this._nValue;
    },
    
    /**
     * 애니메이션을 실행
     * 
     * @param {Number} [nCurrentFrame] 현재 렌더러 프레임, 값이 없으면 자동으로 현재 렌더러 프레임을 가져 온다
     * @param {Number} [nFrameDuration] 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        if (typeof nCurrentFrame === "undefined") {
            nCurrentFrame = collie.Renderer.getInfo().frame;
        }
        
        // stop 된 경우
        if (this._nFrameAtRunLastest > nCurrentFrame) {
            this.reset();
            return;
        }
        
        // 시작되지 않았을 때 시작 시점 기록
        if (this._nFrameAtRunLastest === null) {
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunLastestTime = 0; // 마지막으로 실행됐던 시간
            this._nRunningTime = 0;
            nFrameDuration = 0; // 시작 시점에는 FrameDuration을 계산하지 않는다
        }
        
        if (!nFrameDuration) {
            nFrameDuration = 0;
        }
        
        var htOption = this._htOption;
        var nDiff = htOption.to - htOption.from;
        this._nTotalCount = nDiff / htOption.step; // 총 횟수
        this._nTerm = this._nDuration / this._nTotalCount; // 시간 간격
        this._nRunningTime += nFrameDuration; // 시작 시점부터 총 진행된 시간
        var nSkippedCount = (!htOption.useRealTime) ? 0 : Math.max(1, Math.floor((this._nRunningTime - this._nRunLastestTime) / this._nTerm)) - 1;
        
        // 실행되어야 할 시간이 지났다면 실행
        if (this._nRunningTime === 0 || this._nRunLastestTime + this._nTerm <= this._nRunningTime) {
            // 사이클이 끝나면 end 발생
            if (this._nCountCycleBefore !== this._nCountCycle) {
                /**
                 * 한 싸이클이 끝나면 발생함
                 * @name collie.AnimationCycle#end
                 * @event
                 * @param {Object} oEvent 컴포넌트 기본 이벤트 객체
                 */
                this.fireEvent("end");
            }
            
            // 반복 횟수를 넘었다면 종료
            if (htOption.loop && this._nCountCycle >= htOption.loop) {
                this.complete();
                return;
            }
            
            // 끝 값이면 시작 값으로 되돌림
            if (this._nValue === htOption.to) {
                this._nValue = htOption.from - htOption.step;
            }
            
            this._nValue += (htOption.step * (1 + nSkippedCount));
            this._nCount += (1 + nSkippedCount);
            this._nCountCycleBefore = this._nCountCycle;
            
            // 값을 벗어났을 때 처리
            if (htOption.from <= htOption.to ? this._nValue >= htOption.to : this._nValue <= htOption.to) {
                var nOverCount = (this._nValue - htOption.to) / htOption.step;
                var nOverCountCycle = Math.ceil(nOverCount / (this._nTotalCount + 1)); // 전체 숫자 카운트
                nOverCount = nOverCount % (this._nTotalCount + 1);
                
                if (nOverCount) { // 지나간 것
                    this._nCountCycle += nOverCountCycle;   
                    this._nValue = htOption.from + (nOverCount - 1) * htOption.step;
                } else { // 정확히 끝난 것
                    this._nCountCycle += 1;
                    this._nValue = htOption.to;
                }
            }
            
            // 객체 재활용
            this._htCallback.timer = this;
            this._htCallback.frame = nCurrentFrame;
            this._htCallback.duration = this._nDuration;
            this._htCallback.count = this._nCount;
            this._htCallback.skippedCount = nSkippedCount;
            this._htCallback.runningTime = this._nRunningTime;
            this._htCallback.value = this.getValue();
            this._htCallback.cycle = this._nCountCycle;
            this._htCallback.step = htOption.step;
            this._htCallback.from = htOption.from;
            this._htCallback.to = htOption.to;
            this.triggerCallback(this._htCallback);
            
            // 시간 진행
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunLastestTime = this._nRunningTime;
        }
    }
}, collie.Animation);