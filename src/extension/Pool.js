/**
 * A Simple Object Pool
 * 
 * @class
 * @param {Number} nSize Pool Size
 * @param {Object} htOption Default options to make displayObjects
 * @param {Function} [fClass=collie.DisplayObject] The Pool contains objects created by this class
 * @requires collie.addon.js
 * @example
 * var pool = new collie.Pool(10, {
 *  backgroundImage : "test"
 * }); 
 * 
 * // Uses 5 objects
 * var a = pool.get().addTo(layer);
 * var b = pool.get().addTo(layer);
 * var c = pool.get().addTo(layer);
 * var d = pool.get().addTo(layer);
 * var e = pool.get().addTo(layer);
 * 
 * // Releases 5 objects
 * pool.release(a);
 * pool.release(b);
 * pool.release(c);
 * pool.release(d);
 * pool.release(e);
 *
 * // change pool size after initialize a pool class.
 * pool.changeSize(20);
 * @example
 * You can also make the pool contains other classes.
 * <code>
 * var circlePool = new collie.Pool(10, {
 *  radius : 10
 * }, collie.Circle);
 * </code>
 */
collie.Pool = collie.Class(/** @lends collie.Pool.prototype */{
    /**
     * @constructs
     */
    $init : function (nSize, htOption, fClass) {
        this._nSize = nSize || 0;
        this._htDefaultOption = htOption;
        this._aPool = [];
        this._fClass = fClass || collie.DisplayObject;
        this._nLengthActiveObject = 0;
        this._allocate();
    },
    
    /**
     * @private
     */
    _allocate : function () {
        var currentSize = this._nLengthActiveObject + this._aPool.length;
        
        if (this._nSize && currentSize < this._nSize) {
            for (var i = currentSize; i < this._nSize; i++) {
                this._aPool.push(new this._fClass(this._htDefaultOption));
            }
        }
    },
    
    /**
     * Change a size of the pool.
     * @param {Number} nSize
     */
    changeSize : function (nSize) {
        this._nSize = nSize;
        this._allocate();
    },
    
    /**
     * @return {Number}
     */
    getSize : function () {
        return this._nSize;
    },
    
    /**
     * Change a default options to make displayObjects
     * @param {Object} htOption
     */
    changeOption : function (htOption) {
        this._htDefaultOption = htOption;
    },
    
    /**
     * Get an object in pool
     */
    get : function () {
        if (!this._aPool.length) {
            throw new Error("The Pool is empty");
        }
        
        var oTarget = this._aPool.pop();
        this._nLengthActiveObject++;
        return oTarget;
    },
    
    /**
     * Release an object
     * 
     * @param {collie.DisplayObject} oTarget
     */
    release : function (oTarget) {
        oTarget.leave();
        this._nLengthActiveObject--;
        this._aPool.push(oTarget);
    }
});