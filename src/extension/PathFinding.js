/**
 * Path Finding with collie.Map
 * @class
 * @extends collie.Component
 * @param {collie.Map} oMap
 * @param {Function} fBeforeMove 해당 타일에 이동해도 되는지 판단하는 함수, 이동할 수 없다면 false를 반환해야 한다
 * @param {Object} fBeforeMove.tile 이동하려는 타일 정보, DisplayObject가 아님
 * @param {collie.Map} fBeforeMove.map 맵
 * @requires collie.addon.js
 * @example
```
var finder = new collie.PathFinding(map, function (tile, map) {
    if (tile.isBlock) { // isBlock is a custom option.
        return false;
    }
    
    // you can make a custom logic for checking a tile that you can go by return false. 
    ...
});

// You can get array as [[x, y], [x, y] ...].
var aPath = finder.find(0, 0, 5, 5); // startTileX, startTileY, endTileX, endTileY
console.log(aPath);

// If you want to find what a tile you can go, you can use a beforeMove method
if (finder.beforeMove(map.getTile(5, 5))) {
    console.log("I can go there!");
}
```
 */
collie.PathFinding = collie.Class(/** @lends collie.PathFinding.prototype */{
    $init : function (oMap, fBeforeMove) {
        this._oMap = oMap;
        this._fBeforeMove = fBeforeMove;
    },
    
    /**
     * 길찾기
     * 
     * @param {Number} nFromTileX
     * @param {Number} nFromTileY
     * @param {Number} nToTileX
     * @param {Number} nToTileY
     * @return {Array|Boolean} [[x1, y1], [x2, y2], ... ]
     */
    find : function (nFromTileX, nFromTileY, nToTileX, nToTileY) {
        // 넓이를 최대 횟수로 잡음
        var nLimitCount = Math.max(this._oMap.getTileCountOnScreen(), Math.pow(collie.util.getDistance(nFromTileX, nFromTileY, nToTileX, nToTileY) * 2, 2));
        var nCount = 0;
        var nCurrentTileX = nFromTileX;
        var nCurrentTileY = nFromTileY;
        var aPath = [];
        this._sFilter = '';
        
        // 진행
        while (nCurrentTileX !== nToTileX || nCurrentTileY !== nToTileY) {
            nCount++;
            
            // 너무 많이 진행되면 취소
            if (nCount > nLimitCount) {
                return false;
            }
            
            var aTiles = this._oMap.getSurroundedTiles(nCurrentTileX, nCurrentTileY);
            var nMinDistance = null;
            var oSelectedTile = null;
            
            // 길 선택
            for (var i = 0, l = aTiles.length; i < l; i++) {
                // 못가는데면 지나침
                if (!aTiles[i] || !this.beforeMove(aTiles[i]) || this._isInFilter(aTiles[i])) {
                    continue;
                }
                
                // 거리 계산
                var nDistance = collie.util.getDistance(aTiles[i].tileX, aTiles[i].tileY, nToTileX, nToTileY);
                
                // 작은 것 등록
                if (oSelectedTile === null || nDistance < nMinDistance) {
                    nMinDistance = nDistance;
                    oSelectedTile = aTiles[i];
                }
            }
            
            // 선택된 것이 있으면
            if (oSelectedTile !== null) {
                nCurrentTileX = oSelectedTile.tileX;
                nCurrentTileY = oSelectedTile.tileY;
                
                // 움직였으면 path에 등록
                aPath.push([nCurrentTileX, nCurrentTileY]);
                
                this._sFilter += "[" + nCurrentTileX + "," + nCurrentTileY + "]";
            // 막혔으면
            } else {
                this._sFilter += "[" + nCurrentTileX + "," + nCurrentTileY + "]";
                
                // 뒤로 돌아갈 수 있다면 돌아감
                if (aPath.length > 0) {
                    var beforePath = aPath.pop();
                    nCurrentTileX = beforePath[0];
                    nCurrentTileY = beforePath[1];
                    continue;
                } else {
                    // 더이상 갈길이 없을 경우는 움직이지 못함
                    return false;
                }
            }
        }

        // 패스 반환
        return (aPath.length > 0) ? aPath : false;
    },
    
    /**
     * 움직일 수 있는 타일인지 확인
     * 
     * @param {Object} htTile displayObject가 아니라 tile 정보 객체
     * @return {Boolean}
     */
    beforeMove : function (htTile) {
        return this._fBeforeMove(htTile, this._oMap) === false ? false : true;
    },
    
    /**
     * @return {collie.Map}
     */
    getMap : function () {
        return this._oMap;
    },
    
    /**
     * 대상 타일이 거쳐온 곳인지 체크
     * 
     * @private
     * @param {Object} htTile 대상 타일 정보 객체
     * @return {Boolean}
     */
    _isInFilter : function (htTile) {
        return this._sFilter.indexOf("[" + htTile.tileX + "," + htTile.tileY + "]") !== -1;
    }
}, collie.Component);