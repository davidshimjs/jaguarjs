/**
 * Timer 목록
 * 
 * @private
 * @class
 */
collie.TimerList = collie.Class(/** @lends collie.TimerList.prototype */{
    $init : function () {
        this._aList = [];
    },
    
    /**
     * 애니메이션 추가
     * 
     * @param {collie.Animation} oAnimation
     */
    add : function (oAnimation) {
        this._aList.unshift(oAnimation); // for문을 거꾸로 돌리기 위해 앞에서부터 삽입
    },
    
    /**
     * 애니메이션 제거(멈춤이라고 보면 됨)
     * 
     * @param {collie.Animation} oAnimation 제거할 애니메이션 인스턴스 
     */
    remove : function (oAnimation) {
        for (var i = 0, len = this._aList.length; i < len; i++) {
            if (this._aList[i] === oAnimation) {
                this._aList.splice(i, 1);
                break;
            }
        }
    },
    
    /**
     * 애니메이션을 모두 제거
     */
    removeAll : function () {
        this._aList = [];
    },
    
    /**
     * 애니메이션을 모두 멈춤
     */
    stopAll : function () {
        for (var i = this._aList.length - 1; i >= 0; i--) {
            this._aList[i].stop();
        }
    },
    
    /**
     * 애니메이션을 실행
     * 
     * @param {Number} nCurrentFrame 현재 프레임을 Animation 인스턴스에 전달함
     * @param {Number} nFrameDuration 진행된 프레임 시간(ms)
     */
    run : function (nCurrentFrame, nFrameDuration) {
        // 뒤에서 부터 실행해서 중간에 삭제되도 for문이 동작하도록 함
        for (var i = this._aList.length - 1; i >= 0; i--) {
            if (this._aList[i]) {
                if (this._aList[i].isPlaying()) {
                    this._aList[i].run(nCurrentFrame, nFrameDuration);
                } else {
                    // 애니메이션이 실행 중이 아닌데도 리스트에 있다면 제거
                    this._aList.splice(i, 1);
                }
            } 
        }
    }
});