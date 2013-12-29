/**
 * 설정된 시간동안 지연 후에 실행되는 타이머
 * 
 * [튜토리얼 보기](../tutorial/timer_delay.html)
 * 
 * timeline ----------&gt;
 * action   duration *
 * @see collie.Timer
 * @class
 * @extends collie.Animation
 * @param {Function} fCallback 실행될 콜백 함수
 * @param {collie.AnimationDelay} fCallback.timer 현재 타이머 인스턴스
 * @param {Number} fCallback.frame 현재 프레임
 * @param {Number} fCallback.duration 타이머에 설정된 duraiton 값
 * @param {Number} fCallback.runningTime 타이머 시작 후 실행된 시간 (ms)
 * @param {Number} nDuration 시간 간격 ms
 */
collie.AnimationDelay = collie.Class(/** @lends collie.AnimationDelay.prototype */{
    $init : function (fCallback, nDuration) {
        this.reset();
    },

    /**
     * 값을 초기화
     */
    reset : function () {
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;
        this._nRunLastestTime = null;
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
        
        if (this._nFrameAtRunLastest === null) {
            this._nFrameAtRunLastest = nCurrentFrame;
            this._nRunLastestTime = 0;
            this._nRunningTime = 0;
            nFrameDuration = 0;
        }
        
        this._nRunningTime += nFrameDuration;

        // 처음 실행되면 기록
        if (this._nRunLastestTime + this._nDuration <= this._nRunningTime) {
            if (this._fCallback) {
                this._fCallback({
                    timer : this,
                    frame : nCurrentFrame,
                    duration : this._nDuration,
                    runningTime : this._nRunningTime
                });
            }
            
            /**
             * 애니메이션이 끝났을 때 발생
             * @name collie.AnimationDelay#complete
             * @event
             */
            this.complete();
        }
    }
}, collie.Animation);