/**
 * 2D Tiled Map
 * - 2D Tiled Map is optimized canvas rendering. so you should set renderingMode option as "canvas" in a layer. but an object layer doesn't need to set canvas rendering.
 * @class
 * @extends collie.Component
 * @param {Number} nTileWidth 타일 1개의 너비
 * @param {Number} nTileHeight 타일 1개의 높이
 * @param {Object} htOption
 * @param {Boolean} [htOption.useEvent=true] 맵을 움직이는 이벤트를 사용한다
 * @param {Boolean} [htOption.useCache=false] Canvas를 사용할 때, 맵의 크기가 작을 경우 전체 사이즈를 미리 만들어 놓는 방식을 사용한다
 * @param {Boolean} [htOption.useLiveUpdate=false] 맵을 움직이는 중간에 타일을 업데이트 한다
 * @param {Number} [htOption.updateInterval=150] 업데이트 주기를 설정한다. 단위는 ms
 * @param {Boolean} [htOption.useLimitMoving=true] 맵을 벗어나게 움직일 수 없음
 * @param {Number} [htOption.cacheTileSize=1] 화면 범위 밖의 타일을 사방에 해당 사이즈 크기만큼 미리 생성함
 * @requires collie.addon.js
 * @example
// Make random data
var rowLength = 20;
var colLength = 20;
var objectCount = 10;
var tileSize = 30; // px
var mapData = [];
for (var row = 0; row < rowLength; row++) {
    var rowData = [];
    for (var col = 0; col < colLength; col++) {
        rowData.push({
            backgroundColor: Math.random() > 0.5 ? "red" : "yellow" // A Tile data doesn't necessary to contain dimension and position.
        });
    }
    mapData.push(rowData);
}

// Create a Map instance
var map = new collie.Map(tileSize, tileSize, {
    useEvent: true,
    useLiveUpdate : false
}).addTo(layer).addObjectTo(objectLayer);

// Add a mapdata.
map.setMapData(mapData);

// Add objects for display on the map.
for (var i = 0; i < objectCount; i++) {
    var tileX = Math.round(Math.random() * (colLength - 1));
    var tileY = Math.round(Math.random() * (rowLength - 1));
    var pos = map.getTileIndexToPos(tileX, tileY);
    map.addObject(tileX, tileY, new collie.DisplayObject({
        x : pos.x + 5,
        y : pos.y + 5,
        width : tileSize - 10,
        height : tileSize - 10,
        backgroundColor : "blue"
    }));
}

// Attach a event handler.
map.attach({
    mapclick : function (e) {
        console.log(e.tileX, e.tileY);
    }
});
 */
