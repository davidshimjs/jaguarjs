/**
 * Drawing Circle
     * If you want to draw a circle using DOM rendering, you need the [Raphael.js](http://raphaeljs.com) library, version 2.1.0 or newer.
 * 
 * @class
 * @extends collie.DisplayObject
 * @requires http://raphaeljs.com
 * @param {Object} [htOption] Options
 * @param {Number} [htOption.radius=0] Radius (px)
 * @param {String} [htOption.strokeColor] Stroke color
 * @param {Number} [htOption.strokeWidth=0] Border width. Set this option to 0 to disable the border.
 * @param {String} [htOption.fillColor] Color to fill the circle with. The default value is transparent.
 * @param {String} [htOption.fillImage] Image to fill the circle with.
 * @param {Number} [htOption.startAngle=0] Starting angle (degrees)
 * @param {Number} [htOption.endAngle=360] Ending angle (degrees). Set a starting angle of 0 and an ending angle of 360 to fully fill the Circle.
 * @param {Boolean} [htOption.closePath=false] Close the path (like a Pac-man).
 * @param {Boolean} [htOption.autoExpand=true] Set this option to true to expand the Circle object to fit its size to diameter.
 * @param {Boolean} [htOption.anticlockwise=false] Set this option to true to fill the Circle anticlockwise.
 * @example
 * // Draw a Circle
 * var circle = new collie.Circle({
 *  radius : 20 // The Circle object just expands to fit its size to diameter. (width:40, height:40)
 * }).addTo(layer);
 * 
 * // Arc
 * circle.set({
 *  startAngle : 0,
 *  endAngle : 270
 * });
 * 
 * // A Pac-man
 * circle.set({
 *  startAngle : 45,
 *  endAngle : 315,
 *  closePath : true
 * });
 */
collie.Circle = collie.Class(/** @lends collie.Circle.prototype */{
    $init : function (htOption) {
        this.option({
            radius : 0,
            strokeColor : '#000000',
            strokeWidth : 0,
            fillColor : '',
            fillImage : '',
            startAngle : 0,
            endAngle : 360,
            closePath : false,
            anticlockwise : false,
            autoExpand : true
        }, null, true);
        
        this._oPaper = null;
        this.optionSetter("radius", this._expandSize.bind(this));
        this._expandSize();
    },
    
    _expandSize : function () {
        if (this._htOption.autoExpand && this._htOption.radius) {
            var size = this._htOption.radius * 2 + this._htOption.strokeWidth;
            this.set("width", size);
            this.set("height", size);
        }
    },
    
    /**
     * Delegate
     * @private
     */
    onDOMDraw : function (oEvent) {
        var el = oEvent.element;
        
        if (typeof Raphael === "undefined") {
            return;
        }
        
        var htInfo = this.get();
        var nStrokeWidth = htInfo.strokeWidth;
        var nRadius = htInfo.radius;
        var nWidth = htInfo.width;
        var nHeight = htInfo.height;
        var htDirty = this.getDirty();
        var circle;
        
        if (this._oPaper === null) {
            this._oPaper = Raphael(el, nWidth + nStrokeWidth, nHeight + nStrokeWidth);
            this._oPaper.canvas.style.zIndex = 10;
        } else if (htDirty && (htDirty.width || htDirty.height)) {
            this._oPaper.setSize(nWidth, nHeight);
        }
        
        el.style.left = -(nStrokeWidth / 2) + "px";
        el.style.top = -(nStrokeWidth / 2) + "px";
        this._oPaper.clear();
        
        if (nRadius) {
            var rx = nRadius;
            var ry = nRadius;
            var x1 = rx + nRadius * Math.cos(collie.util.toRad(htInfo.startAngle));
            var y1 = ry + nRadius * Math.sin(collie.util.toRad(htInfo.startAngle));
            var x2 = rx + nRadius * Math.cos(collie.util.toRad(htInfo.endAngle));
            var y2 = ry + nRadius * Math.sin(collie.util.toRad(htInfo.endAngle));
            var angle = htInfo.anticlockwise ? htInfo.startAngle - htInfo.endAngle : htInfo.endAngle - htInfo.startAngle;
            
            if (Math.abs(angle) >= 360) {
              angle = 360;
            } else if (angle < 0) {
              angle += 360;
            }
            
            var flag1 = (angle > 180 ? 1 : 0);
            var flag2 = htInfo.anticlockwise ? 0 : 1;
            
            if (angle >= 360) {
                circle = this._oPaper.circle(rx, ry, nRadius);
            } else {
                circle = this._oPaper.path("M" + x1 + "," + y1 + "a" + nRadius + "," + nRadius + ",0," + flag1 + "," + flag2 + "," + (x2 -x1) + "," + (y2 -y1) + (htInfo.closePath ? "L" + rx + "," + ry + "L" + x1 + "," + y1 + "Z" : ""));
            }
        }
        
        if (circle) {
            circle.transform("t" + (nStrokeWidth / 2) + "," + (nStrokeWidth / 2));
            
            if (htInfo.fillImage) {
                collie.ImageManager.getImage(htInfo.fillImage, function (el) {
                    circle.attr("fill", "url('" + el.src + "')");
                });
            } else if (htInfo.fillColor) {
                circle.attr("fill", htInfo.fillColor);
            }
            
            if (htInfo.strokeColor) {
                circle.attr("stroke", htInfo.strokeColor);
            }
            
            circle.attr("stroke-width", htInfo.strokeWidth);
        }
    },
    
    /**
     * Delegate
     * @private
     */
    onCanvasDraw : function (oEvent) {
        var htInfo = this.get();        
        var oContext = oEvent.context;
        var nX = oEvent.x;
        var nY = oEvent.y;
        var bIsRetinaDispaly = collie.Renderer.isRetinaDisplay();
        var nRadius = htInfo.radius;
        var nStrokeWidth = htInfo.strokeWidth;
        var nWidth = htInfo.width;
        var nHeight = htInfo.height;
        
        if (bIsRetinaDispaly) {
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
        
        if (htInfo.strokeColor) {
            oContext.strokeStyle = htInfo.strokeColor;
        }
        
        if (nStrokeWidth) {
            oContext.lineWidth = nStrokeWidth;
        }
        
        if (nRadius) {
            var rx = nX + nRadius;
            var ry = nY + nRadius;
            var bFullCircle = Math.abs(htInfo.startAngle - htInfo.endAngle) >= 360;
            
            oContext.beginPath();
            
            if (htInfo.closePath && !bFullCircle) {
                oContext.moveTo(rx, ry);
            }
            
            oContext.arc(rx, ry, nRadius, collie.util.toRad(htInfo.startAngle), collie.util.toRad(htInfo.endAngle), htInfo.anticlockwise);          
            
            if (htInfo.closePath) {
                oContext.closePath();
            }
            
            if (htInfo.fillColor || htInfo.fillImage) {
                oContext.fill();
            }    
            
            if (htInfo.strokeWidth) {
                oContext.stroke();
            }
            
        }
    },
    
    /**
     * Move the position of the Circle, relatively to its center.
     * 
     * @param {Number} nCenterX
     * @param {Number} nCenterY
     * @return {collie.Circle} For the method chaining
     */
    center : function (nCenterX, nCenterY) {
        this.set("x", nCenterX - this._htOption.radius);
        this.set("y", nCenterY - this._htOption.radius);
        return this;
    },
    
    /**
     * Returns information on the Class as String
     * 
     * @return {String}
     */
    toString : function () {
        return "Circle" + (this._htOption.name ? " " + this._htOption.name : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);
