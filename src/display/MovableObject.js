/**
 * 속도, 가속도, 마찰력, 질량을 포함한 표시 객체
 * - rotate는 마찰력이 없다
 * @class collie.MovableObject
 * @deprecated DisplayObject에 기능 추가
 * @extends collie.DisplayObject
 * @param {Object} [htOption] 설정
 * @param {Number} [htOption.velocityX=0] x축 속도(초당 px)
 * @param {Number} [htOption.velocityY=0] y축 속도(초당 px)
 * @param {Number} [htOption.velocityRotate=0] 회전 속도(초당 1도)
 * @param {Number} [htOption.forceX=0] x축 힘(초당 px)
 * @param {Number} [htOption.forceY=0] y축 힘(초당 px)
 * @param {Number} [htOption.forceRotate=0] 회전 힘(초당 1도)
 * @param {Number} [htOption.mass=1] 질량
 * @param {Number} [htOption.friction=0] 마찰력
 * @param {Boolean} [htOption.useRealTime=true] SkippedFrame을 적용해서 싸이클을 현재 시간과 일치
 */
collie.MovableObject = collie.Class(/** @lends collie.MovableObject.prototype */{
    /**
     * @constructs
     */
    $init : function (htOption) {
        // this.option({
            // velocityX : 0,
            // velocityY : 0,
            // velocityRotate : 0,
            // forceX : 0,
            // forceY : 0,
            // forceRotate : 0,
            // mass : 1, // 질량
            // friction : 0, // 마찰
            // useRealTime : true
        // }, null, true);
    }
    
    /**
     * 화면을 업데이트
     * 
     * @private
     */
    // update : function (nFrameDuration, nX, nY, nLayerWidth, nLayerHeight) {
        // var nFrame = Math.max(17, nFrameDuration) / 1000;
//      
        // // skippedFrame 적용을 하지 않는다면 1frame 씩만 그림
        // if (!this._htOption.useRealTime) {
            // nFrame = 1;
        // }
//      
        // this._applyForce(nFrame);
        // this._applyRotation(nFrame);
        // this.constructor.$super.update.call(this, nFrameDuration, nX, nY, nLayerWidth, nLayerHeight);
//      
        // // 움직임이 있으면 다시 바뀐 상태로 둠
        // if (
                // this._htOption.velocityX !== 0 ||
                // this._htOption.velocityY !== 0 ||
                // this._htOption.velocityRotate !== 0 ||
                // this._htOption.forceX !== 0 ||
                // this._htOption.forceY !== 0 ||
                // this._htOption.forceRotate !== 0
                // ) {
            // this.setChanged(true);
        // }
    // },
    
    /**
     * @private
     */
    // _getValueDirection : function (nValue) {
        // return Math.abs(nValue) / nValue;
    // },
    
    /**
     * 회전 힘, 속도를 반영
     * @private
     */
    // _applyRotation : function (nFrame) {
        // if (this._htOption.forceRotate !== 0) {
            // this.set("velocityRotate", this._htOption.velocityRotate + this._htOption.forceRotate);
        // }
//      
        // if (this._htOption.velocityRotate !== 0) {
            // var nAngleRad = collie.util.fixAngle(collie.util.toRad(this._htOption.angle + this._htOption.velocityRotate * nFrame));
            // this.set("angle", Math.round(collie.util.toDeg(nAngleRad) * 1000) / 1000);
        // }
    // },
    
    /**
     * 힘을 속도에 반영
     *  
     * @private
     */
    // _applyForce : function (nFrame) {
        // var htInfo = this.get();
        // var nVelocityX = htInfo.velocityX;
        // var nVelocityY = htInfo.velocityY;
        // var nX = htInfo.x;
        // var nY = htInfo.y;
//      
        // // 힘 적용 a = F / m
        // nVelocityX += (htInfo.forceX / htInfo.mass) * nFrame;
        // nVelocityY += (htInfo.forceY / htInfo.mass) * nFrame;
//      
        // // 마찰력 적용
        // var nForceFrictionX = htInfo.friction * nVelocityX * htInfo.mass * nFrame;
        // var nForceFrictionY = htInfo.friction * nVelocityY * htInfo.mass * nFrame;
//      
        // if (nVelocityX !== 0) {
            // nVelocityX = (this._getValueDirection(nVelocityX) !== this._getValueDirection(nVelocityX - nForceFrictionX)) ? 0 : nVelocityX - nForceFrictionX;
        // }
//      
        // if (nVelocityY !== 0) {
            // nVelocityY = (this._getValueDirection(nVelocityY) !== this._getValueDirection(nVelocityY - nForceFrictionY)) ? 0 : nVelocityY - nForceFrictionY;
        // }
//      
        // nX += nVelocityX * nFrame;
        // nY += nVelocityY * nFrame;
        // nVelocityX = Math.floor(nVelocityX * 1000) / 1000;
        // nVelocityY = Math.floor(nVelocityY * 1000) / 1000;
//      
        // if (htInfo.friction && Math.abs(nVelocityX) < 0.05) {
            // nVelocityX = 0;
        // }
//      
        // if (htInfo.friction && Math.abs(nVelocityY) < 0.05) {
            // nVelocityY = 0;
        // }
//  
        // // 변경이 있을 때만 설정
        // if (
            // nX != htInfo.x ||
            // nY != htInfo.y ||
            // nVelocityX != htInfo.velocityX ||
            // nVelocityY != htInfo.velocityY
        // ) {
            // this.set({
                // x : nX,
                // y : nY,
                // velocityX : nVelocityX,
                // velocityY : nVelocityY
            // });
        // }
    // },
    
    /**
     * 문자열로 클래스 정보 반환
     * 
     * @deprecated
     * @return {String}
     */
    // toString : function () {
        // return "MovableObject" + (this._htOption.name ? " " + this._htOption.name : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    // }
}, collie.DisplayObject);