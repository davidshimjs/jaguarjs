/**
 * @namespace
 */
var collie = collie || {};

(function () {
    /**
     * 콜리 버전
     * 
     * @name collie.version
     * @description 자동 치환되므로 직접 수정하지 않는다.
     */
    collie.version = "{{version}}";

    /**
     * 클래스 만들기
     * 
     * @method collie#Class
     * @param {Object} o 클래스 멤버, $init을 이용해 생성자를 정의할 수 있다.
     * @param {collie.Class} oParent 상속받을 부모 클래스
     * @return {collie.Class}
     * @example
     * <code>
     * var Person = collie.Class({
     *  gender : false,
     *  walk : function () { return "walking!"; }
     * });
     * 
     * var Male = collie.Class({
     *  name : "",
     *  gender : "male"
     * }, Person);
     * 
     * var oDavid = new Male();
     * oDavid.name = "david";
     * 
     * alert(oDavid.name); // david
     * alert(oDavid.gender); // male
     * alert(oDavid.walk()); // walking!
     * </code>
     * @example
     * override
     * <code>
     * var Person = collie.Class({
     *  testMethod : function () {
     *  
     *  }
     * });
     * 
     * var Male = collie.Class({
     *  testMethod : function () {
     *      // blah
     *      this.constructor.$super.testMethod.apply(this, arguments);      
     *  }
     * }, Person);
     * </code>
     * @example
     * You can also use create a instance without 'new' keyword
     * <code>
     * var Person = collie.Class({
     *  $init : function () {
     *  },
     *  test : function () {
     *  }
     * });
     * 
     * var a = new Person();
     * var b = Person(); // It works fine!
     * </code>
     */
    collie.Class = function (o, oParent) {      
        var $init = null;
        var checkDirectCall = function () { return true; };
        var F;
        
        if ("$init" in o) {
            $init = o.$init;
            delete o.$init;
        }
        
        if (typeof oParent === "undefined") {
            F = function () {
                var args = arguments;
                
                if (!(this instanceof F)) {
                    return new F(checkDirectCall, args);
                }
                
                if (args.length && args[0] === checkDirectCall) {
                    args = args[1];
                }
                
                if ($init !== null) {
                    $init.apply(this, args);
                }
            };
        } else {
            F = function () {
                var args = arguments;
    
                if (!(this instanceof F)) {
                    return new F(checkDirectCall, args);
                }
                
                if (args.length && args[0] === checkDirectCall) {
                    args = args[1];
                }
                
                // 부모의 생성자 실행
                oParent.apply(this, args);
                
                // 자식의 생성자 실행
                if ($init !== null) {
                    $init.apply(this, args);
                }
            };
            
            var Parent = function () {};
            Parent.prototype = oParent.prototype;
            F.$super = oParent.prototype;
            F.prototype = new Parent();
            F.prototype.constructor = F;
        }
        
        for (var i in o) {
            if (o.hasOwnProperty(i) && i !== "prototype") {
                F.prototype[i] = o[i];
            }
        }
        
        return F;
    };
    
    /**
     * 자주 쓰이는 유틸 모음
     * @namespace
     */
    collie.util = new (collie.Class(/** @lends collie.util */{
        $init : function () {
            this._sCSSPrefix = null;
            this._htDeviceInfo = null;
            this._bSupport3d = null;
            this._bSupportCSS3 = null;
            this._htBoundary = {
                left : 0,
                right : 0,
                top : 0,
                bottom : 0
            };
        },
        
        /**
         * 아이디로 표시 객체 인스턴스를 가져온다
         * 주로 DOM 방식일 때 사용 된다
         * 
         * @param {Number} nId
         * @return {collie.DisplayObject}
         */
        getDisplayObjectById : function (nId) {
            return collie.DisplayObject.htFactory[nId];
        },
        
        /**
         * name으로 표시 객체 인스턴스를 가져온다
         * 
         * @param {String} sName
         * @return {collie.DisplayObject}
         */
        getDisplayObjectByName : function (sName) {
            for (var i in collie.DisplayObject.htFactory) {
                if (collie.DisplayObject.htFactory[i].get("name") === sName) {
                    return collie.DisplayObject.htFactory[i];
                }
            }
            
            return false;
        },
        
        /**
         * userAgent 값으로 현재 단말 정보를 반환 한다
         * 값을 한번 얻어오면 다음부터는 캐시된 값을 사용 한다
         * 
         * @return {Object} htInfo
         * @return {Boolean} htInfo.desktop 데스크탑 여부
         * @return {Boolean} htInfo.supportCanvas 캔버스 지원 여부
         * @return {Boolean|Number} htInfo.android 안드로이드라면 두번째까지의 버젼, 안드로이드가 아니라면 false
         * @return {Boolean|Number} htInfo.ios iOS라면 두번째까지의 버젼, iOS가 아니라면 false
         * @return {Boolean|Number} htInfo.ie IE 브라우저라면 첫번째까지의 버전, IE 브라우저가 아니라면 false
         * @return {Boolean|Number} htInfo.chrome Agent에 Chrome이 포함돼 있는지 여부
         */
        getDeviceInfo : function (sAgent) {
            if (this._htDeviceInfo !== null && typeof sAgent === "undefined") {
                return this._htDeviceInfo;
            }
            
            var aMat = null;
            var bIsDesktop = false;
            var bSupportCanvas = typeof CanvasRenderingContext2D !== "undefined";
            var bIsAndroid = false;
            var bIsIOS = false;
            var bIsIE = false;
            var bHasChrome = (/chrome/i.test(sAgent)) ? true : false;
            var sAgent = sAgent || navigator.userAgent;
            var nVersion = 0;
            
            if (/android/i.test(sAgent)) { // android
                bIsAndroid = true;
                aMat = sAgent.toString().match(/android ([0-9]\.[0-9])\.?([0-9]?)/i);
                
                if (aMat && aMat[1]) {
                    nVersion = (parseFloat(aMat[1]) + (aMat[2] ? aMat[2] * 0.01 : 0)).toFixed(2);
                }
            } else if (/(iphone|ipad|ipod)/i.test(sAgent)) { // iOS
                bIsIOS = true;
                aMat = sAgent.toString().match(/([0-9]_[0-9])/i);
                
                if (aMat && aMat[1]) {
                    nVersion = parseFloat(aMat[1].replace(/_/, '.'));
                }
            } else { // PC
                bIsDesktop = true;
                
                if (/(MSIE)/i.test(sAgent)) { // IE
                    bIsIE = true;
                    aMat = sAgent.toString().match(/MSIE ([0-9])/i);
                    
                    if (aMat && aMat[1]) {
                        nVersion = parseInt(aMat[1], 10);
                    }
                }
            }
            
            this._htDeviceInfo = {
                supportCanvas : bSupportCanvas,
                desktop : bIsDesktop,
                android : bIsAndroid ? nVersion : false,
                ios : bIsIOS ? nVersion : false,
                ie : bIsIE ? nVersion : false,
                chrome : bHasChrome
            };
            
            return this._htDeviceInfo;
        },
        
        /**
         * 브라우저에 따른 CSS Prefix를 반환
         * 
         * @param {String} sName 대상 CSS 속성 명 (- 포함), 값이 없으면 prefix만 반환
         * @param {Boolean} bJavascript 자바스크립트 속성 타입으로 반환
         * @example
         * collie.util.getCSSPrefix("transform"); // -webkit-transform
         * collie.util.getCSSPrefix("transform", true); // webkitTransform
         * 
         * // prefix가 없을 때
         * collie.util.getCSSPrefix("transform"); // transform
         * collie.util.getCSSPrefix("transform", true); // transform
         * @return {String} 조합된 CSS Prefix, 혹은 속성 명
         */
        getCSSPrefix : function (sName, bJavascript) {
            var sResult = '';
            
            if (this._sCSSPrefix === null) {
                this._sCSSPrefix = '';
                
                // webkit이 가장 먼저 쓰일 것 같아서 webkit을 최상단으로 옮김
                if (typeof document.body.style.webkitTransform !== "undefined") {
                    this._sCSSPrefix = "-webkit-";
                } else if (typeof document.body.style.MozTransform !== "undefined") {
                    this._sCSSPrefix = "-moz-";
                } else if (typeof document.body.style.OTransform !== "undefined") {
                    this._sCSSPrefix = "-o-";
                } else if (typeof document.body.style.msTransform !== "undefined") {
                    this._sCSSPrefix = "-ms-";
                }
            }
            
            sResult = this._sCSSPrefix + (sName ? sName : '');
            
            // - 빼기
            if (bJavascript) {
                var aTmp = sResult.split("-");
                sResult = '';
                
                for (var i = 0, len = aTmp.length; i < len; i++) {
                    if (aTmp[i]) {
                        sResult += sResult ? aTmp[i].substr(0, 1).toUpperCase() + aTmp[i].substr(1) : aTmp[i];
                    }
                }
                
                if (this._sCSSPrefix === "-moz-" || this._sCSSPrefix === "-o-") {
                    sResult = sResult.substr(0, 1).toUpperCase() + sResult.substr(1);
                }
            }
            
            return sResult;
        },
        
        /**
         * CSS3를 지원하는지 여부
         * 
         * @return {Boolean}
         */
        getSupportCSS3 : function () {
            if (this._bSupportCSS3 === null) {
                this._bSupportCSS3 = typeof document.body.style[collie.util.getCSSPrefix("transform", true)] !== "undefined" || typeof document.body.style.transform != "undefined";
            }
            
            return this._bSupportCSS3;
        },
        
        /**
         * CSS3d를 지원하는지 여부
         * 
         * @return {Boolean}
         */
        getSupportCSS3d : function () {
            if (this._bSupport3d === null) {
                this._bSupport3d = (typeof document.body.style[collie.util.getCSSPrefix("perspective", true)] !== "undefined" || typeof document.body.style.perspective != "undefined") && (!collie.util.getDeviceInfo().android || collie.util.getDeviceInfo().android >= 4);
            }
            
            return this._bSupport3d;
        },
        
        /**
         * 각도를 라디안으로 변환
         * 
         * @param {Number} nDeg
         * @return {Number}
         */
        toRad : function (nDeg) {
            return nDeg * Math.PI / 180;
        },
        
        /**
         * 라디안을 각도로 변환
         * 
         * @param {Number} nRad
         * @return {Number}
         */
        toDeg : function (nRad) {
            return nRad * 180 / Math.PI;
        },
        
        /**
         * 근사값 구함(소수 7자리 미만은 버림)
         * - javascript 소숫점 연산 오류로 인한 근사값 연산임
         * 
         * @param {Number} nValue 값
         * @return {Number}
         */
        approximateValue : function (nValue) {
            return Math.round(nValue * 10000000) / 10000000;
        },
        
        /**
         * 각도를 0~360 값 사이로 맞춤
         * 
         * @param {Number} nAngleRad 라디안 값
         * @return {Number}
         */
        fixAngle : function (nAngleRad) {
            var nAngleDeg = collie.util.toDeg(nAngleRad);
            nAngleDeg -= Math.floor(nAngleDeg / 360) * 360;
            return collie.util.toRad(nAngleDeg);
        },
        
        /**
         * 거리를 반환
         * 
         * @param {Number} x1
         * @param {Number} y1
         * @param {Number} x2
         * @param {Number} y2
         * @return {Number} 거리
         */
        getDistance : function (x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        },
        
        /**
         * 점 배열에서 최소 사각형 영역을 구한다
         * 
         * @param {Array} aPoints 대상 배열 [[x1, y1], [x2, y2], ... ]
         * @return {Object} htResult
         * @return {Number} htResult.left
         * @return {Number} htResult.right
         * @return {Number} htResult.bottom
         * @return {Number} htResult.top
         */
        getBoundary : function (aPoints) {
            var nMinX = aPoints[0][0];
            var nMaxX = aPoints[0][0];
            var nMinY = aPoints[0][1];
            var nMaxY = aPoints[0][1];
            
            for (var i = 1, len = aPoints.length; i < len; i++) {
                nMinX = Math.min(nMinX, aPoints[i][0]);
                nMaxX = Math.max(nMaxX, aPoints[i][0]);
                nMinY = Math.min(nMinY, aPoints[i][1]);
                nMaxY = Math.max(nMaxY, aPoints[i][1]);
            }
            
            return {
                left : nMinX,
                right : nMaxX,
                top : nMinY,
                bottom : nMaxY
            };
        },
        
        /**
         * boundary를 points로 변환한다
         * 
         * @param {Object} htBoundary
         * @param {Number} htBoundary.left
         * @param {Number} htBoundary.right
         * @param {Number} htBoundary.top
         * @param {Number} htBoundary.bottom
         * @return {Array} points [[left, top], [right, top], [right, bottom], [left, bottom]]
         */
        getBoundaryToPoints : function (htBoundary) {
            return [[htBoundary.left, htBoundary.top], [htBoundary.right, htBoundary.top], [htBoundary.right, htBoundary.bottom], [htBoundary.left, htBoundary.bottom]];
        },
        
        /**
         * 주소의 queryString을 객체화 한다
         * @return {Object}
         */
        queryString : function () {
            var htResult = {};
            
            if (location.search) {
                var aParam = location.search.substr(1).split("&");
                
                for (var i = 0, len = aParam.length; i < len; i++) {
                    var aKeyValue = aParam[i].split("=");
                    htResult[aKeyValue.shift()] = aKeyValue.join("=");
                }
            }
            
            return htResult;
        },
        
        /**
         * 객체를 복사
         * 
         * @param {Object} oSource 원본 객체
         * @return {Object}
         */
        cloneObject : function (oSource) {
            var oReturn = {};
            
            for (var i in oSource) {
                oReturn[i] = oSource[i];
            }
            
            return oReturn;
        },
        
        /**
         * zIndex에 따라 오름차순 정렬된 순서로 배열에 넣는다
         * 
         * @private
         * @param {Array} aTarget
         * @param {collie.DisplayObject} oDisplayObject
         */
        pushWithSort : function (aTarget, oDisplayObject) {
            var bAdded = false;
            
            for (var i = 0, len = aTarget.length; i < len; i++) {
                if (aTarget[i]._htOption.zIndex > oDisplayObject._htOption.zIndex) {
                    aTarget.splice(i, 0, oDisplayObject);
                    bAdded = true;
                    break;
                }
            }
            
            if (!bAdded) {
                aTarget.push(oDisplayObject);
            }
        },
        
        /**
         * DOM의 addEventListener
         * 
         * @param {HTMLElement|String} el
         * @param {String} sName 이벤트 이름, on을 제외한 이름
         * @param {Function} fHandler 바인딩할 함수
         * @param {Boolean} bUseCapture 캡쳐 사용 여부
         */
        addEventListener : function (el, sName, fHandler, bUseCapture) {
            if (typeof el === "string") {
                el = document.getElementById(el);
            }
            
            if ("addEventListener" in el) {
                el.addEventListener(sName, fHandler, bUseCapture);
            } else {
                el.attachEvent("on" + sName, fHandler, bUseCapture);
            }
        },
        
        /**
         * DOM의 removeEventListener
         * 
         * @param {HTMLElement|String} el
         * @param {String} sName 이벤트 이름, on을 제외한 이름
         * @param {Function} fHandler 바인딩할 함수
         * @param {Boolean} bUseCapture 캡쳐 사용 여부
         */
        removeEventListener : function (el, sName, fHandler, bUseCapture) {
            if (typeof el === "string") {
                el = document.getElementById(el);
            }
            
            if ("removeEventListener" in el) {
                el.removeEventListener(sName, fHandler, bUseCapture);
            } else {
                el.detachEvent("on" + sName, fHandler, bUseCapture);
            }
        },
        
        /**
         * 이벤트의 기본 동작을 멈춘다
         * 
         * @param {HTMLEvent} e
         */
        stopEventDefault : function (e) {
            e = e || window.event;
            
            if ("preventDefault" in e) {
                e.preventDefault();
            }
            
            e.returnValue = false;
        },
        
        /**
         * 엘리먼트의 위치를 구한다
         * 
         * @param {HTMLElement|String}
         * @return {Object} htResult
         * @return {Number} htResult.x 
         * @return {Number} htResult.y
         * @return {Number} htResult.width
         * @return {Number} htResult.height
         */
        getPosition : function (el) {
            if (typeof el === "string") {
                el = document.getElementById(el);
            }
            
            var elDocument = el.ownerDocument || el.document || document;
            var elHtml = elDocument.documentElement;
            var elBody = elDocument.body;
            var htPosition = {};
            
            if ("getBoundingClientRect" in el) {
                var htBox = el.getBoundingClientRect();
                htPosition.x = htBox.left;
                htPosition.x += elHtml.scrollLeft || elBody.scrollLeft;
                htPosition.y = htBox.top;
                htPosition.y += elHtml.scrollTop || elBody.scrollTop;
                htPosition.width = htBox.width;
                htPosition.height = htBox.height;
            } else {
                htPosition.x = 0;
                htPosition.y = 0;
                htPosition.width = el.offsetWidth;
                htPosition.height = el.offsetHeight;
                
                for (var o = el; o; o = o.offsetParent) {
                    htPosition.x += o.offsetLeft;
                    htPosition.y += o.offsetTop;
                }
    
                for (var o = el.parentNode; o; o = o.parentNode) {
                    if (o.tagName === 'BODY') {
                        break;
                    }
                    
                    if (o.tagName === 'TR') {
                        htPosition.y += 2;
                    }
                                        
                    htPosition.x -= o.scrollLeft;
                    htPosition.y -= o.scrollTop;
                }
            }
            
            return htPosition;
        }
    }))();
    
    // iOS에서 상단바 숨기기
    if (collie.util.getDeviceInfo().ios) {
        window.addEventListener("load", function () {
            setTimeout(function () {
                document.body.scrollTop = 0;
            }, 300);
        });
    }
    
    // bind polyfill, https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
    
            var aArgs = Array.prototype.slice.call(arguments, 1), 
                fToBind = this, 
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
    
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();
            return fBound;
        };
    }
    
    // Implementation the dashedLine method in Canvas
    // I had fix some difference with Raphael.js
    // special thanks to Phrogz and Rod MacDougall
    // http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas
    var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    if (CP && CP.lineTo) {
        CP._dashedLineProperty = {
            index : 0,
            length : 0
        };
        
        CP.resetDashedLine = function () {
            this._dashedLineProperty = {
                index : 0,
                length : 0
            };
        };
        
        CP.dashedLine = function(x, y, x2, y2, da, width) {
            if (!da) da = [10, 5];
            var dx = (x2-x), dy = (y2-y);
            var len = Math.sqrt(dx * dx + dy * dy);
            var rot = Math.atan2(dy, dx);
            var dc = da.length;
            var di = this._dashedLineProperty.index || 0;
            var cx = this._dashedLineProperty.length || 0;
            var cy = 0;
            var sx = 0;
            var sy = 0;
            
            while (len > cx) {
                if (sx !== 0 || cx === 0) {
                    cx += da[di++ % dc] * width;
                }
                
                if (cx > len) {
                    this._dashedLineProperty.length = cx - len;
                    cx = len;
                }
                
                sx = x + cx * Math.cos(rot);
                sy = y + cx * Math.sin(rot);
                di % 2 === 1 ? this.lineTo(sx, sy) : this.moveTo(sx, sy);
            }
            
            this._dashedLineProperty.index = di;
        }
    }
    
    collie.raphaelDashArray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    };
})();