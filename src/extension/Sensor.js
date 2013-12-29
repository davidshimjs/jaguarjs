/**
 * A Simple 1:N Collision Detection
 * 
 * @class
 * @extends collie.Component
 * @param {Object} htOption
 * @param {Number} [htOption.frequency=3] Check Frequency, 1이면 매 프레임 마다, 10이면 10프레임 마다 한 번씩 체크한다 
 * @param {Number} [htOption.cacheSize=80] 캐시 타일 크기 단위는 px 
 * @param {Boolean} [htOption.useDebug=false] 충돌체크 영역을 화면에 표시
 * @param {String} [htOption.debugColor=yellow] 충돌체크 영역의 색, useDebug를 활성화할 때 사용한다
 * @param {String} [htOption.debugListenerColor=yellow] 리스너의 충돌체크 영역의 색, useDebug를 활성화할 때 사용한다
 * @param {Number} [htOption.debugOpacity=0.5] 충돌체크 영역의 투명도, useDebug를 활성화할 때 사용한다
 * @requires collie.addon.js
 * @example
 * var sensor = new collie.Sensor({
 *  frequency : 10
 * });
 * 
 * // Add target objects
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * 
 * // Add target object that has a circle shape
 * sensor.add(oDisplayObjectTarget, "otherText", 15); // radius
 * 
 * // Add target object that has a margin of width and a margin of height
 * sensor.add(oDisplayObjectTarget, "otherText", 10, 20); // a margin of width, a margin of height
 * 
 * // Add a listener object for detecting target objects set a category as "anyCategory"
 * sensor.addListener(oDisplayObjectListener, "anyText", function (a, b) {
 *  // begin collision
 * }, function (a, b) {
 *  // end collision
 * });
 * 
 * // Add a listener object that has a circle shape
 * sensor.addListener(oDisplayObjectListener, "anyText", function (a, b) {
 *  // begin collision
 * }, function (a, b) {
 *  // end collision
 * }, 15); // radius
 * 
 * // start sensing
 * sensor.start();
 * 
 * // stop sensing
 * sensor.stop();
 */
