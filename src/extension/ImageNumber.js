/**
 * 비트맵으로 구성된 숫자를 사용하기 위한 클래스
 * 0과 양수만 표현할 수 있다.
 * number에서 쓰이는 이미지는 0부터 9까지 가로로 나열된 스프라이트 이미지여야한다
 * @class
 * @extends collie.DisplayObject
 * @param {Object} [htOption] 설정
 * @param {String} [htOption.textAlign="left"] 숫자 정렬 방법, left, right, center를 설정할 수 있다.
 * @param {Number} [htOption.letterSpacing=0] 숫자 간격 음수를 사용하면 간격이 줄어든다 단위는 px
 * @param {Number} [htOption.minDigit=0] 최소 자릿수 지정, 빈 자리는 0으로 채워진다. 0이면 사용안함 
 * @requires collie.addon.js
 * @example
 * var number = new collie.ImageNumber({
 *  textAlign: "center",
 *  letterSpacing: -5,
 *  width: 300,
 *  height: 100
 * }).number({
 *  width: 90,
 *  height: 100,
 *  backgroundImage: "number" // This Image should be contained numbers from 0 to 9.  
 * }).comma({
 *  width: 45, // comma method requires a width option
 *  height: 100,
 *  backgroundImage: "comma"
 * });
 * 
 * number.setValue(999000); // 'number' object would be shown by "999,000"
 * number.comma(false); // It would be shown by "999000"
 */
