/**
 * Drawing Polyline
 * If you want to see a polyline using DOM Rendering, you need the [Raphael.js](http://raphaeljs.com) 2.1.0 or above.
 * 
 * @class
 * @extends collie.DisplayObject
 * @requires http://raphaeljs.com
 * @param {Object} [htOption] Options
 * @param {String} [htOption.strokeColor]
 * @param {Number} [htOption.strokeWidth=0] When this option set as 0, The stroke disappears.
 * @param {String} [htOption.fillColor]
 * @param {String} [htOption.fillImage] Fill the image inside a polyline
 * @param {String} [htOption.closePath=false] Closing a Path
 * @param {String} [htOption.dashArray] ["", "-", ".", "-.", "-..", ". ", "- ", "--", "- .", "--.", "--.."]
 * @param {String} [htOption.lineCap="butt"] ["butt", "square", "round"]
 * @param {String} [htOption.lineJoin="miter"] ["bevel", "round", "miter"]
 * @param {Number} [htOption.miterLimit=10]
 * @example
 * // Draw a Rectangle
 * var line = new collie.Polyline({
 *  closePath : true
 * }).addTo(layer);
 * line.setPointData([
 *  [0, 0],
 *  [100, 0],
 *  [100, 100],
 *  [0, 100]
 * ]);
 * 
 * // using moveTo
 * line.moveTo(200, 0);
 * line.lineTo(300, 0);
 * line.lineTo(300, 100);
 * line.lineTo(200, 100);
 * line.lineTo(200, 0); // expand boundary and set change status.
 */
