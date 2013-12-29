/**
 * @private
 * @class
 * @example
 * collie.ImageManager.add({
 *  "sample" : "sample.png"
 * });
 * collie.ImageManager.addSprite("sample", {
 *  normal : [0, 0],
 *  action : [30, 0]
 * });
 * new collie.DisplayObject({
 *  spriteSheet : "normal",
 *  backgroundImage : "sample"
 * });
 */
collie.SpriteSheet = collie.Class(/** @lends collie.SpriteSheet.prototype */{
    $init : function () {
        this._htSpriteSheet = {};
    },

    /**
     * 스프라이트를 추가
     * 
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     * @param {String|Object} vSpriteName 객체로 한 번에 여러 개의 정보를 등록할 수 있음
     * @param {Number} nOffsetX
     * @param {Number} nOffsetY
     * @param {Number} [nWidth]
     * @param {Number} [nHeight]
     * @param {Number} [nSpriteLength]
     */
    add : function (sImageName, vSpriteName, nOffsetX, nOffsetY, nWidth, nHeight, nSpriteLength) {
        if (typeof vSpriteName === "object") {
            if (vSpriteName instanceof Array) {
                for (var i = 0, l = vSpriteName.length; i < l; i++) {
                    this.add.apply(this, [sImageName, i].concat(vSpriteName[i]));
                }
            } else {
                for (var i in vSpriteName) {
                    this.add.apply(this, [sImageName, i].concat(vSpriteName[i]));
                }
            }
        } else {
            this._htSpriteSheet[sImageName] = this._htSpriteSheet[sImageName] || {};
            
            if (typeof nWidth !== "undefined") {
                collie.ImageManager.getImage(sImageName, function (el) {
                    this._addWithSpriteLength(el, sImageName, vSpriteName, nOffsetX, nOffsetY, nWidth, nHeight, nSpriteLength);
                }.bind(this));
            } else {
                this._htSpriteSheet[sImageName][vSpriteName] = [nOffsetX, nOffsetY];
            }
        }
    },
    
    /**
     * @private
     */
    _addWithSpriteLength : function (elImage, sImageName, sSpriteName, nOffsetX, nOffsetY, nWidth, nHeight, nSpriteLength) {
        var aSpriteList = this._htSpriteSheet[sImageName][sSpriteName] = [];
        var nImageWidth = elImage.width;
        var nImageHeight = elImage.height;
        
        // 레티나 이미지면 반으로 나눔
        if (collie.Renderer.isRetinaDisplay()) {
            nImageWidth /= 2;
            nImageHeight /= 2;
        }
        
        var x = nOffsetX;
        var y = nOffsetY;
        
        for (i = 0; i < nSpriteLength; i++) {
            // 이미지를 넘어서면 줄을 바꿈
            // 다음 줄은 nOffsetX 부터 시작하는 것이 아니라 0부터 시작함
            if (x >= nImageWidth) {
                x = 0;
                y += nHeight;
            }
            
            // 이미지를 넘어서면 끝남
            if (y >= nImageHeight) {
                break;
            }
            
            aSpriteList.push([x, y]);
            x += nWidth;
        }
    },
    
    /**
     * 해당 이미지에 등록돼 있는 스프라이트 정보를 제거
     * 
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     */
    remove : function (sImageName) {
        if (this._htSpriteSheet[sImageName]) {
            delete this._htSpriteSheet[sImageName];
        }
    },
    
    /**
     * SpriteSheet 정보를 반환
     * 
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     * @return {Object}
     */
    get : function (sImageName) {
        return this._htSpriteSheet[sImageName] ? this._htSpriteSheet[sImageName] : false;
    },
    
    /**
     * 스프라이트 시트 정보를 초기화 한다
     */
    reset : function () {
        this._htSpriteSheet = {};
    }
});