collie.ImageNumber = collie.Class(/** @lends collie.ImageNumber.prototype */{
    $init : function (htOption) {
        this._aNumber = [];
        this._aComma = [];
        this._nIndexNumber = null;
        this._nIndexComma = null;
        this._nValue = null;
        this.option({
            textAlign : "left",
            letterSpacing : 0,
            minDigit : 0
        }, null, true);
    },
    
    /**
     * 값을 설정
     * 
     * @param {Number} nNumber
     * @return {collie.ImageNumber}
     */
    setValue : function (nNumber) {
        this._nValue = Math.max(0, parseInt(nNumber, 10));
        this._nIndexNumber = null;
        this._nIndexComma = null;
        var sNumber = this._nValue.toString();
        var len = sNumber.length;
        
        if (this._htOption.minDigit && len < this._htOption.minDigit) {
            sNumber = (new Array(this._htOption.minDigit - len + 1).join("0")) + sNumber;
            len = this._htOption.minDigit;
        }
        
        var nWidth = this._getWidth(sNumber);
        var nStartLeft = this._getStartPosition(nWidth);
        var nLeft = nStartLeft + nWidth;
        var nCountNumber = 0;
        var bLastCharacter = false;
        
        for (var i = len - 1; i >= 0; i--) {
            // 세 자리 콤마 붙여야 할 때
            if (this._htOptionComma && nCountNumber % 3 === 0 && nCountNumber !== 0) {
                nLeft = nLeft - (this._htOptionComma.width + this._htOption.letterSpacing);
                this._getComma().set({
                    x : nLeft,
                    visible : true
                });
            }
            
            bLastCharacter = (nCountNumber === 0 && this._htOption.textAlign === "right") || (nCountNumber === len && this._htOption.textAlign === "left");
            nLeft = nLeft - (this._htOptionNumber.width + this._htOption.letterSpacing * (bLastCharacter ? 0 : 1));
            this._getNumber().set({
                x : nLeft,
                spriteX : parseInt(sNumber.charAt(i), 10),
                visible : true
            });
            
            nCountNumber++;
        }
        
        this._hideUnusedObject();
    },
    
    /**
     * 설정된 값을 반환한다.
     * @return {Number}
     */
    getValue : function () {
        return this._nValue;
    },
    
    /**
     * 숫자를 만들 때 사용할 옵션을 설정한다
     * 
     * @param {Object} htOption
     * @see {collie.DisplayObject}
     * @return {collie.ImageNumber}
     */
    number : function (htOption) {
        this._htOptionNumber = htOption;
        return this;
    },
    
    /**
     * 세 자리 콤마를 사용할 경우 콤마를 생성할 때 사용할 옵션을 설정한다
     * 
     * @param {Object|Boolean} htOption 콤마를 만들 때 사용할 옵션, 반드시 width를 입력해야 한다, false를 입력하면 콤마를 제거한다
     * @see {collie.DisplayObject}
     * @return {collie.ImageNumber}
     */
    comma : function (htOption) {
        if (!htOption) {
            this._htOptionComma = null;
        } else {
            if (!("width" in htOption)) {
                throw new Error("comma method in ImageNumber requires a width property in options.");
            }
            
            this._htOptionComma = htOption;
        }
        
        if (this._nValue !== null) {
            this.setValue(this._nValue);
        }
        
        return this;
    },
    
    /**
     * 현재 숫자의 표시될 너비를 구한다
     * 
     * @private
     * @return {Number}
     */
    _getWidth : function (nValue) {
        var sValue = nValue.toString();
        var nWidth = sValue.length * (this._htOptionNumber.width + this._htOption.letterSpacing);
        
        if (this._htOptionComma) {
            nWidth += Math.max(0, Math.ceil(sValue.length / 3 - 1)) * (this._htOptionComma.width + this._htOption.letterSpacing);
        }
        
        return nWidth;
    },
    
    /**
     * 현재 숫자가 정렬에 따라 제일 처음에 표기될 위치를 반환한다.
     * @private
     * @return {Number}
     */
    _getStartPosition : function (nWidth) {
        switch (this._htOption.textAlign) {
            case "right" :
                return this._htOption.width - nWidth;
                break;
                
            case "center" :
                return this._htOption.width / 2 - nWidth / 2;
                break;
                
            case "left" :
            default :
                return 0;
        }
    },
    
    /**
     * Pool에서 빈 숫자 객체를 가져온다. 사용하지 않은 객체가 없으면 새로 생성한다
     * 
     * @private
     * @return {collie.DisplayObject}
     */
    _getNumber : function () {
        var startIdx = this._nIndexNumber === null ? 0 : this._nIndexNumber + 1;
        
        // 새로 생성
        if (this._aNumber.length < startIdx + 1) {
             this._aNumber.push(new collie.DisplayObject(this._htOptionNumber).addTo(this));
        }
        
        this._nIndexNumber = startIdx;
        return this._aNumber[startIdx];
    },
    
    /**
     * Pool에서 빈 콤마 객체를 가져온다. 사용하지 않은 객체가 없으면 새로 생성한다
     * 
     * @private
     * @return {collie.DisplayObject}
     */
    _getComma : function () {
        var startIdx = this._nIndexComma === null ? 0 : this._nIndexComma + 1;
        
        // 새로 생성
        if (this._aComma.length < startIdx + 1) {
             this._aComma.push(new collie.DisplayObject(this._htOptionComma).addTo(this));
        }
        
        this._nIndexComma = startIdx;
        return this._aComma[startIdx];
    },
    
    /**
     * 사용하지 않은 객체는 visible을 false로 설정한다
     * @private
     */
    _hideUnusedObject : function () {
        // 콤마는 생성 안됐을 경우에도 전부 없앰
        for (var i = this._nIndexComma !== null ? this._nIndexComma + 1 : 0, l = this._aComma.length; i < l; i++) {
            this._aComma[i].set("visible", false);
        }
        
        // 숫자는 없을 경우가 없으므로 전부 없애지 않음 (최소 0)
        if (this._nIndexNumber !== null) {
            for (var i = this._nIndexNumber + 1, l = this._aNumber.length; i < l; i++) {
                this._aNumber[i].set("visible", false);
            }
        }
    },

    /**
     * 클래스 정보를 문자열로 반환
     * Returns to information of Class as string
     * 
     * @return {String}
     */
    toString : function () {
        return "ImageNumber" + (this.get("name") ? " " + this.get("name") : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);