collie.Map = collie.Class(/** @lends collie.Map.prototype */{
    $init : function (nTileWidth, nTileHeight, htOption) {
        this._oLayer = null;
        this._oObjectLayer = null;
        this._fOnMousemove = this._onMousemove.bind(this);
        this._fOnMouseup = this._onMouseup.bind(this);
        this._fOnMousedown = this._onMousedown.bind(this);
        this._fOnClick = this._onClick.bind(this);
        this._fOnResize = this._onResize.bind(this);
        this._nTileWidth = nTileWidth;
        this._nTileHeight = nTileHeight;
        this._nStartMouseX = null;
        this._nStartMouseY = null;
        this._nStartContainerX = null;
        this._nStartContainerY = null;
        this._bIsMousedown = false;
        this._bLockScreen = false;
        this._nRowLength = 0;
        this._nColLength = 0;
        this._aMapData = [];
        this._aTiles = [];
        this._htTile = {};
        this._htObject = {};
        this._htEventInfo = {};
        this._sRenderingMode = null;
        this._oPool = new collie.Pool();
        this._oContainer = new collie.DisplayObject();
        this._htContainerInfo = this._oContainer.get();
        this._oObjectContainer = new collie.DisplayObject();
        this._htLayerOption = null;
        this.option({
            cacheTileSize : 1,
            useCache : false,
            updateInterval : 150,
            useLiveUpdate : false,
            useEvent : true,
            useLimitMoving : true
        });
        
        this._oTimerUpdate = collie.Timer.repeat(this._prepareTile.bind(this), this._htOption.updateInterval, {
            useAutoStart : false
        });
        
        
        this.optionSetter("useEvent", this._setterUseEvent.bind(this));
        this.optionSetter("updateInterval", function (v) {
            this._oTimerUpdate.setDuration(v);
        }.bind(this));
        
        if (typeof htOption !== "undefined") {
            this.option(htOption);
        }
        
        this._setterUseEvent(this._htOption.useEvent);
    },
    
    /**
     * 레이어에 바로 추가한다.
     * 인터페이스의 통일성을 위해 추가함
     * 
     * @param {collie.Layer} oLayer
     * @return {collie.Map} 메서드 체이닝을 위한 반환 값
     */
    addTo : function (oLayer) {
        this.setLayer(oLayer);
        return this;
    },
    
    /**
     * 레이어에 Object을 바로 추가한다.
     * 인터페이스의 통일성을 위해 추가함
     * 
     * @param {collie.Layer} oLayer
     * @return {collie.Map} 메서드 체이닝을 위한 반환 값
     */
    addObjectTo : function (oLayer) {
        this.setObjectLayer(oLayer);
        return this;
    },
    
    /**
     * Map을 추가할 레이어를 설정한다
     * @param {collie.Layer} oLayer
     */
    setLayer : function (oLayer) {
        // 기존에 등록된 레이어가 있다면 제거
        if (this._oLayer !== null) {
            this.unsetLayer();
        }
        
        // 모바일에서 DOM모드에 Map을 쓸 수 없음
        // if (oLayer.getRenderingMode() === "dom" && !collie.util.getDeviceInfo().desktop) {
            // throw new Error("The collie.Map doesn't support DOM mode in mobile devices");
        // }
        
        this._oLayer = oLayer;
        this._htLayerOption = this._oLayer._htOption;
        this._sRenderingMode = this._oLayer.getRenderingMode();
        this._oLayer.attach("resize", this._fOnResize);
        
        if (this._htOption.useEvent) {
            this._oLayer.attach("mousemove", this._fOnMousemove);
            this._oLayer.attach("mouseup", this._fOnMouseup);
            this._oLayer.attach("mousedown", this._fOnMousedown);
            this._oLayer.attach("click", this._fOnClick);
        }
        
        this._oContainer.addTo(oLayer);
        this._prepareStage();
    },
    
    /**
     * @private
     */
    _prepareStage : function () {
        var nContainerWidth = this._htLayerOption.width;
        var nContainerHeight = this._htLayerOption.height;
        var bUseCache = false;
        var nPoolSize = 0;
        
        if (this._htOption.useCache && this._sRenderingMode === "canvas") {
            nContainerWidth = this._nTileWidth * this._nColLength,
            nContainerHeight = this._nTileHeight * this._nRowLength,
            bUseCache = true;
            nPoolSize = this._nColLength * this._nRowLength;
        } else {
            var nColCount = Math.ceil(this._htLayerOption.width / this._nTileWidth) + 2;
            var nRowCount = Math.ceil(this._htLayerOption.height / this._nTileHeight) + 2;
            nPoolSize = (nColCount + this._htOption.cacheTileSize * 2) * (nRowCount + this._htOption.cacheTileSize * 2);            
        }
        
        this._oContainer.set({
            width : nContainerWidth,
            height : nContainerHeight,
            useCache : bUseCache
        });
            
        // pool 사이즈를 화면 크기에 맞게 변경
        this._oPool.changeSize(nPoolSize);
        
        if (bUseCache) {
            this._prepareTileWithCache();
        } else {
            this._prepareTile();
        }
    },
    
    /**
     * Map을 레이어에서 제거한다
     */
    unsetLayer : function () {
        if (this._oLayer !== null) {
            this._oLayer.detach("resize", this._fOnResize);
            
            if (this._htOption.useEvent) {
                this._oLayer.detach("mousemove", this._fOnMousemove);
                this._oLayer.detach("mouseup", this._fOnMouseup);
                this._oLayer.detach("mousedown", this._fOnMousedown);
                this._oLayer.detach("click", this._fOnClick);
            }
            
            this._oContainer.leave();
            this._oLayer = null;
            this._sRenderingMode = null;
        }
    },
    
    /**
     * Object을 추가할 레이어를 설정한다
     * @param {collie.Layer} oLayer
     */
    setObjectLayer : function (oLayer) {
        // 기존에 등록된 레이어가 있다면 제거
        if (this._oObjectLayer !== null) {
            this.unsetObjectLayer();
        }
        
        this._oObjectLayer = oLayer;
        this._oObjectContainer.addTo(this._oObjectLayer);
        this._oObjectContainer.set({
            width : this._oObjectLayer._htOption.width,
            height : this._oObjectLayer._htOption.height
        });
    },
    
    /**
     * Object을 레이어에서 제거한다
     */
    unsetObjectLayer : function () {
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.leave();
            this._oObjectLayer = null;
        }
    },
    
    /**
     * @return {collie.DisplayObject} 컨테이너 DisplayObject를 반환
     */
    getContainer : function () {
        return this._oContainer;
    },
    
    /**
     * @return {collie.DisplayObject} Object 컨테이너 DisplayObject를 반환
     */
    getObjectContainer : function () {
        return this._oObjectContainer;
    },
    
    /**
     * Container의 위치를 설정한다
     * 
     * @param {Number} nX
     * @param {Number} nY
     */
    setPosition : function (nX, nY) {
        if (this._bLockScreen) {
            return false;
        }
        
        if (this._htOption.useLimitMoving) {
            nX = Math.max(-this._nColLength * this._nTileWidth + this._htLayerOption.width, nX);
            nY = Math.max(-this._nRowLength * this._nTileHeight + this._htLayerOption.height, nY);
            nX = Math.min(0, nX);
            nY = Math.min(0, nY);
        }
        
        nX = Math.round(nX);
        nY = Math.round(nY);
        this._oContainer.set("x", nX);
        this._oContainer.set("y", nY);
        this._htEventInfo.x = nX;
        this._htEventInfo.y = nY;
        
        // action이 활성화 돼 있다면 action도 같이 이동
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.set("x", nX);
            this._oObjectContainer.set("y", nY);
        }
    },
    
    /**
     * Container의 위치를 반환한다
     * 
     * @return {Object} htResult
     * @return {Number} htResult.x
     * @return {Number} htResult.y
     */
    getPosition : function () {
        return {
            x : this._htContainerInfo.x,
            y : this._htContainerInfo.y
        };
    },
    
    /**
     * tileX 길이를 반환
     * 
     * @param {Number}
     */
    getTileXLength : function () {
        return this._nColLength;
    },
    
    /**
     * tileY 길이를 반환
     * 
     * @param {Number}
     */
    getTileYLength : function () {
        return this._nRowLength;
    },
    
    /**
     * 맵을 일괄적으로 생성한다
     * @param {Array} aMapData 맵 데이터 array[row][col] = htOption
     */
    setMapData : function (aMapData) {
        this._aMapData = aMapData;
        
        for (var row = 0, rowLength = this._aMapData.length; row < rowLength; row++) {
            for (var col = 0, colLength = this._aMapData[row].length; col < colLength; col++) {
                this._appendTileOption(col, row, this._aMapData[row][col]);
            }
        }
        
        this._cacheTileLength();
        this._prepareStage();
    },
    
    /**
     * 맵 데이터를 초기화 한다
     */
    unsetMapData : function () {
        this._aMapData = null;
    },
    
    /**
     * 맵을 개별적으로 생성한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption
     */
    addTile : function (nTileX, nTileY, htOption) {
        htOption = htOption || {};
        this._aMapData[nTileY] = this._aMapData[nTileY] || [];
        
        // 이미 있는 타일이면 먼저 제거
        if (this._aMapData[nTileY][nTileX]) {
            this.removeTile(nTileX, nTileY);
        }
        
        this._appendTileOption(nTileX, nTileY, htOption);
        this._aMapData[nTileY][nTileX] = htOption;
        this._cacheTileLength();
    },
    
    /**
     * 타일 정보에 시스템 옵션을 삽입
     * 
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption
     */
    _appendTileOption : function (nTileX, nTileY, htOption) {
        htOption.width = this._nTileWidth;
        htOption.height = this._nTileHeight;
        htOption.x = nTileX * this._nTileWidth;
        htOption.y = nTileY * this._nTileHeight;
        htOption.tileX = nTileX;
        htOption.tileY = nTileY;
    },
    
    /**
     * 타일에 객체를 추가
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {collie.DisplayObject} oDisplayObject
     */
    addObject : function (nTileX, nTileY, oDisplayObject) {
        // 이미 추가된 객체라면 해당 타일에서 제거
        if (typeof oDisplayObject._htOption.tileX !== "undefined" && oDisplayObject._htOption.tileX !== null) {
            this.removeObject(oDisplayObject);
        }
        
        oDisplayObject.set("mapObject", this);
        this._addObjectToTile(nTileX, nTileY, oDisplayObject);
    },
    
    /**
     * 보여지는 영역에 속하는지 확인
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Boolean}
     */
    isVisibleOffset : function (nTileX, nTileY) {
        return (this._htOption.useCache && this._sRenderingMode === "canvas") || (
            this._htEventInfo.startTileX <= nTileX &&
            this._htEventInfo.endTileX >= nTileX &&
            this._htEventInfo.startTileY <= nTileY &&
            this._htEventInfo.endTileY >= nTileY
        );
    },
    
    /**
     * @private
     */
    _addObjectToTile : function (nTileX, nTileY, oDisplayObject) {
        this._htObject[nTileY] = this._htObject[nTileY] || {};
        this._htObject[nTileY][nTileX] = this._htObject[nTileY][nTileX] || [];
        this._htObject[nTileY][nTileX].push(oDisplayObject);
        oDisplayObject.set("tileX", nTileX);
        oDisplayObject.set("tileY", nTileY);
        
        // 현재 보여지는 영역에 있으면 바로 추가
        if (!oDisplayObject.getParent() && this.isVisibleOffset(nTileX, nTileY)) {
            oDisplayObject.addTo(this._oObjectContainer);
        }
    },
    
    /**
     * 등록돼 있는 객체를 옮김
     * 
     * @param {Number} nTileX 옮길 타일 x
     * @param {Number} nTileY 옮길 타일 y
     * @param {collie.DisplayObject} 타일에 등록돼 있는 객체
     */
    moveObject : function (nTileX, nTileY, oDisplayObject) {
        if (typeof oDisplayObject._htOption.tileX !== "undefined" && oDisplayObject._htOption.tileX !== null) {
            this._removeObjectFromTile(oDisplayObject, this.isVisibleOffset(nTileX, nTileY));
            this._addObjectToTile(nTileX, nTileY, oDisplayObject);
        }
    },
    
    /**
     * 타일에서 객체를 제거
     * 
     * @param {collie.DisplayObject} oDisplayObject
     */
    removeObject : function (oDisplayObject) {
        oDisplayObject.leave();
        oDisplayObject.set("mapObject", null);
        this._removeObjectFromTile(oDisplayObject);
    },
    
    /**
     * @private
     * @param {collie.DisplayObject} oDisplayObject 타일에 등록돼 있는 객체
     * @param {Boolean} bSkipRemove 화면에서 제거하는 과정을 생략한다
     */
    _removeObjectFromTile : function (oDisplayObject, bSkipRemove) {
        var nTileX = oDisplayObject._htOption.tileX;
        var nTileY = oDisplayObject._htOption.tileY;
        oDisplayObject.set("tileX", null);
        oDisplayObject.set("tileY", null);
        
        if (this._htObject[nTileY] && this._htObject[nTileY][nTileX]) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (this._htObject[nTileY][nTileX][i] === oDisplayObject) {
                    this._htObject[nTileY][nTileX].splice(i, 1);
                    break;
                }
            }
        }
        
        // 화면에서 제거
        if (!bSkipRemove && !this.isVisibleOffset(nTileX, nTileY) && oDisplayObject.getParent()) {
            oDisplayObject.leave(); 
        }
    },
    
    /**
     * 화면을 움직이지 않게 한다
     * 
     * @return {collie.Map}
     */
    lock : function () {
        this._bLockScreen = true;
        return this;
    },
    
    /**
     * 화면을 움직이게 한다
     * 
     * @return {collie.Map}
     */
    unlock : function () {
        this._bLockScreen = false;
        return this;
    },
    
    /**
     * 타일의 zIndex를 구한다
     * 
     * @private
     * @return {Number}
     */
    _getTileZIndex : function (tileX, tileY) {
        return 10 + tileY;
    },
    
    /**
     * 타일 길이를 구해놓는다
     * @private
     */
    _cacheTileLength : function () {
        this._nRowLength = this._aMapData.length;
        this._nColLength = this._aMapData[this._nRowLength - 1].length;
    },
    
    /**
     * 타일을 지운다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    removeTile : function (nTileX, nTileY) {
        if (this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) {
            delete this._aMapData[nTileY][nTileX];
        }
    },
    
    /**
     * 해당 타일의 옵션을 변경한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption 기존 옵션이 사라지는 것이 아니고 중첩된다
     */
    changeTile : function (nTileX, nTileY, htOption) {
        var htTile = this.getTile(nTileX, nTileY);
        
        if (htTile && htOption) {
            for (var i in htOption) {
                htTile[i] = htOption[i];
            }
            
            // 현재 타일이 만들어져 있으면 수정
            if (this._htTile[nTileY] && this._htTile[nTileY][nTileX]) {
                this._htTile[nTileY][nTileX].set(htOption);
            }
        }
    },
    
    /**
     * 타일을 가져온다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Object|Boolean} DisplayObject가 반환되지 않고 타일 정보가 반환 됨
     */
    getTile : function (nTileX, nTileY) {
        return (this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) ? this._aMapData[nTileY][nTileX] : false;
        // return (this._htTile[nTileY] && this._htTile[nTileY][nTileX]) ? this._htTile[nTileY][nTileX] : false;
    },
    
    /**
     * 해당 타일을 둘러싼 타일 목록을 구한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Array} DisplayObject가 반환되지 않고 타일 정보가 반환 됨
     */
    getSurroundedTiles : function (nTileX, nTileY) {
        var aTiles = [];
        var top = this.getTile(nTileX, nTileY - 1);
        var bottom = this.getTile(nTileX, nTileY + 1);
        var left = this.getTile(nTileX - 1, nTileY);
        var right = this.getTile(nTileX + 1, nTileY);
        
        if (top) {
            aTiles.push(top);
        }
        
        if (right) {
            aTiles.push(right);
        }
        
        if (bottom) {
            aTiles.push(bottom);
        }
        
        if (left) {
            aTiles.push(left);
        }
        
        return aTiles;
    },
    
    /**
     * 해당 좌표에 등록된 객체를 가져온다
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Array|Boolean}
     */
    getObjects : function (nTileX, nTileY) {
        return this._htObject[nTileY] && this._htObject[nTileY][nTileX] ? this._htObject[nTileY][nTileX] : false;
    },
    
    /**
     * 필터를 이용해 해당 좌표에 등록된 객체를 가져온다
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Function} fFilter
     * @return {collie.DisplayObject|Boolean}
     */
    getObject : function (nTileX, nTileY, fFilter) {
        if (this.hasObject(nTileX, nTileY)) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (fFilter(this._htObject[nTileY][nTileX][i]) === true) {
                    return this._htObject[nTileY][nTileX][i];
                }
            }
        }
        
        return false;
    },
    
    /**
     * 해당 좌표에 객체가 있는지 반환
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Function} fFilter
     * @return {Boolean}
     */
    hasObject : function (nTileX, nTileY, fFilter) {
        var isObject = this._htObject[nTileY] && this._htObject[nTileY][nTileX] && this._htObject[nTileY][nTileX].length;
        
        if (isObject && fFilter) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (fFilter(this._htObject[nTileY][nTileX][i]) === true) {
                    return true;
                }
            }
            
            return false;
        }
        
        return isObject;
    },
    
    /**
     * 화면 안으로 들어온 객체 처리
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _enterObject : function (nTileX, nTileY) {
        var objects = this.getObjects(nTileX, nTileY);
        
        if (objects) {
            for (var i = 0, l = objects.length; i < l; i++) {
                objects[i].addTo(this._oObjectContainer);
            }
        }
    },
    
    /**
     * 화면 밖으로 나간 객체 처리
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _leaveObject : function (nTileX, nTileY) {
        var objects = this.getObjects(nTileX, nTileY);
        
        if (objects) {
            for (var i = 0, l = objects.length; i < l; i++) {
                objects[i].leave();
            }
        }
    },
    
    /**
     * 타일 인덱스로 포지션을 구함
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Object} htResult
     * @return {Number} htResult.x
     * @return {Number} htResult.y
     */
    getTileIndexToPos : function (nTileX, nTileY) {
        return {
            x : nTileX * this._nTileWidth,
            y : nTileY * this._nTileHeight
        };
    },
    
    /**
     * 포지션으로 타일 인덱스를 구함
     * 
     * @param {Number} nX
     * @param {Number} nY
     * @return {Object} htResult
     * @return {Number} htResult.tileX
     * @return {Number} htResult.tileY
     */
    getPosToTileIndex : function (nX, nY) {
        return {
            tileX : Math.floor(nX / this._nTileWidth),
            tileY : Math.floor(nY / this._nTileHeight)
        };
    },
    
    /**
     * @private
     */
    _setterUseEvent : function (bUseEvent) {
        // 레이어가 등록돼 있다면 바로 이벤트를 등록
        if (this._oLayer !== null) {
            if (bUseEvent) {
                this._oLayer.attach("mousemove", this._fOnMousemove);
                this._oLayer.attach("mouseup", this._fOnMouseup);
                this._oLayer.attach("mousedown", this._fOnMousedown);
                this._oLayer.attach("click", this._fOnClick);
            } else {
                this._oLayer.detach("mousemove", this._fOnMousemove);
                this._oLayer.detach("mouseup", this._fOnMouseup);
                this._oLayer.detach("mousedown", this._fOnMousedown);
                this._oLayer.detach("click", this._fOnClick);
            }
        }
    },
    
    _onMousemove : function (e) {
        /**
         * 맵이 이동할 떄
         * @name collie.Map#mapmove
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        if (this._bIsMousedown && this.fireEvent("mapmove", this._htEventInfo) !== false) {
            this.setPosition(this._nStartContainerX + (e.x - this._nStartMouseX), this._nStartContainerY + (e.y - this._nStartMouseY));
        }
    },
    
    _onMousedown : function (e) {
        this._htEventInfo.eventX = e.x;
        this._htEventInfo.eventY = e.y;
        
        /**
         * 맵에 마우스나 터치를 시작했을 때
         * @name collie.Map#mapdown
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {Number} htEvent.eventX 이벤트 x 좌표
         * @param {Number} htEvent.eventY 이벤트 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        if (this.fireEvent("mapdown", this._htEventInfo) === false) {
            return;
        }
        
        this._bIsMousedown = true;
        this._nStartMouseX = e.x;
        this._nStartMouseY = e.y;
        this._nStartContainerX = this._htContainerInfo.x;
        this._nStartContainerY = this._htContainerInfo.y;
        
        if (this._htOption.useLiveUpdate && (!this._htOption.useCache || this._sRenderingMode !== "canvas")) {
            this._oTimerUpdate.start();
        }
    },
    
    _onMouseup : function (e) {
        if (this._bIsMousedown) {
            this._nStartMouseX = null;
            this._nStartMouseY = null;
            this._nStartContainerX = null;
            this._nStartContainerY = null;
            this._bIsMousedown = false;
            
            if (this._htOption.useLiveUpdate) {
                this._oTimerUpdate.pause();
            } else if (!this._htOption.useCache || this._sRenderingMode !== "canvas") {
                this._prepareTile();
            }
            
            this._htEventInfo.eventX = e.x;
            this._htEventInfo.eventY = e.y;
            
            /**
             * 맵에 마우스나 터치가 끝났을 때
             * @name collie.Map#mapup
             * @event
             * @param {Object} htEvent
             * @param {Number} htEvent.x 컨테이너 x 좌표
             * @param {Number} htEvent.y 컨테이너 y 좌표
             * @param {Number} htEvent.eventX 이벤트 x 좌표
             * @param {Number} htEvent.eventY 이벤트 y 좌표
             * @param {HTMLEvent} htEvent.event 이벤트 객체
             */
            this.fireEvent("mapup", this._htEventInfo);
        }
    },
    
    /**
     * @private
     */
    _onClick : function (e) {
        var nX = e.x - this._htContainerInfo.x;
        var nY = e.y - this._htContainerInfo.y;
        var tileIndex = this.getPosToTileIndex(nX, nY);
        this._htEventInfo.eventX = e.x;
        this._htEventInfo.eventY = e.y;
        this._htEventInfo.tileX = tileIndex.tileX;
        this._htEventInfo.tileY = tileIndex.tileY;
        
        /**
         * 맵을 클릭했을 때
         * @name collie.Map#mapclick
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {Number} htEvent.eventX 이벤트 x 좌표
         * @param {Number} htEvent.eventY 이벤트 y 좌표
         * @param {Number} htEvent.tileX 타일 x 인덱스
         * @param {Number} htEvent.tileY 타일 y 인덱스
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        this.fireEvent("mapclick", this._htEventInfo);
    },
    
    /**
     * @private
     */
    _onResize : function () {
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.set({
                width : this._oObjectLayer._htOption.width,
                height : this._oObjectLayer._htOption.height
            });
        }
        
        this._prepareStage();
    },
    
    /**
     * 타일 생성
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _createTile : function (nTileX, nTileY) {
        if ((!this._htTile[nTileY] || !this._htTile[nTileY][nTileX]) && this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) {
            var tile = this._oPool.get().addTo(this._oContainer);
            tile.set(this._aMapData[nTileY][nTileX]);
            this._htTile[nTileY] = this._htTile[nTileY] || {};
            this._htTile[nTileY][nTileX] = this._htTile[nTileY][nTileX] = tile;
            this._aTiles.push(tile);
            this._enterObject(nTileX, nTileY);
        }
    },
    
    /**
     * 화면 밖으로 나간 타일 회수
     * @private
     * @param {Number} startTileX
     * @param {Number} startTileY
     * @param {Number} endTileX
     * @param {Number} endTileY
     * @return {Boolean} 회수 됐는지 여부
     */
    _releaseTiles : function (startTileX, startTileY, endTileX, endTileY) {
        var tile;
        var bChanged = false;
        
        for (var i = 0; i < this._aTiles.length; i++) {
            tile = this._aTiles[i];
            
            if (
                startTileX > tile._htOption.tileX ||
                tile._htOption.tileX > endTileX ||
                startTileY > tile._htOption.tileY ||
                tile._htOption.tileY > endTileY
            ) {
                delete this._htTile[tile._htOption.tileY][tile._htOption.tileX];
                this._oPool.release(tile);
                this._aTiles.splice(i, 1);
                this._leaveObject(tile._htOption.tileX, tile._htOption.tileY);
                i--;
                bChanged = true;
            }
        }
        
        return bChanged;
    },
    
    /**
     * useCache를 쓰고 있을 떄 타일 준비
     * @private
     */
    _prepareTileWithCache : function () {
        for (var row = 0; row < this._nRowLength; row++) {
            for (var col = 0; col < this._nColLength; col++) {
                this._createTile(col, row);
            }
        }
        
        /**
         * 맵의 타일이 변경됐을 때
         * @name collie.Map#mapchange
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        this.fireEvent("mapchange", this._htEventInfo);
    },
    
    /**
     * 컨테이너 위치에 따라서 타일을 다시 구성
     * @private
     */
    _prepareTile : function () {
        if (!this._aMapData.length) {
            return false;
        }
        
        var startTileX = Math.max(0, Math.floor(-this._htContainerInfo.x / this._nTileWidth) - this._htOption.cacheTileSize);
        var startTileY = Math.max(0, Math.floor(-this._htContainerInfo.y / this._nTileHeight) - this._htOption.cacheTileSize);
        var endTileX = Math.min(this._nColLength - 1, Math.floor((-this._htContainerInfo.x + this._htLayerOption.width) / this._nTileWidth) + this._htOption.cacheTileSize);
        var endTileY = Math.min(this._nRowLength - 1, Math.floor((-this._htContainerInfo.y + this._htLayerOption.height) / this._nTileHeight) + this._htOption.cacheTileSize);
        var tile;
        this._htEventInfo.startTileX = startTileX;
        this._htEventInfo.startTileY = startTileY;
        this._htEventInfo.endTileX = endTileX;
        this._htEventInfo.endTileY = endTileY;
        
        // 나간 타일 회수
        var bChanged = this._releaseTiles(startTileX, startTileY, endTileX, endTileY);
        
        // 없는 타일 생성
        for (var row = startTileY; row <= endTileY; row++) {
            for (var col = startTileX; col <= endTileX; col++) {
                this._createTile(col, row);
            }
        }
        
        // 바뀐게 있다면 이벤트 발생
        if (bChanged) {
            /**
             * 맵의 타일이 변경됐을 때
             * @name collie.Map#mapchange
             * @event
             * @param {Object} htEvent
             * @param {Number} htEvent.x 컨테이너 x 좌표
             * @param {Number} htEvent.y 컨테이너 y 좌표
             * @param {Number} htEvent.startTileX 현재 화면 안에 있는 타일의 시작 인덱스
             * @param {Number} htEvent.startTileY 현재 화면 안에 있는 타일의 시작 인덱스
             * @param {Number} htEvent.endTileX 현재 화면 안에 있는 타일의 끝 인덱스
             * @param {Number} htEvent.endTileY 현재 화면 안에 있는 타일의 끝 인덱스
             * @param {HTMLEvent} htEvent.event 이벤트 객체
             */
            this.fireEvent("mapchange", this._htEventInfo);
        }
    },
    
    /**
     * 한 화면에 보이는 최대 타일 갯수 반환
     * 
     * @return {Number}
     */
    getTileCountOnScreen : function () {
        var nColCount = Math.ceil(this._htLayerOption.width / this._nTileWidth) + 2;
        var nRowCount = Math.ceil(this._htLayerOption.height / this._nTileHeight) + 2;
        return nColCount * nRowCount;
    }
}, collie.Component);