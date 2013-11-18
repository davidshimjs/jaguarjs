/**
 * 계획된 여러 애니메이션을 다룰 수 있는 Queue
 * <a href="../tutorial/timer_queue.html" target="_blank">튜토리얼 보기</a>
 * 
 * @see collie.Timer
 * @class collie.AnimationQueue
 * @extends collie.Animation
 * @param {Object} [htOption]
 * @param {Object} [htOption.loop=1] 큐 반복 횟수, 0일 경우 무한 반복 한다
 * @example
 * collie.Timer.queue({ loop : 1 }).
 *              delay(function () {}, 1000).
 *              transition(function () {}, 1000, { from : 1, to : 1 });
 */
collie.AnimationQueue = collie.Class(/** @lends collie.AnimationQueue.prototype */{
    /**
     * @constructs
     */
    $init : function (htOption) {
        this.option("loop", 1);
        this.option(htOption || {});
        this.setOptionEvent(htOption);
        this._aAnimations = [];
        this._fOnCompleteAnimation = this._onCompleteAnimation.bind(this);
        this.reset();
    },
    
    /**
     * queue에 delay 애니메이션을 추가한다
     * @see collie.AnimationDelay
     * @return {collie.AnimationQueue} 메서드 체이닝 사용 가능
     */
    delay : function (fCallback, nDuration, htOption) {
        this._add(new collie.AnimationDelay(fCallback, nDuration, htOption));
        return this;
    },
    
    /**
     * queue에 repeat 애니메이션을 추가한다
     * @see collie.AnimationRepeat
     * @return {collie.AnimationQueue} 메서드 체이닝 사용 가능
     */
    repeat : function (fCallback, nDuration, htOption) {
        this._add(new collie.AnimationRepeat(fCallback, nDuration, htOption));
        return this;
    },
    
    /**
     * queue에 transition 애니메이션을 추가한다
     * @see collie.AnimationTransition
     * @return {collie.AnimationQueue} 메서드 체이닝 사용 가능
     */
    transition : function (fCallback, nDuration, htOption) {
        this._add(new collie.AnimationTransition(fCallback, nDuration, htOption));
        return this;
    },
    
    /**
     * queue에 cycle 애니메이션을 추가한다
     * @see collie.AnimationCycle
     * @return {collie.AnimationQueue} 메서드 체이닝 사용 가능
     */
    cycle : function (fCallback, nDuration, htOption) {
        this._add(new collie.AnimationCycle(fCallback, nDuration, htOption));
        return this;
    },
    
    /**
     * 등록된 애니메이션 인스턴스를 반환한다
     * 
     * @param {Number} nIdx 등록 순서 (0~)
     * @return {collie.Animation}
     */
    getAnimation : function (nIdx) {
        return this._aAnimations[nIdx] || false;
    },
    
    /**
     * 애니메이션 인스턴스를 추가
     * 
     * @private
     * @param {collie.Animation} oAnimation 추가될 애니메이션
     */
    _add : function (oAnimation) {
        oAnimation.attach("complete", this._fOnCompleteAnimation);
        this._aAnimations.push(oAnimation);
    },
    
    /**
     * 각 애니메이션이 종료되었을 때 처리하는 이벤트 핸들러
     * @private
     */
    _onCompleteAnimation : function () {
        this.next();
    },

    /**
     * 다음 애니메이션으로 넘긴다
     */
    next : function () {
        if (this._nAnimationIdx === null) {
            this._nAnimationIdx = 0;
        } else {
            this._nAnimationIdx++;
        }
        
        // 종료되면
        if (this._nAnimationIdx >= this._aAnimations.length) {
            this._nCount++;
            
            /**
             * 계획된 모든 애니메이션이 끝날 때 마다 발생, loop 설정과 관계 없이 매번 일어난다
             * @name collie.AnimationQueue#end
             * @event
             * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
             * @param {Object} oEvent.count 현재까지 반복된 횟수
             */
            this.fireEvent("end", {
                count : this._nCount
            });
            
            // loop 설정이 있으면 되돌림
            if (!this._htOption.loop || this._htOption.loop > this._nCount) {
                this._nAnimationIdx = 0;
            } else {
                /**
                 * 계획된 모든 애니메이션과 반복 횟수가 끝나면 발생. loop=0으로 설정하면 발생하지 않는다.
                 * @name collie.AnimationQueue#complete
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.complete();
                return;
            }
        }
        
        this._aAnimations[this._nAnimationIdx].stop();
        this._aAnimations[this._nAnimationIdx].start();
    },
    
    /**
     * 값을 초기화
     */
    reset : function () {
        this._nFrameAtRunLastest = null;
        this._nAnimationIdx = null;
        this._nCount = 0;
    },
    
    /**
     * 등록된 모든 애니메이션을 제거
     */
    removeAll : function () {
        this._aAnimations = [];
        this.reset();
    },
    
    /**
     * 현재 진행 중인 애니메이션까지 남기고 나머지를 지움
     */
    removeAfter : function () {
        if (this._nAnimationIdx + 1 <= this._aAnimations.length - 1) {
            var count = this._aAnimations.length - (this._nAnimationIdx + 1); 
            this._aAnimations.splice(this._nAnimationIdx + 1, count);
        }
    },
    
    /**
     * 애니메이션을 실행
     * 
     * @param {Number} [nCurrentFrame] 현재 렌더러 프레임, 값이 없으면 자동으로 현재 렌더러 프레임을 가져 온다
     * @param {Number} [nFrameDuration] 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        // 등록된 애니메이션이 없는 경우에는 지나감
        if (this._aAnimations.length < 1) {
            return; 
        }
        
        if (nCurrentFrame === undefined) {
            nCurrentFrame = collie.Renderer.getInfo().frame;
        }
        
        // 렌더러가 stop 된 경우
        if (this._nFrameAtRunLastest > nCurrentFrame) {
            this.reset();
            return;
        }
        
        // 시작되지 않았을 때 시작 시점 기록
        if (this._nFrameAtRunLastest === null) {
            this._nFrameAtRunLastest = nCurrentFrame;
        }
        
        if (this._nAnimationIdx === null) {
            this.next();
        }
        
        this._aAnimations[this._nAnimationIdx].run(nCurrentFrame, nFrameDuration);
    }
}, collie.Animation);