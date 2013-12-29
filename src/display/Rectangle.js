/**
 * Rectangle
 * - Rounded
 * @class
 * @extends collie.DisplayObject
 * @param {Object} [htOption] 설정
 * @param {Number} [htOption.radius=0] 테두리 굴림 값 (px)
 * @param {String} [htOption.strokeColor] 테두리 색상
 * @param {Number} [htOption.strokeWidth=0] 테두리 굵기(0이면 테두리 없음)
 * @param {String} [htOption.fillColor] 채울 색상(없으면 투명)
 * @param {String} [htOption.fillImage] 채울 이미지
 */
collie.Rectangle = collie.Class(/** @lends collie.Rectangle.prototype */{
    $init : function (htOption) {
        this.option({
            radius : 0,
            strokeColor : '',
            strokeWidth : 0,
            fillColor : '',
            fillImage : ''
        }, null, true);
        
        this._sBorderRadius = collie.util.getCSSPrefix("border-radius", true);
    },
    
    /**
     * Delegate
     * @private
     */
    onDOMDraw : function (oEvent) {
        if (this._bChanged) {
            if (this._htOption.radius) {
                oEvent.element.style[this._sBorderRadius] = this._htOption.radius + "px";
                oEvent.element.style.borderRadius = this._htOption.radius + "px";
            }
            
            if (this._htOption.fillImage) {
                collie.ImageManager.getImage(this._htOption.fillImage, function (el) {
                    oEvent.element.style.backgroundImage = "url('" + el.src + "')";
                });
            } else if (this._htOption.fillColor) {
                oEvent.element.style.backgroundColor = this._htOption.fillColor;
            }
            
            if (this._htOption.strokeWidth) {
                oEvent.element.style.border = this._htOption.strokeWidth + "px solid " + this._htOption.strokeColor;
            }
            
            this._bChanged = false;
        }       
    },
    
    /**
     * Delegate
     * @private
     */
    onCanvasDraw : function (oEvent) {
        var oContext = oEvent.context;
        var nRadius = this._htOption.radius;
        var bIsRetinaDisplay = collie.Renderer.isRetinaDisplay();
        var nWidth = this._htOption.width;
        var nHeight = this._htOption.height;
        var nStrokeWidth = this._htOption.strokeWidth;
        
        // 레티나 디스플레이 대응
        if (bIsRetinaDisplay) {
            nWidth *= 2;
            nHeight *= 2;
            nRadius *= 2;
            nStrokeWidth *= 2;
        }
        
        if (htInfo.fillImage) {
            var el = collie.ImageManager.getImage(htInfo.fillImage);
            
            if (!el) {
                collie.ImageManager.getImage(htInfo.fillImage, function () {
                    this.setChanged();
                }.bind(this));
            } else {
                var pattern = oContext.createPattern(el, "repeat");
                oContext.fillStyle = pattern;
            }
        } else if (htInfo.fillColor) {
            oContext.fillStyle = htInfo.fillColor;
        }
        
        if (this._htOption.strokeColor) {
            oContext.strokeStyle = this._htOption.strokeColor;
        }
        
        if (this._htOption.strokeWidth) {
            oContext.lineWidth = nStrokeWidth;
        }
        
        if (nRadius) {
            oContext.save();
            oContext.translate(oEvent.x, oEvent.y);
            oContext.beginPath();
            oContext.moveTo(nRadius, 0);
            oContext.lineTo(nWidth - nRadius, 0);
            oContext.quadraticCurveTo(nWidth, 0, nWidth, nRadius);
            oContext.lineTo(nWidth, nHeight - nRadius);
            oContext.quadraticCurveTo(nWidth, nHeight, nWidth - nRadius, nHeight);
            oContext.lineTo(nRadius, nHeight);
            oContext.quadraticCurveTo(0, nHeight, 0, nHeight - nRadius);
            oContext.lineTo(0, nRadius);
            oContext.quadraticCurveTo(0, 0, nRadius, 0);
            oContext.closePath();
            oContext.restore();
            
            if (this._htOption.fillColor || this._htOption.fillImage) {
                oContext.fill();
            }    
            
            if (this._htOption.strokeWidth) {
                oContext.stroke();
            }
        } else {
            if (this._htOption.fillColor || this._htOption.fillImage) {
                oContext.fillRect(oEvent.x, oEvent.y, nWidth, nHeight);
            }
            
            if (this._htOption.strokeWidth) {
                oContext.strokeRect(oEvent.x, oEvent.y, nWidth, nHeight);
            }
        }
        
        this._bChanged = false;
    },
    
    /**
     * 문자열로 클래스 정보 반환
     * 
     * @return {String}
     */
    toString : function () {
        return "Rectangle" + (this.get("name") ? " " + this.get("name") : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);