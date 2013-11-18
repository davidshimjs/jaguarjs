/**
 * 특정 시간 간격으로 계속 반복되는 타이머
 * <a href="../tutorial/timer_repeat.html" target="_blank">튜토리얼 보기</a>
 * 
 * timeline ---------------------------------&gt;
 * action   * duration * duration * duration *
 * @see collie.Timer
 * @class collie.AnimationRepeat
 * @extends collie.Animation
 * @param {Function} fCallback 실행될 콜백 함수
 * @param {collie.AnimationCycle} fCallback.timer 현재 타이머 인스턴스
 * @param {Number} fCallback.frame 현재 프레임
 * @param {Number} fCallback.duration 타이머에 설정된 duraiton 값
 * @param {Number} fCallback.count 실행 횟수
 * @param {Number} fCallback.skippedCount 지나간 실행 횟수
 * @param {Number} fCallback.runningTime 타이머 시작 후 실행된 시간 (ms)
 * @param {Number} nDuration 시간 간격 ms
 * @param {Object} [htOption]
 * @param {Number} [htOption.beforeDelay=0] 시작되기 전에 지연시간(ms)
 * @param {Number} [htOption.loop=0] 반복 횟수(0이면 무한 반복, complete 이벤트가 일어나지 않는다)
 * @param {Number} [htOption.useRealTime=true] SkippedFrame을 적용해서 count 값을 보정한다
 */
collie.AnimationRepeat = collie.Class(/** @lends collie.AnimationRepeat.prototype */{
    /**
     * @constructs
     */
    $init : function (fCallback, nDuration, htOption) {
        this.option({
            beforeDelay : 0,
            afterDelay : 0,
            loop : 0,
            useRealTime : true
        });
        this.option(htOption || {});
        this.reset();
        this.setDuration(nDuration);
        this._nFrameAtRunLastest = null;
    },

    /**
     * Duration을 설정
     * Repeat는 Renderer의 Duration보다 짧게 실행할 수 없기 때문에 값을 보정한다
     * 
     * @param {Number} nDuration 실행 시간, 지연 시간 설정 (ms)
     */
    setDuration : function (nDuration) {
        nDuration = parseInt(nDuration, 10);
        
        if (nDuration < collie.Renderer.getDuration()) {
            nDuration = collie.Renderer.getDuration();
        }
        
        this._nDuration = nDuration;
    },
    
    /**
     * 값을 초기화
     */
    reset : function () {
        this._nCount = 0;
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;
        this._nRunLastestTime = null;
        this._nBeforeDelay = this._htOption.beforeDelay;
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
        
        // stop 된 경우
        if (this._nFrameAtRunLastest > nCurrentFrame) {
            this.reset();
            return;
        }
        
        // 시작되지 않았을 때 시작 시점 기록
        if (this._nFrameAtRunLastest === null) {
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunningTime = 0;
            this._nRunLastestTime = 0;
            nFrameDuration = 0;
        }
        
        this._nRunningTime += nFrameDuration;
        var nSkippedCount = Math.max(1, Math.floor((this._nRunningTime - this._nRunLastestTime) / this._nDuration)) - 1;
        
        // 시작 지연시간
        if (this._nCount === 0 && this._nBeforeDelay) {
            // 끝날 때 되면 처리
            if (this._nRunLastestTime + this._nBeforeDelay <= this._nRunningTime) {
                this.reset();
                this._nBeforeDelay = 0;
            }
            return;
        }
        
        // 실행되어야 할 시간이 지났다면 실행
        if (this._nRunningTime === 0 || this._nRunLastestTime + this._nDuration <= this._nRunningTime) {
            this._nCount += this._htOption.useRealTime ? 1 + nSkippedCount : 1;
            this._fCallback({
                timer : this,
                frame : nCurrentFrame,
                duration : this._nDuration,
                count : this._nCount,
                skippedCount : nSkippedCount,
                runningTime : this._nRunningTime
            });
            
            if (this._htOption.loop && this._htOption.loop <= this._nCount) {
                /**
                 * 계획된 모든 애니메이션과 반복 횟수가 끝나면 발생. loop=0으로 설정하면 발생하지 않는다.
                 * @name collie.AnimationRepeat#complete
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.complete();
                return;
            }
            
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunLastestTime = this._nRunningTime;
        }
    }
}, collie.Animation);