/**
 * 타임라인 기반으로 애니메이션을 실행시킴
 * <a href="../tutorial/timer_timeline.html" target="_blank">튜토리얼 보기</a>
 *  
 * @see collie.Timer
 * @class collie.AnimationTimeline
 * @extends collie.Animation
 * @param {Array} aTimeline 타임라인 배열
 * @param {Object} [htOption]
 * @param {Object} [htOption.loop=1] 반복 횟수, 0일 경우 무한 반복 한다
 * @example
 * // 생성과 동시에 타임라인을 정의
 * collie.Timer.timeline([
 *      [0, "delay", function () {}, 1000],
 *      [10, "transition", function () {}, 1000, { from:1, to:1 }],
 * ]);
 * 
 * @example
 * // 생성 후 타임라인을 정의
 * var timeline = collie.Timer.timeline();
 * timeline.add(0, "delay", function () {}, 1000);
 * timeline.add(10, "transition", function () {}, 1000, { from:1, to:1 });
 * 
 * @example
 * // 타임라인 액션을 삭제
 * var timeline = collie.Timer.timeline();
 * var action = timeline.add(0, "delay", function () {}, 1000);
 * timeline.remove(10); // 10ms에 실행되는 모든 액션을 삭제
 * timeline.remove(10, action); // action만 삭제 
 */
