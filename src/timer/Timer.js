/**
 * 타이머를 생성 / 관리. 모든 타이머는 collie.Timer에서 생성한다
 * @namespace
 */
collie.Timer = collie.Timer || new (collie.Class(/** @lends collie.Timer */{
    $init : function () {
        this._oList = new collie.TimerList();
    },
    
    /**
     * 렌더러에서 렌더링 하기 전에 타이머를 실행 한다.
     * 
     * @param {Number} nCurrentFrame 현재 프레임
     * @param {Number} nFrameDuration 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        this._oList.run(nCurrentFrame, nFrameDuration);
    },
    
    /**
     * 전체를 멈춘다
     * - 개별적으로 멈추는건 각각 타이머 인스턴스에서 stop을 호출
     */
    stopAll : function () {
        this._oList.stopAll();
    },
    
    /**
     * 전체 타이머를 제거 한다
     */
    removeAll : function () {
        this._oList.removeAll();
    },
    
    /**
     * @see collie.AnimationQueue
     * @arguments collie.AnimationQueue
     * @return {collie.AnimationQueue}
     */
    queue : function (htOption) {
        var oAnimation = new collie.AnimationQueue(htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    },
    
    /**
     * @see collie.AnimationRepeat
     * @arguments collie.AnimationRepeat
     * @return {collie.AnimationRepeat}
     */
    repeat : function (fCallback, nDuration, htOption) {
        var oAnimation = new collie.AnimationRepeat(fCallback, nDuration, htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    },
    
    /**
     * @see collie.AnimationTransition
     * @arguments collie.AnimationTransition
     * @return {collie.AnimationTransition}
     */
    transition : function (fCallback, nDuration, htOption) {
        var oAnimation = new collie.AnimationTransition(fCallback, nDuration, htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    },
    
    /**
     * @see collie.AnimationCycle
     * @arguments collie.AnimationCycle
     * @return {collie.AnimationCycle}
     */
    cycle : function (fCallback, nDuration, htOption) {
        var oAnimation = new collie.AnimationCycle(fCallback, nDuration, htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    },
    
    /**
     * @see collie.AnimationDelay
     * @arguments collie.AnimationDelay
     * @return {collie.AnimationDelay}
     */
    delay : function (fCallback, nDuration, htOption) {
        var oAnimation = new collie.AnimationDelay(fCallback, nDuration, htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    },
    
    /**
     * @see collie.AnimationTimeline
     * @arguments collie.AnimationTimeline
     * @return {collie.AnimationTimeline}
     */
    timeline : function (aTimeline, htOption) {
        var oAnimation = new collie.AnimationTimeline(aTimeline, htOption);
        oAnimation.setTimerList(this._oList);
        return oAnimation;
    }
}))();