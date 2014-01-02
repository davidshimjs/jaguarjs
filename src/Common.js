/**
 * @namespace
 */
var collie = collie || {};

(function () {
    /**
     * This value will be replaced automatically, so you don't need to edit it.
     * @name collie.version
     */
    collie.version = "{{version}}";

    /**
     * Make a Class
     * @method collie#Class
     * @param {Object} o An Object which contains members of this class. You can define the constructor with a `$init` property.
     * @param {collie.Class} [oParent] You can insert a superclass if you need to inherit.
     * @return {collie.Class}
     * @example
     * ```
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
     * console.log(oDavid.name); // david
     * console.log(oDavid.gender); // male
     * console.log(oDavid.walk()); // walking!
     * ```
     * @example
     * override
     * ```
     * var Person = collie.Class({
     *  testMethod : function () {
     *      // do something
     *  }
     * });
     * 
     * var Male = collie.Class({
     *  testMethod : function () {
     *      // do something else
     *      this.constructor.$super.testMethod.apply(this, arguments);      
     *  }
     * }, Person);
     * ```
     * @example
     * You can also create an instance without using the 'new' keyword
     * ```
     * var Person = collie.Class({
     *  $init : function () {
     *  },
     *  test : function () {
     *  }
     * });
     * 
     * var a = new Person();
     * var b = Person(); // It works fine!
     * ```
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
                
                // runs constructor of a superclass
                oParent.apply(this, args);
                
                // runs constructor of current class
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
     * Utilities
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
         * Get an instance of a DisplayObject by Id
         * It is meant to be used mainly with DOM rendering.
         * 
         * @param {Number} nId
         * @return {collie.DisplayObject}
         */
        getDisplayObjectById : function (nId) {
            return collie.DisplayObject.htFactory[nId];
        },
        
        /**
         * Get an instance of a DisplayObject by name
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
         * Returns information about the current device using the user-agent value.
         * 
         * @return {Object} htInfo
         * @return {Boolean} htInfo.desktop Whether it's a desktop device or not
         * @return {Boolean} htInfo.supportCanvas Whether it supports Canvas rendering or not
         * @return {Boolean|Number} htInfo.android The Android version with two decimal place (e.g. 4.4.2). If it's not an Android device, this will be false.
         * @return {Boolean|Number} htInfo.ios iOS version. same as `htInfo.android`
         * @return {Boolean|Number} htInfo.ie IE version. same as `htInfo.android`.
         * @return {Boolean|Number} htInfo.chrome whether the user-agent value contains `chrome` or not.
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
            var bHiggs = (/Higgs/i.test(sAgent))? true: false; // The Higgs is a browser engine made by Naver Corporation
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
                chrome : bHasChrome,
                higgs : bHiggs
            };
            
            return this._htDeviceInfo;
        },
        
        /**
         * Returns the CSS vendor prefix for the current browser
         * 
         * @param {String} [sName] CSS property name to target (including `-`). If it's an empty value, this method will only return the vendor prefix.
         * @param {Boolean} bJavascript set this value as true if you want the camelcase version (for JavaScript use).
         * @example
         * ```
         * collie.util.getCSSPrefix("transform"); // -webkit-transform
         * collie.util.getCSSPrefix("transform", true); // webkitTransform
         * ```
         * @return {String} CSS Vendor prefix
         */
        getCSSPrefix : function (sName, bJavascript) {
            var sResult = '';
            
            if (this._sCSSPrefix === null) {
                this._sCSSPrefix = '';
                
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
         * Whether the current device supports CSS3 or not
         * @return {Boolean}
         */
        getSupportCSS3 : function () {
            if (this._bSupportCSS3 === null) {
                this._bSupportCSS3 = typeof document.body.style[collie.util.getCSSPrefix("transform", true)] !== "undefined" || typeof document.body.style.transform != "undefined";
            }
            
            return this._bSupportCSS3;
        },
        
        /**
         * Whether the current device supports CSS 3D or not
         * @return {Boolean}
         */
        getSupportCSS3d : function () {
            if (this._bSupport3d === null) {
                this._bSupport3d = (typeof document.body.style[collie.util.getCSSPrefix("perspective", true)] !== "undefined" || typeof document.body.style.perspective != "undefined") && (!collie.util.getDeviceInfo().android || collie.util.getDeviceInfo().android >= 4);
            }
            
            return this._bSupport3d;
        },
        
        /**
         * Converts Degree to Radian
         * @param {Number} nDeg
         * @return {Number}
         */
        toRad : function (nDeg) {
            return nDeg * Math.PI / 180;
        },
        
        /**
         * Converts Radian to Degree
         * @param {Number} nRad
         * @return {Number}
         */
        toDeg : function (nRad) {
            return nRad * 180 / Math.PI;
        },
        
        /**
         * Get an approximate value to avoid a floating value bug
         * @param {Number} nValue
         * @return {Number}
         */
        approximateValue : function (nValue) {
            return Math.round(nValue * 10000000) / 10000000;
        },
        
        /**
         * Fixed degree value between 0 and 360
         * @param {Number} nAngleRad angle in Radian
         * @return {Number}
         */
        fixAngle : function (nAngleRad) {
            var nAngleDeg = collie.util.toDeg(nAngleRad);
            nAngleDeg -= Math.floor(nAngleDeg / 360) * 360;
            return collie.util.toRad(nAngleDeg);
        },
        
        /**
         * Returns the distance between two points
         * @param {Number} x1
         * @param {Number} y1
         * @param {Number} x2
         * @param {Number} y2
         * @return {Number}
         */
        getDistance : function (x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        },
        
        /**
         * Returns a minimum boundary
         * 
         * @param {Array} aPoints target array [[x1, y1], [x2, y2], ... ]
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
         * Converts boundary to points
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
         * Return the QueryString as an object
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
         * Clone an object
         * @param {Object} oSource source object
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
         * Insert to target array sorted `zIndex` value on DisplayObject
         * @private
         * @param {Array} aTarget Target array
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
         * element.addEventListener with cross-browser support
         * @param {HTMLElement|String} el
         * @param {String} sName Event name (excluding `on` keyword)
         * @param {Function} fHandler Event handler
         * @param {Boolean} bUseCapture
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
         * element.removeEventListener with cross-browser support
         * @param {HTMLElement|String} el
         * @param {String} sName Event name (excluding `on` keyword)
         * @param {Function} fHandler Event handler
         * @param {Boolean} bUseCapture
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
         * `event.preventDefault` with cross-browser support
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
         * Get the position of an element
         * @param {HTMLElement|String} Target element
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
    
    // Implementation of the dashedLine method in Canvas
    // I had to fix some differences with Raphael.js
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