collie.Sensor = collie.Class(/** @lends collie.Sensor.prototype */{
    /**
     * If you want to make sensitive higher a case of pass through like a bullet, you should decrease this value. (px) It will affect the performance
     * @type {Number}
     */
    RAY_SENSING_DISTANCE : 10, // px
    
    $init : function (htOption) {
        this.option({
            frequency : 3,
            cacheSize : 80,
            useDebug : false,
            debugListenerColor : "red",
            debugColor : "yellow",
            debugOpacity : 0.5
        });
        
        if (typeof htOption !== "undefined") {
            this.option(htOption);
        }
        
        this._nCurrentFrame = null;
        this._nAccumulateFrame = 0; 
        this._aListeners = [];
        this._htListenerCollision = {};
        this._htObject = {};
        this._htCacheMap = {};
        this._htCustomAreaCircle = {};
        this._htCustomAreaBox = {};
        this._fUpdate = this._onProcess.bind(this);
    },
    
    /**
     * 충돌 체크를 일괄적으로 진행
     * 
     * @private
     * @param {Number} nFrame 진행된 프레임 수
     */
    update : function (nFrame) {
        if (this._nCurrentFrame === null || this._nCurrentFrame > nFrame) {
            this._nCurrentFrame = nFrame;
        }
        
        this._nAccumulateFrame += (nFrame - this._nCurrentFrame);
        this._nCurrentFrame = nFrame;
        
        // 빈도 수가 채워지면 그 때 확인 함
        if (this._nAccumulateFrame >= this._htOption.frequency) {
            this._nAccumulateFrame = 0;
            this._makeCacheMap();
            this._htListenerCollisionBefore = this._htListenerCollision;
            this._htListenerCollision = {};
            
            for (var i = 0, l = this._aListeners.length; i < l; i++) {
                var listener = this._aListeners[i];
                var htBoundary = this._getBoundary(listener.displayObject);
                this._makeCustomArea(listener.displayObject, htBoundary);
                this.detect(listener.displayObject, listener.category, htBoundary, listener.beginCallback, listener.endCallback);
            }
        }
    },
    
    _getBoundary : function (oDisplayObject) {
        var nBeforeLeft = null;
        var nBeforeRight = null;
        var nBeforeTop = null;
        var nBeforeBottom = null;
        var points;
        
        // 이전 움직임이 있다면 저장
        if (oDisplayObject._htBoundary !== null) {
            nBeforeLeft = oDisplayObject._htBoundary.left;
            nBeforeTop = oDisplayObject._htBoundary.top;
            nBeforeBottom = oDisplayObject._htBoundary.bottom;
            nBeforeRight = oDisplayObject._htBoundary.right;
            points = oDisplayObject._htBoundary.points;
        }
        
        var htBoundary = oDisplayObject.getBoundary(true, true);
        
        // 의미 있게 움직였다면 영역 확장 함
        if (nBeforeLeft !== null && (
            Math.abs(nBeforeLeft - htBoundary.left) >= this.RAY_SENSING_DISTANCE ||
            Math.abs(nBeforeTop - htBoundary.top) >= this.RAY_SENSING_DISTANCE
        )) {
            points.push(htBoundary.points[0]);
            points.push(htBoundary.points[1]);
            points.push(htBoundary.points[2]);
            points.push(htBoundary.points[3]);
            
            htBoundary.expanded = {
                left : Math.min(nBeforeLeft, htBoundary.left),  
                right : Math.max(nBeforeRight, htBoundary.right),
                top : Math.min(nBeforeTop, htBoundary.top),
                bottom : Math.max(nBeforeBottom, htBoundary.bottom),
                points : points,
                isExpanded : true
            };
        } else {
            htBoundary.expanded = htBoundary;
            htBoundary.expanded.isExpanded = false; 
        }
                
        return htBoundary;
    },
    
    /**
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Object} htBoundary
     * @private
     */
    _makeCustomArea : function (oDisplayObject, htBoundary) {
        var nId = oDisplayObject.getId();
        
        if (this._htCustomAreaBox[nId] || this._htCustomAreaCircle[nId]) {
            htBoundary.isTransform = true;
            htBoundary.centerX = htBoundary.points[0][0] + (htBoundary.points[2][0] - htBoundary.points[0][0]) / 2;
            htBoundary.centerY = htBoundary.points[0][1] + (htBoundary.points[2][1] - htBoundary.points[0][1]) / 2;
            
            // 상자면 미리 구해 놓기
            if (this._htCustomAreaBox[nId]) {
                var minX = Number.MAX_VALUE;
                var minY = Number.MAX_VALUE;
                var maxX = -Number.MAX_VALUE;
                var maxY = -Number.MAX_VALUE;
                 
                for (var i = 0, l = htBoundary.points.length; i < l; i++) {
                    var point = htBoundary.points[i];
                    var theta = Math.atan2(htBoundary.centerY - point[1], htBoundary.centerX - point[0]);
                    point[0] += this._htCustomAreaBox[nId] * Math.cos(theta);
                    point[1] += this._htCustomAreaBox[nId] * Math.sin(theta);
                    
                    minX = Math.min(minX, point[0]);
                    maxX = Math.max(maxX, point[0]);
                    minY = Math.min(minY, point[1]);
                    maxY = Math.max(maxY, point[1]);
                }
                
                htBoundary.left = minX;
                htBoundary.right = maxX;
                htBoundary.top = minY;
                htBoundary.bottom = maxY;
            }
        }
    },
    
    /**
     * @private
     */
    _makeCacheMap : function () {
        var displayObject;
        var startX;
        var startY;
        var endX;
        var endY;
        
        for (var key in this._htObject) {
            this._htCacheMap[key] = {};
            
            for (var i = 0, l = this._htObject[key].length; i < l; i++) {
                displayObject = this._htObject[key][i];
                var htBoundary = this._getBoundary(displayObject);
                startX = Math.floor(htBoundary.expanded.left / this._htOption.cacheSize);
                endX = Math.floor(htBoundary.expanded.right / this._htOption.cacheSize);
                startY = Math.floor(htBoundary.expanded.top / this._htOption.cacheSize);
                endY = Math.floor(htBoundary.expanded.bottom / this._htOption.cacheSize);
                this._makeCustomArea(displayObject, htBoundary);
                
                // 타일에 객체 담아 둠
                for (var row = startY; row <= endY; row++) {
                    this._htCacheMap[key][row] = this._htCacheMap[key][row] || {};
                    
                    for (var col = startX; col <= endX; col++) {
                        this._htCacheMap[key][row][col] = this._htCacheMap[key][row][col] || [];
                        this._htCacheMap[key][row][col].push(displayObject);
                    }
                }
            }
        }
    },
    
    /**
     * 충돌 갑지 체크
     * 
     * @param {collie.DisplayObject} oDisplayObject 등록된 객체들과 충돌 감지할 객체
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Object} htBoundaryListener Listener의 Boundary는 미리 구해 놓는다
     * @param {Function} fBeginCallback 충돌이 일어났을 때 실행될 함수
     * @param {Function} fEndCallback 충돌이 끝났을 때 실행될 함수
     */
    detect : function (oDisplayObject, sCategory, htBoundaryListener, fBeginCallback, fEndCallback) {
        if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.detect(oDisplayObject, aCategories[i], htBoundaryListener, fBeginCallback, fEndCallback);
            }
        } else {
            var startX = Math.floor(htBoundaryListener.expanded.left / this._htOption.cacheSize);
            var endX = Math.floor(htBoundaryListener.expanded.right / this._htOption.cacheSize);
            var startY = Math.floor(htBoundaryListener.expanded.top / this._htOption.cacheSize);
            var endY = Math.floor(htBoundaryListener.expanded.bottom / this._htOption.cacheSize);
            var idA = oDisplayObject.getId();
            
            if (this._htCacheMap[sCategory]) {
                for (var row = startY; row <= endY; row++) {
                    for (var col = startX; col <= endX; col++) {
                        if (this._htCacheMap[sCategory][row] && this._htCacheMap[sCategory][row][col]) {
                            for (var i = 0, l = this._htCacheMap[sCategory][row][col].length; i < l; i++) {
                                var target = this._htCacheMap[sCategory][row][col][i];
                                var idB = target.getId();
                                
                                // 이미 충돌 했다면 지나감
                                if (this._htListenerCollision[idA] && this._htListenerCollision[idA][idB]) {
                                    continue;
                                }
                                
                                var bIsHit = this._hitTest(oDisplayObject, target, htBoundaryListener, target._htBoundary);
                                var bIsInCollision = (this._htListenerCollisionBefore[idA] && this._htListenerCollisionBefore[idA][idB]);
                                
                                // 만났을 떄
                                if (bIsHit) {
                                    this._htListenerCollision[idA] = this._htListenerCollision[idA] || {};
                                    this._htListenerCollision[idA][idB] = true;
                                    
                                    if (!bIsInCollision) {
                                        fBeginCallback(oDisplayObject, target);
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 충돌이 일어난 것중에 다시 만나지 않은 것이 있다면 end 호출
                for (var idB in this._htListenerCollisionBefore[idA]) {
                    if (!this._htListenerCollision[idA] || !this._htListenerCollision[idA][idB]) {
                        fEndCallback(oDisplayObject, collie.util.getDisplayObjectById(idB));
                    }
                }
            }
        }
    },
    
    /**
     * 충돌 테스트
     * @private
     * @param {collie.DisplayObject} oA
     * @param {collie.DisplayObject} oB
     * @param {Object} htA collie.DisplayObject#getBoundary
     * @param {Object} htB collie.DisplayObject#getBoundary
     * @return {Boolean} 겹치면 true
     */
    _hitTest : function (oA, oB, htA, htB) {
        var idA = oA.getId();
        var idB = oB.getId();
        
        // 둘 중에 하나라도 벗어나는게 있다면 겹치는게 아님
        if (
            (htA.expanded.left > htB.expanded.right || htB.expanded.left > htA.expanded.right) || 
            (htA.expanded.top > htB.expanded.bottom || htB.expanded.top > htA.expanded.bottom)
            ) {
            return false;
        } else if (htA.isTransform || htB.isTransform || htA.expanded.isExpanded || htB.expanded.isExpanded) {
            // 빠르게 움직일 땐 사각형 모델을 적용함
            if (htA.expanded.isExpanded || htB.expanded.isExpanded || (!this._htCustomAreaCircle[idA] && !this._htCustomAreaCircle[idB])) {
                if (
                    (
                        htA.expanded.left <= htB.expanded.left &&
                        htA.expanded.top <= htB.expanded.top &&
                        htA.expanded.right >= htB.expanded.right &&
                        htA.expanded.bottom >= htB.expanded.bottom
                    ) || (
                        htA.expanded.left > htB.expanded.left &&
                        htA.expanded.top > htB.expanded.top &&
                        htA.expanded.right < htB.expanded.right &&
                        htA.expanded.bottom < htB.expanded.bottom
                    )
                ) {
                    return true;
                }
                
                // 교차하는 선이 있으면 true
                //TODO O(N^2)보다 더 빠른 알고리즘이 있었으면 좋겠음
                for (var i = 0, l = htA.expanded.points.length; i < l; i++) {
                    var a1 = htA.expanded.points[i];
                    var a2 = htA.expanded.points[(i === l - 1) ? 0 : i + 1];
                    
                    for (var j = 0, jl = htB.expanded.points.length; j < jl; j++) {
                        var b1 = htB.expanded.points[j];
                        var b2 = htB.expanded.points[(j === jl - 1) ? 0 : j + 1];
                        
                        if (this._isIntersectLine(a1, a2, b1, b2)) {
                            return true;
                        }
                    }
                }
            } else if (this._htCustomAreaCircle[idA] && this._htCustomAreaCircle[idB]) {
                return collie.util.getDistance(htA.centerX, htA.centerY, htB.centerX, htB.centerY) <= this._htCustomAreaCircle[idA] + this._htCustomAreaCircle[idB];
            } else  {
                var box;
                var circle;
                var radius;
                
                if (this._htCustomAreaCircle[idB]) {
                    box = htA;
                    circle = htB;
                    radius = this._htCustomAreaCircle[idB];
                } else {
                    box = htB;
                    circle = htA;
                    radius = this._htCustomAreaCircle[idA];
                }
                
                for (var i = 0, l = box.points.length; i < l; i++) {
                    var a1 = htA.points[i];
                    var a2 = htA.points[(i === l - 1) ? 0 : i + 1];
                    var theta = Math.atan((circle.centerY - a1[1]) / (circle.centerX - a1[0]));
                    theta -= Math.atan((a2[1] - a1[1]) / (a2[0] - a1[0]));
                    
                    if (Math.sin(theta) * collie.util.getDistance(circle.centerX, circle.centerY, a1[0], a1[1]) <= radius) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // 교차하는 선이 없으면 false
            return false;
        } else {
            return true;
        }
    },
    
    /**
     * @private
     * @param {Array} a1
     * @param {Array} a2
     * @param {Array} b1
     * @param {Array} b2
     * @return {Boolean} 겹치면 true
     */
    _isIntersectLine : function (a1, a2, b1, b2) {
        var denom = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);
        
        if (denom === 0) {
            return false;
        }
        
        var _t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
        var _s = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
        var t = _t / denom;
        var s = _s / denom;
        // var x = a1[0] + t * (a2[0] - a1[0]);
        // var y = a1[1] + t * (a2[1] - a1[1]);
                
        if ((t < 0 || t > 1 || s < 0 || s > 1) || (_t === 0 && _s === 0)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 충돌감지 보고를 받을 객체를 등록
     * 
     * @param {collie.DisplayObject} oDisplayObject 등록된 객체들과 충돌 감지할 객체
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Function} fBeginCallback 충돌이 일어났을 때 실행될 함수
     * @param {collie.DisplayObject} fBeginCallback.listener 리스너 객체
     * @param {collie.DisplayObject} fBeginCallback.trigger 충돌이 일어난 객체
     * @param {Function} fEndCallback 충돌이 끝났을 때 실행될 함수
     * @param {collie.DisplayObject} fEndCallback.listener 리스너 객체
     * @param {collie.DisplayObject} fEndCallback.trigger 충돌이 일어난 객체
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    addListener : function (oDisplayObject, sCategory, fBeginCallback, fEndCallback, vWidth, nHeight) {
        this._aListeners.push({
            category : sCategory,
            displayObject : oDisplayObject,
            beginCallback : fBeginCallback,
            endCallback : fEndCallback
        });
        
        this._addCustomArea(oDisplayObject, vWidth, nHeight);
        
        // 디버깅 모드면 영역을 표시
        if (this._htOption.useDebug) {
            this._drawArea(oDisplayObject, true, vWidth, nHeight);
        }
    },
    
    /**
     * 충돌 감지에 객체 등록
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    add : function (oDisplayObject, sCategory, vWidth, nHeight) {
        if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.add(oDisplayObject, aCategories[i], vWidth, nHeight);
            }
        } else {
            this._htObject[sCategory] = this._htObject[sCategory] || [];
            this._htObject[sCategory].push(oDisplayObject);
            this._addCustomArea(oDisplayObject, vWidth, nHeight);
            
            // 디버깅 모드면 영역을 표시
            if (this._htOption.useDebug) {
                this._drawArea(oDisplayObject, false, vWidth, nHeight);
            }
        }
    },
    
    /**
     * 충돌 감지에서 제거
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,), 값이 없을 시에는 모든 카테고리에서 제거
     */
    remove : function (oDisplayObject, sCategory) {
        if (!sCategory) {
            for (var i in this._htObject) {
                this.remove(oDisplayObject, i);
            }
        } else if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.remove(oDisplayObject, aCategories[i]);
            }
        } else if (this._htObject[sCategory]) {
            for (var i = 0, l = this._htObject[sCategory].length; i < l; i++) {
                if (this._htObject[sCategory][i] === oDisplayObject) {
                    if (this._htCustomAreaCircle[oDisplayObject.getId()]) {
                        delete this._htCustomAreaCircle[oDisplayObject];
                    }
                    
                    if (this._htCustomAreaBox[oDisplayObject.getId()]) {
                        delete this._htCustomAreaBox[oDisplayObject];
                    }
                    
                    this._htObject[sCategory].splice(i, 1);
                    break;
                }
            }
        }
    },
    
    /**
     * @private
     * @param {collie.DisplayObject} oDisplayObject 대상 객체
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    _addCustomArea : function (oDisplayObject, vWidth, nHeight) {
        // 사각형
        if (typeof nHeight !== "undefined") {
            this._htCustomAreaBox[oDisplayObject.getId()] = Math.sqrt(Math.pow(vWidth, 2) + Math.pow(nHeight, 2)); // 대각선 길이 
        } else if (typeof vWidth !== "undefined") { // 원형
            this._htCustomAreaCircle[oDisplayObject.getId()] = vWidth; // 반지름 길이
        }
    },
    
    /**
     * 감지 시작
     */
    start : function () {
        collie.Renderer.attach("process", this._fUpdate);
    },
    
    /**
     * 감지 끝
     */
    stop : function () {
        collie.Renderer.detach("process", this._fUpdate);
        this._nCurrentFrame = null;
        this._nAccumulateFrame = 0;
    },
    
    /**
     * collie.Renderer의 process 이벤트 리스너
     * @private
     */
    _onProcess : function (e) {
        this.update(e.frame);
    },
    
    /**
     * 충돌 영역을 그림
     * 
     * @private
     * @param {Boolean} bListener 리스너 여부
     */
    _drawArea : function (oDisplayObject, bListener, vWidth, nHeight) {
        var sColor = bListener ? this._htOption.debugListenerColor : this._htOption.debugColor;
        var id = oDisplayObject.getId();
        
        if (this._htCustomAreaCircle[id]) {
            var circle = new collie.Circle({
                radius : this._htCustomAreaCircle[id],
                fillColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
            
            circle.center(oDisplayObject._htOption.width / 2, oDisplayObject._htOption.height / 2);
        } else if (this._htCustomAreaBox[id]) {
            new collie.DisplayObject({
                x : vWidth,
                y : nHeight,
                width : oDisplayObject._htOption.width - vWidth * 2,
                height : oDisplayObject._htOption.height - nHeight * 2,
                backgroundColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
        } else {
            new collie.DisplayObject({
                width : oDisplayObject._htOption.width,
                height : oDisplayObject._htOption.height,
                backgroundColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
        }
    }
}, collie.Component);