collie.AnimationTimeline = collie.Class(/** @lends collie.AnimationTimeline.prototype */{
    /**
     * @constructs
     */
    $init : function (aTimeline, htOption) {
        this.option("loop", 1);
        this.option(htOption || {});
        this.setOptionEvent(htOption);
        this._htAnimations = {};
        this._aTimeline = null;
        this._aRunningAnimation = null;
        this._nRunningTime = null;
        this._nCountCycle = 0;
        
        if (aTimeline) {
            for (var i = 0, l = aTimeline.length; i < l; i++) {
                this.addTimeline.apply(this, aTimeline[i]);
            }
        }
                
        this.reset();
    },
    
    /**
     * 타임라인에 애니메이션을 추가
     * 
     * @param {Number} nStartTime 시작 시간(ms) 
     * @param {String|collie.Animation} 애니메이션 이름이나 애니메이션 객체를 지정한다.
     * @param {Function|Object} fCallback 각 애니메이션에 쓰이는 인자, queue 애니메이션일 경우 첫 번째 안자가 htOption이 된다
     * @param {Number} nDuration 각 애니메이션에 쓰이는 인자
     * @param {Object} htOption 각 애니메이션에 쓰이는 인자
     * @return {collie.Animation} 만들어진 애니메이션
     * @example
     * var timeline = collie.Timer.timeline();
     * 
     * // queue를 사용하는 방법
     * var queue = timeline.add(0, "queue");
     * queue.cycle(item, 1000, { from:0, to:9 });
     * 
     * // 직접 Animation 객체를 생성
     * timeline.add(100, new collie.AnimationCycle(item, 1000, { from:0, to:9 }));
     */
    add : function (nStartTime, vType, fCallback, nDuration, htOption) {
        var oAnimation;
        
        // 애니메이션 인스턴스 생성
        switch (vType) {
            case "delay" :
                oAnimation = new collie.AnimationDelay(fCallback, nDuration, htOption);                 
                break;
                
            case "repeat" :
                oAnimation = new collie.AnimationRepeat(fCallback, nDuration, htOption);
                break;
                
            case "transition" :
                oAnimation = new collie.AnimationTransition(fCallback, nDuration, htOption);
                break;
                
            case "cycle" :
                oAnimation = new collie.AnimationCycle(fCallback, nDuration, htOption);
                break;
                
            case "queue" :
                oAnimation = new collie.AnimationQueue(fCallback /* htOption임 */);
                break;
                
            default :
                if (vType instanceof collie.Animation) {
                    oAnimation = vType;
                } else {
                    throw new Error(vType + ' timer is not defined');
                }
        }
        
        this._addTimeline(nStartTime, oAnimation);
        return oAnimation;
    },
    
    /**
     * 애니메이션 인스턴스를 추가
     * 
     * @private
     * @param {Number} nStartTime 시작 시간(ms) 
     * @param {collie.Animation} oAnimation 추가될 애니메이션
     */
    _addTimeline : function (nStartTime, oAnimation) {
        nStartTime = parseInt(nStartTime, 10); // 정수로 변환
        this._htAnimations[nStartTime] = this._htAnimations[nStartTime] || []; 
        this._htAnimations[nStartTime].push(oAnimation);
        
        // 이미 초기화 됐다면 다시 초기화
        if (this._aTimeline !== null) {
            this.reset();
        }
    },
    
    /**
     * 등록된 타임라인을 제거한다
     * 
     * @param {Number} nStartTime 시작 시간(ms)
     * @param {collie.Animation} oTimer 지울 타이머, 값이 없으면 해당 시간대 전부를 지움
     */
    remove : function (nStartTime, oTimer) {
        nStartTime = parseInt(nStartTime, 10); // 정수로 변환
        
        if (this._htAnimations && this._htAnimations[nStartTime]) {
            for (var i = 0; i < this._htAnimations[nStartTime].length; i++) {
                if (typeof oTimer === "undefined" || oTimer === this._htAnimations[nStartTime][i]) {
                    this._htAnimations[nStartTime][i].stop();
                    this._htAnimations[nStartTime].splice(i, 1);
                    i--;
                    
                    if (typeof oTimer !== "undefined") {
                        break;
                    }
                }
            }
            
            // 지웠는데 더 이상 그 시간대에 타이머가 없을 경우 생성된 Timeline도 지움
            if (this._htAnimations[nStartTime].length < 1) {
                delete this._htAnimations[nStartTime];
                this._removeTimelineStartTime(nStartTime);
            }
        }
    },
    
    _removeTimelineStartTime : function (nStartTime) {
        if (this._aTimeline) {
            for (var i = 0, l = this._aTimeline.length; i < l; i++) {
                if (this._aTimeline[i] === nStartTime) {
                    this._aTimeline.splice(i, 1);
                    break;
                }
            }
        }
    },
    
    /**
     * 타임라인을 초기화
     * @private
     */
    _initTimeline : function () {
        this._aTimeline = [];
        this._aRunningAnimation = [];
        
        // 시작 시간을 넣음
        for (var i in this._htAnimations) {
            this._aTimeline.push(parseInt(i, 10));
        } 
        
        // 정렬
        this._aTimeline.sort(function (a, b) {
            return a - b;
        });
    },
    
    /**
     * 등록된 애니메이션 인스턴스를 반환한다
     * 
     * @param {Number} nStartTime 시작 시간(ms) 
     * @return {Array|Boolean} 등록된 애니메이션이 없으면 false를 반환, 반환 형식은 항상 배열임
     */
    getAnimation : function (nStartTime) {
        nStartTime = parseInt(nStartTime, 10); // 정수로 변환
        return (this._htAnimations && this._htAnimations[nStartTime]) ? this._htAnimations[nStartTime] : false;
    },
    
    /**
     * 현재까지 진행된 시간을 반환
     * @return {Number} ms 진행이 안된 상태면 0을 반환
     */
    getRunningTime : function () {
        return this._nRunningTime || 0;
    },
    
    /**
     * 현재까지 반복된 횟수
     * @return {Number}
     */
    getCycle : function () {
        return this._nCountCycle || 0;
    },
    
    /**
     * 값을 초기화
     */
    reset : function () {
        this._nFrameAtRunLastest = null;
        this._nRunningTime = null;      
        this._aTimeline = null;
        this._aRunningAnimation = null;
        this._nCountCycle = 0;
        this._initTimeline();
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
        
        // 진행될 액션이 있을 경우 추가
        if (this._aTimeline.length > 0) {
            while (this._aTimeline[0] <= this._nRunningTime) {
                var nStartTime = this._aTimeline.shift();
                
                for (var i = 0, l = this._htAnimations[nStartTime].length; i < l; i++) {
                    this._aRunningAnimation.push(this._htAnimations[nStartTime][i]);
                    this._htAnimations[nStartTime][i].start();
                }
            }
        }
        
        // 진행중인 액션이 있을 경우 run 전달
        if (this._aRunningAnimation.length > 0) {
            for (var i = 0; i < this._aRunningAnimation.length; i++) {
                if (this._aRunningAnimation[i]) {
                    this._aRunningAnimation[i].run(nCurrentFrame, nFrameDuration);
                }
                
                if (!this._aRunningAnimation[i] || !this._aRunningAnimation[i].isPlaying()) {
                    if (this._aRunningAnimation[i]) {
                        this._aRunningAnimation[i].reset();
                    }
                    
                    this._aRunningAnimation.splice(i, 1);
                    i--;
                    this._checkComplete();
                }
            }
        }
    },
    
    _checkComplete : function () {
        // 끝났으면
        if (this._aRunningAnimation.length < 1 && this._aTimeline.length < 1) {
            this._nCountCycle++;
            
            if (this._htOption.loop && this._htOption.loop <= this._nCountCycle) {
                /**
                 * 계획된 모든 애니메이션과 반복 횟수가 끝나면 발생. loop=0으로 설정하면 발생하지 않는다.
                 * @name collie.AnimationTimeline#complete
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.complete();
            } else {
                /**
                 * loop가 있을 경우 모든 타임라인 액션이 한 번 끝났을 때 발생
                 * @name collie.AnimationTimeline#end
                 * @event
                 * @param {Object} oEvent 기본 컴포넌트 이벤트 객체
                 */
                this.fireEvent("end");
                this._nFrameAtRunLastest = null;
                this._nRunningTime = null;      
                this._aTimeline = null;
                this._aRunningAnimation = null;
                this._initTimeline();
            }
        }
    }
}, collie.Animation);