collie.Polyline = collie.Class(/** @lends collie.Polyline.prototype */{
    $init : function (htOption) {
        this.option({
            strokeColor : '#000000',
            strokeWidth : 1,
            fillColor : '',
            fillImage : '',
            lineCap : "butt",
            lineJoin : "miter",
            miterLimit : 10,
            dashArray : "", 
            closePath : false // 마지막을 자동으로 연결해 줌
        }, null, true);
        this._aPointData = [];
        this._oPaper = null;
        this._htPointBoundary = {
            right : null,
            bottom : null
        };
    },
    
    /**
     * Set points for drawing
     * 
     * @param {Array} aPointData [[x1, y1, bMoveTo], [x2, y2, bMoveTo], ...]
     * @param {Boolean} bSkipExpandSize You can this option set as true if you don't want to expand size
     */
    setPointData : function (aPointData, bSkipExpandSize) {
        this._aPointData = aPointData;
        this.setChanged();
        
        if (!bSkipExpandSize) {
            this._expandBoundary(aPointData);
        }
    },
    
    /**
     * Return points
     * 
     * @return {Array}
     */
    getPointData : function () {
        return this._aPointData;
    },
    
    /**
     * Add a point
     * @param {Number} nX
     * @param {Number} nY
     * @param {Boolean} bSkipExpandSize You can this option set as true if you don't want to expand size
     */ 
    addPoint : function (nX, nY, bSkipExpandSize) {
        this._aPointData.push([nX, nY]);
        this.setChanged();
        
        if (!bSkipExpandSize) {
            this._expandBoundary(nX, nY);
        }
    },
    
    /**
     * Move a cursor position
     * 
     * @param {Number} nX
     * @param {Number} nY
     */
    moveTo : function (nX, nY) {
        this._aPointData.push([nX, nY, true]);
    },
    
    /**
     * Alias for the addPoint method
     * @see collie.Polyline#addPoint
     */
    lineTo : function (nX, nY, bSkipExpandSize) {
        this.addPoint(nX, nY, bSkipExpandSize);
    },
    
    /**
     * Reset points
     */
    resetPointData : function () {
        this._aPointData = [];
        this._htPointBoundary = {
            right : null,
            bottom : null
        };
        this.setChanged();
    },
    
    /**
     * 포인트 영역을 늘린다
     * @private
     * 
     * @param {Array|Number} nX 배열로 들어오면 배열을 돌면서 확장 한다
     * @param {Number} nY
     * @param {Boolean} bSkipAdoptSize 크기를 객체에 적용하는 것을 생략한다
     */
    _expandBoundary : function (nX, nY, bSkipAdoptSize) {
        if (nX instanceof Array) {
            for (var i = 0, len = nX.length; i < len; i++) {
                this._expandBoundary(nX[i][0], nX[i][1], true);
            }
        } else {
            this._htPointBoundary.right = this._htPointBoundary.right === null ? nX : Math.max(nX, this._htPointBoundary.right);
            this._htPointBoundary.bottom = this._htPointBoundary.bottom === null ? nY : Math.max(nY, this._htPointBoundary.bottom);
        }
        
        // 크기 적용
        if (!bSkipAdoptSize) {
            var nStrokeWidth = this._htOption.strokeWidth * (collie.Renderer.isRetinaDisplay() ? 2 : 1);
            var nWidth = this._htPointBoundary.right + nStrokeWidth * 2;
            var nHeight = this._htPointBoundary.bottom + nStrokeWidth * 2; 
            this.set({
                width : nWidth,
                height : nHeight
            });
            
            
            if (this._oPaper !== null) {
                this._oPaper.setSize(nWidth, nHeight);
            }
        }
    },
    
    /**
     * Delegate
     * @private
     */
    onDOMDraw : function (oEvent) {
        var el = oEvent.element;
        
        // 점이 2개 미만이면 그리지 않는다
        if (this._aPointData.length < 2) {
            return;
        }
        
        if (typeof Raphael === "undefined") {
            return;
        }
        
        var htInfo = this.get();
        var nStrokeWidth = htInfo.strokeWidth;
        var htDirty = this.getDirty();
        
        if (this._oPaper === null) {
            this._oPaper = Raphael(el, htInfo.width, htInfo.height);
            this._oPaper.canvas.style.zIndex = 10;
        } else if (htDirty && (htDirty.width || htDirty.height)) {
            this._oPaper.setSize(htInfo.width, htInfo.height);
        }
        
        el.style.left = -(nStrokeWidth / 2) + "px";
        el.style.top = -(nStrokeWidth / 2) + "px";
        this._oPaper.clear();
        
        var str = "M" + this._aPointData[0][0] + "," + this._aPointData[0][1];
        
        for (var i = 1, len = this._aPointData.length; i < len; i++) {
            str += (this._aPointData[i][2] ? "M" : "L") + this._aPointData[i][0] + "," + this._aPointData[i][1];
        }
        
        // 마지막이 연결되어 있지 않다면
        if (
            htInfo.closePath && (
                this._aPointData[0][0] !== this._aPointData[this._aPointData.length - 1][0] || 
                this._aPointData[0][1] !== this._aPointData[this._aPointData.length - 1][1]
            ) 
        ) {
            str += "L" + this._aPointData[0][0] + "," + this._aPointData[0][1];
        }
        
        var line = this._oPaper.path(str + (htInfo.closePath ? "Z" : ""));
        line.transform("t" + (nStrokeWidth / 2) + "," + (nStrokeWidth / 2));
        
        if (htInfo.fillImage) {
            collie.ImageManager.getImage(htInfo.fillImage, function (el) {
                line.attr("fill", "url('" + el.src + "')");
            });
        } else if (htInfo.fillColor) {
            line.attr("fill", htInfo.fillColor);
        }
        
        if (htInfo.lineCap) {
            line.attr("stroke-linecap", htInfo.lineCap);
        }
        
        if (htInfo.lineJoin) {
            line.attr("stroke-linejoin", htInfo.lineJoin);
        }
        
        if (htInfo.miterLimit !== null) {
            line.attr("stroke-miterlimit", htInfo.miterLimit);
        }
        
        if (htInfo.strokeColor) {
            line.attr("stroke", htInfo.strokeColor);
        }
        
        line.attr("stroke-width", nStrokeWidth);
        
        if (htInfo.dashArray) {
            line.attr("stroke-dasharray", htInfo.dashArray);
        }
    },
    
    /**
     * Delegate
     * @private
     */
    onCanvasDraw : function (oEvent) {
        // 점이 2개 미만이면 그리지 않는다
        if (this._aPointData.length < 2) {
            return;
        }
        
        var htInfo = this.get();        
        var oContext = oEvent.context;
        var bIsRetinaDisplay = collie.Renderer.isRetinaDisplay();
        var nStrokeWidth = htInfo.strokeWidth;
        var nRatio = (bIsRetinaDisplay ? 2 : 1);
        
        oContext.save();
        oContext.translate(oEvent.x, oEvent.y);
        
        // 레티나 디스플레이 대응
        if (bIsRetinaDisplay) {
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
        
        if (htInfo.strokeColor) {
            oContext.strokeStyle = htInfo.strokeColor;
        }
        
        oContext.lineWidth = nStrokeWidth;
        
        if (htInfo.lineCap) {
            oContext.lineCap = htInfo.lineCap;
        }
        
        if (htInfo.lineJoin) {
            oContext.lineJoin = htInfo.lineJoin;
        }
        
        if (htInfo.miterLimit) {
            oContext.miterLimit = htInfo.miterLimit;
        }
        
        if (htInfo.dashArray) {
            // moveTo를 하면 fill이 안된다 연결된 선을 하나 더 그려서 해결한다
            if (htInfo.fillColor || htInfo.fillImage) {
                oContext.beginPath();
                oContext.moveTo(this._aPointData[0][0] * nRatio, this._aPointData[0][1] * nRatio);
                
                for (var i = 1, len = this._aPointData.length; i < len; i++) {
                    if (this._aPointData[i][2]) {
                        oContext.moveTo(this._aPointData[i][0] * nRatio, this._aPointData[i][1] * nRatio);
                        continue;
                    }
        
                    oContext.lineTo(this._aPointData[i][0] * nRatio, this._aPointData[i][1] * nRatio);
                }
                
                if (htInfo.closePath) {
                    oContext.closePath();
                }
                
                oContext.fill();
            }
            
            oContext.resetDashedLine();
        }       
        
        // 앞에 그린 선은 지워진다
        oContext.beginPath();
        oContext.moveTo(this._aPointData[0][0] * nRatio, this._aPointData[0][1] * nRatio);
        
        for (var i = 1, len = this._aPointData.length; i < len; i++) {
            // moveTo
            if (this._aPointData[i][2]) {
                oContext.moveTo(this._aPointData[i][0] * nRatio, this._aPointData[i][1] * nRatio);
                continue;
            }

            if (htInfo.dashArray) {
                oContext.dashedLine(this._aPointData[i - 1][0] * nRatio, this._aPointData[i - 1][1] * nRatio, this._aPointData[i][0] * nRatio, this._aPointData[i][1] * nRatio, collie.raphaelDashArray[htInfo.dashArray], nStrokeWidth);
            } else {
                oContext.lineTo(this._aPointData[i][0] * nRatio, this._aPointData[i][1] * nRatio);
            }
        }
        
        // 마지막이 연결되어 있지 않다면
        if (
            htInfo.dashArray && htInfo.closePath && (
            this._aPointData[0][0] !== this._aPointData[this._aPointData.length - 1][0] || 
            this._aPointData[0][1] !== this._aPointData[this._aPointData.length - 1][1]
        )) {
            oContext.dashedLine(this._aPointData[i - 1][0] * nRatio, this._aPointData[i - 1][1] * nRatio, this._aPointData[0][0] * nRatio, this._aPointData[0][1] * nRatio, collie.raphaelDashArray[htInfo.dashArray], nStrokeWidth);
        }
        
        if (htInfo.closePath) {
            oContext.closePath();
        }
        
        if (!htInfo.dashArray && (htInfo.fillColor || htInfo.fillImage)) {
            oContext.fill();
        }
        
        if (htInfo.strokeWidth) {
            oContext.stroke();
        }
        
        oContext.restore();
    },
    
    /**
     * Returns information of The Class as String
     * 
     * @return {String}
     */
    toString : function () {
        return "Polyline" + (this._htOption.name ? " " + this._htOption.name : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);