/**
 * - DisplayObject is the basic class for display objects.
 * - DisplayObject can contain one or many DisplayObjects, like a DOM element.
 * - Offset values change when you set a spriteX and spriteY options, but do not change when you set offsetX and offsetY values.
 * - You can use the addTo method with method chaining
 * - DisplayObject should have its useCache option set as true if it doesn't change frequently
 * 
 * @class
 * @extends collie.Component
 * @param {Object} [htOption] Options
 * @param {String} [htOption.name] Name of the object (can be duplicated, like a DOM name attribute)
 * @param {Number|String} [htOption.width="auto"] Width (when set to auto, uses the backgroundImage width if backgroundImage is set)
 * @param {Number|String} [htOption.height="auto"] Height (when set to auto, uses the backgroundImage height if backgroundImage is set)
 * @param {Number|String} [htOption.x=0] X-axis position [left, right, center]
 * @param {Number|String} [htOption.y=0] Y-axis position [top, bottom, center]
 * @param {Number} [htOption.zIndex=0] Display order. Works like the z-index property in CSS (if multiple objects have the same zIndex value, the one that was added the latest will overlap the other ones).
 * @param {Number} [htOption.opacity=1] Opacity (float number between 0 and 1)
 * @param {Number} [htOption.angle=0] Rotation angle (degrees)
 * @param {Number} [htOption.scaleX=1] X-axis ratio
 * @param {Number} [htOption.scaleY=1] Y-axis ratio
 * @param {Number} [htOption.originX=center] X-axis coordinate of origin point, used for scaling and rotating [left, right, center, number in degrees]
 * @param {Number} [htOption.originY=center] Y-axis coordinate of origin point, used for scaling and rotating [top, bottom, center, number in degrees]
 * @param {Number} [htOption.offsetX=0] X-axis coordinate of the backgroundImage
 * @param {Number} [htOption.offsetY=0] Y-axis coordinate of the backgroundImage
 * @param {Number} [htOption.spriteX=null] X-axis index value of the sprite frame to display (will be used for Sprite animation). This value will be multiplied by the frame width, and used by the offsetX option.
 * @param {Number} [htOption.spriteY=null] Y-axis index value of the sprite frame to display (will be used for Sprite animation). This value will be multiplied by the frame width, and used by the offsetX option.
 * @param {Number} [htOption.spriteLength=0] Total number of frames present on the sprite.
 * @param {Number} [htOption.spriteSheet=null] Name of the spritesheet to use as background (before, you should reference the sprite using addSprite on ImageManager)
 * @param {Array} [htOption.rangeX=null] X-axis coordinate of the range this object can be moved on, you can set this value as [min, max]. This is a relative position.
 * @param {Array} [htOption.rangeY=null] Y-axis coordinate of the range this object can be moved on, you can set this value as [min, max]. This is a relative position.
 * @param {Boolean} [htOption.positionRepeat=false] Whether this object will move to the start point when it reaches the end point. You can set start and end points with the rangeX and rangeY options.
 * @param {String} [htOption.backgroundColor] Color of the background
 * @param {String} [htOption.backgroundImage] Image to use as background (before, you should reference the image using add on ImageManager)
 * @param {String} [htOption.backgroundRepeat='no-repeat'] Rule for repeating the backgroundImage, like in CSS [repeat, repeat-x, repeat-y, no-repeat]. If this value is *not* no-repeat, the useCache option will be set as true automatically to improve performance.
 * @param {Boolean} [htOption.fitImage=false] Whether or not to fit the backgroundImage to the DisplayObject
 * @param {collie.DisplayObject|Array} [htOption.hitArea] You can set this value as a DisplayObject or a Polyline path (array of relative positions) what uses event area. For example: [[x1, y1], [x2, y2], ...]
 * @param {Boolean} [htOption.debugHitArea=false] The custom event area will be displayed when this value is set as true. This feature is useful for debugging, but decreases performance.
 * @param {Number} [htOption.velocityX=0] X-axis velocity (px)
 * @param {Number} [htOption.velocityY=0] Y-axis velocity (px)
 * @param {Number} [htOption.velocityRotate=0] Rotation velocity (degrees per second)
 * @param {Number} [htOption.forceX=0] X-axis force (px per second)
 * @param {Number} [htOption.forceY=0] Y-axis force (px per second)
 * @param {Number} [htOption.forceRotate=0] Rotation force (degrees per second)
 * @param {Number} [htOption.mass=1] Mass
 * @param {Number} [htOption.friction=0] Friction
 * @param {Boolean} [htOption.useRealTime=true] When this value set as true, the Renderer will decide to skip a frame that was delayed.
 * @param {Boolean} [htOption.useCache=false] Whether or not to use cache. It uses a canvas that draws children's view. This feature improves performance for rendering objects, but uses much more memory.
 * @param {String|Boolean} [htOption.useEvent="auto"] Whether or not to use events. If either the Layer useEvent option or the DisplayObject useEvent option is false, this object won't use events. If this value is set as auto, It will use events when it has an events handler.
 * @param {Boolean} [htOption.visible=true] Whether or not to display the object. If this option is set as false, the children will not be displayed either.
 */
collie.DisplayObject = collie.Class(/** @lends collie.DisplayObject.prototype */{
	/**
	 * Class type
	 * @type {String}
	 */
	type : "displayobject",

	$init : function (htOption) {
		this._bInitOption = true;
		this._htOption = {
			name : "", // 객체 이름
			width : 'auto',
			height : 'auto',
			x : 0,
			y : 0,
			zIndex : 0, // 표시 순서
			opacity : 1, // 투명도
			angle : 0, // 로테이션(각도)
			scaleX : 1,
			scaleY : 1,
			originX : "center",
			originY : "center",
			offsetX : 0,
			offsetY : 0,
			spriteX : null,
			spriteY : null,
			spriteLength : 0,
			spriteSheet : null,
			rangeX : null, // X좌표 가용 범위를 설정, 배열로 min, max 설정함 [min, max]
			rangeY : null, // Y좌표 가용 범위를 설정, 배열로 min, max 설정함 [min, max]
			positionRepeat : false, // x,y 좌표의 범위 설정이 되어 있는 경우 범위를 벗어나면 원점으로 돌아오는지 여부를 설정. fasle면 경계값까지만 움직이고 멈춤
			backgroundColor : '', // 배경색
			backgroundImage : '', // 배경이미지, 이미지매니져 리소스 이름이나 엘리먼트
			backgroundRepeat : 'no-repeat', // 배경 이미지 반복 repeat, repeat-x, repeat-y, no-repeat
			hitArea : null,
			debugHitArea : false,
			useCache : false,
			useEvent : "auto",
			fitImage : false, // 이미지를 객체 크기에 맞게 늘리기
			velocityX : 0,
			velocityY : 0,
			velocityRotate : 0,
			forceX : 0,
			forceY : 0,
			forceRotate : 0,
			mass : 1, // 질량
			friction : 0, // 마찰
			useRealTime : true,
			visible : true // 화면 표시 여부
		};
		
		if (htOption) {
			this.option(htOption);
		}
		
		this._htDirty = {};
		this._htMatrix = {};
		this._sId = ++collie.DisplayObject._idx;
		this._elImage = null;
		this._aDisplayObjects = [];
		this._oLayer = null;
		this._oParent = null;
		this._oDrawing = null;
		this._bIsSetOption = false;
		this._bChanged = true;
		this._bChangedTransforms = true;
		this._bCustomSize = false;
		this._aChangedQueue = null;
		this._htGetImageData = null;
		this._htRelatedPosition = {};
		this._htParentRelatedPosition = {};
		this._htBoundary = {};
		this._sRenderingMode = null;
		this._bRetinaDisplay = collie.Renderer.isRetinaDisplay();
		this._oTimerMove = null;
		this._nPositionRight = null;
		this._nPositionBottom = null;
		this._nImageWidth = 0;
		this._nImageHeight = 0;
		this._htImageSize = null;
		this._htSpriteSheet = null;
		this._htOrigin = {
			x : 0,
			y : 0
		};
		
		this.set(this._htOption);
		this._bIsSetOption = true;
	},
	
	/**
	 * Set the options
	 * @example
	 * oDisplayObject.set({
	 * 	visible : false,
	 *  opacity : 1
	 * });
	 * 
	 * oDisplayObject.set("visible", true);
	 * 
	 * @param {String|Object} vKey Name of the option. Multiple values can be set using an object.
	 * @param {Variables} vValue Value.
	 * @param {Boolean} [bSkipSetter] Do not perform the setter. Not recommended for general use.
	 * @param {Boolean} [bSkipChanged] Do not change the state. The object will not be redrawn.
	 * @return {collie.DisplayObject} For method chaining.
	 */
	set : function (vKey, vValue, bSkipSetter, bSkipChanged) {
		if (typeof vKey === "object") {
			// 나머지 실행
			for (var i in vKey) {
				this.set(i, vKey[i]);
			}
		} else {
			// 값이 변하지 않았다면 처리하지 않음
			if (this._bIsSetOption && this._htOption[vKey] === vValue) {
				return;
			}
			
			// 크기 자동 변경 값 적용
			if (vKey === "width" || vKey === "height") {
				if (vValue !== "auto") {
					this._bCustomSize = true;
				} else if (vValue === "auto" && this.getImage() !== null) {
					vValue = this.getImageSize()[vKey];
				} else {
					vValue = 100;
				}
			}
			
			this._htOption[vKey] = vValue;
			this.setDirty(vKey); // record value to find
			
			if (!bSkipSetter) {
				this._setter(vKey, vValue);
			}
			
			if (!bSkipChanged) {
				// check if DisplayObject changed only transform values
				this.setChanged((vKey === 'x' || vKey === 'y' || vKey === 'angle' || vKey === 'scaleX' || vKey === 'scaleY' || vKey === 'opacity') ? true : false);
			}
		}
		
		return this;
	},
	
	/**
	 * setter
	 * @private
	 * @param {String} vKey Option name
	 * @param {Variables} vValue Value
	 */
	_setter : function (vKey, vValue) {
		// zIndex hash 갱신
		if (vKey === "zIndex") {
			if (this._oParent) {
				this._oParent.changeDisplayObjectZIndex(this);
			} else if (this.getLayer()) {
				this._oLayer.changeDisplayObjectZIndex(this);
			}
		}
		
		// 값 보정
		if (vKey === "x" || vKey === "y") {
			if (typeof vValue === "string") {
				this.align(vKey === "x" ? vValue : false, vKey === "y" ? vValue : false);
			}
			
			this._fixPosition();
			this.resetPositionCache();
		}
		
		// 이미지 설정
		if (vKey === "backgroundImage") {
			this.setImage(vValue);
		}
		
		// 스프라이트 속성 적용
		if (vKey === 'spriteX' || vKey === 'spriteY' || vKey === 'spriteSheet') {
			this._setSpritePosition(vKey, vValue);
		}
		
		if ((vKey === 'width' || vKey === 'height')) {
			if (this._htOption.spriteX !== null) {
				this._setSpritePosition("spriteX", this._htOption.spriteX);
			}
			
			if (this._htOption.spriteY !== null) {
				this._setSpritePosition("spriteY", this._htOption.spriteY);
			}
		}
		
		// hitArea 배열 캐싱
		if (vKey === 'hitArea' && vValue instanceof Array) {
			this._makeHitAreaBoundary();
		}
		
		// origin 변환
		if (vKey === 'width' || vKey === 'height' || vKey === 'originX' || vKey === 'originY') {
			this._setOrigin();
		}
		
		// 배경 반복 상태면 캐시 사용
		if ((vKey === 'backgroundRepeat' && vValue !== 'no-repeat')) {
			this.set("useCache", true);
		}
		
		// 캔버스 캐시 생성
		if (vKey === 'useCache' && this._oDrawing !== null && this._oDrawing.loadCache) {
			if (vValue) {
				this._oDrawing.loadCache();
			} else {
				this._oDrawing.unloadCache();
			}
		}
	},
	
	/**
	 * Get the value of an option
	 * @param {String} sKey Key of the option (will return all the options if not set).
	 * @return {Variable|Object} Value of the option or object containing all options if sKey is not set.
	 * @example
	 * var htData = oDisplayObject.get();
	 * var bVisible = oDisplayObject.get("visible");
	 * @example
	 * // Use less calls to this method to improve performance.
	 * // before
	 * var x = oDisplayObject.get("x");
	 * var y = oDisplayObject.get("y");
	 * var width = oDisplayObject.get("width");
	 * var height = oDisplayObject.get("height");
	 * 
	 * // after
	 * var htInfo = oDisplayObject.get();
	 * htInfo.x;
	 * htInfo.y;
	 * htInfo.width;
	 * htInfo.height;
	 * 
	 * // or you can access the htOption object directly. It's not recommended but it's better than frequently call the get method.
	 * oDisplayObject._htOption.x;
	 * oDisplayObject._htOption.y;
	 * oDisplayObject._htOption.width;
	 * oDisplayObject._htOption.height;
	 */
	get : function (sKey) {
		if (!sKey) {
			return this._htOption;
		} else {
			return this._htOption[sKey];
		}
	},
	
	/**
	 * 값이 변경된 것으로 설정
	 * 
	 * @param {String} sKey 키 이름, 값이 없으면 모든 값을 다시 적용함
	 */
	setDirty : function (sKey) {
		if (this._htDirty === null) {
			this._htDirty = {};
		}
		
		if (typeof sKey === "undefined") {
			for (var i in this._htOption) {
				this._htDirty[i] = true; 				
			}
		} else {
			this._htDirty[sKey] = true; 				
		}
	},
	
	/**
	 * 값이 변경된 것을 알림
	 *
	 * @param {String} sKey 키 이름
	 * @return {Boolean} true면 값이 변경 됐음
	 */
	getDirty : function (sKey) {
		if (!sKey) {
			return this._htDirty;
		} else {
			return this._htDirty[sKey] ? true : false;
		}
	},
	
	/**
	 * Dirty 값을 초기화, 다 그리고 난 후에 실행 한다
	 * @private
	 */
	_resetDirty : function () {
		this._htDirty = null;
	},
	
	/**
	 * Add a child DisplayObject
	 * - the child DisplayObject will be affected by the current DisplayObject zIndex.
	 * 
	 * @param {collie.DisplayObject} oDisplayObject DisplayObject to add.
	 */
	addChild : function (oDisplayObject) {
		collie.util.pushWithSort(this._aDisplayObjects, oDisplayObject);
		oDisplayObject.setParent(this);
		
		if (this._oLayer !== null) {
			oDisplayObject.setLayer(this._oLayer);
		}
		
		this.setChanged();
	},
	
	/**
	 * Remove a child DisplayObject
	 * @param {collie.DisplayObject} oDisplayObject DisplayObject to remove.
	 * @param {Number} nIdx You can specify the index number if you know it, in order to improve performance.
	 */
	removeChild : function (oDisplayObject, nIdx) {
		if (typeof nIdx !== "undefined") {
			this._aDisplayObjects[nIdx].unsetLayer();
			this._aDisplayObjects[nIdx].unsetParent();			
			this._aDisplayObjects.splice(nIdx, 1);
		} else {
			for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
				if (this._aDisplayObjects[i] === oDisplayObject) {
					this._aDisplayObjects[i].unsetLayer();
					this._aDisplayObjects[i].unsetParent();
					this._aDisplayObjects.splice(i, 1);
					break;
				}
			}
		}
		
		this.setChanged();
	},
	
	/**
	 * zIndex가 변경되었다면 이 메소드를 호출
	 * 
	 * @private
	 * @param {collie.DisplayObject} oDisplayObject
	 */
	changeDisplayObjectZIndex : function (oDisplayObject) {
		this.removeChild(oDisplayObject);
		this.addChild(oDisplayObject);
	},
	
	/**
	 * 레이어나 DisplayObject 객체에 현재 객체를 추가 한다.
	 * 
	 * @param {collie.Layer|collie.DisplayObject} oTarget
	 * @return {collie.DisplayObject}
	 */
	addTo : function (oTarget) {
		// 이미 추가돼 있다면 빼고 다시 넣음
		if (this._oLayer || this._oParent) {
			// 같은데라면 동작 취소
			if (this._oLayer === oTarget || this._oParent === oTarget) {
				return this;
			} else {
				this.leave();
			}
		}
		
		oTarget.addChild(this);
		return this;
	},
	
	/**
	 * 자식이 있는지 반환
	 * 
	 * @return {Boolean} 자식이 있다면 true
	 */
	hasChild : function () {
		return this._aDisplayObjects.length > 0;
	},
	
	/**
	 * 자식을 반환
	 * 
	 * @return {Array}
	 */
	getChildren : function () {
		return this._aDisplayObjects;
	},
	
	/**
	 * 부모를 반환
	 * 
	 * @return {collie.DisplayObject}
	 */
	getParent : function () {
		return this._oParent || false;
	},
	
	/**
	 * 부모를 설정
	 * - 직접 호출하지 않는다
	 * @private
	 * @param {collie.DisplayObject} oDisplayObject
	 */
	setParent : function (oDisplayObject) {
		this._oParent = oDisplayObject;	
	},
	
	/**
	 * 부모를 해제
	 * @private
	 */
	unsetParent : function () {
		this._oParent = null;
	},
	
	/**
	 * 부모가 있을 경우 부모에서 자신을 뺀다
	 * @return {collie.DisplayObject} 자신을 반환
	 */
	leave : function () {
		var oParent = null;
		
		if (this._oParent !== null) {
			oParent = this._oParent;
		} else if (this._oLayer) {
			oParent = this.getLayer();
		}
		
		if (oParent) {
			oParent.removeChild(this);
		}
		
		return this;
	},
	
	/**
	 * 아이디를 반환 한다
	 * 
	 * @return {String}
	 */
	getId : function () {
		return this._sId;
	},
	
	/**
	 * 현재 객체의 배경 이미지를 가져온다
	 * 
	 * @return {HTMLElement}
	 */
	getImage : function () {
		return this._elImage || null;
	},
	
	/**
	 * 이미지 크기를 반환, 레티나일 경우 보정된 값을 반환 한다
	 * Return a size of the image set to backgroundImage property.
	 * If The User has a retina display, this method would return a half of size.
	 * ex) 640*940 -> 320*480
	 * 
	 * @return {Boolean|Object} htSize 이미지가 로드되지 않았으면 false를 반환. It would return as false when it has not loaded the image yet.
	 * @return {Number} htSize.width
	 * @return {Number} htSize.height
	 */
	getImageSize : function () {
		return this._htImageSize || false;
	},
	
	/**
	 * 이미지를 설정한다
	 * - TODO 비동기 주의해야 함
	 * - TODO setImage 바로 못하게 해야 함 backgroundImage로... 값이 어긋남
	 * @param {String|HTMLImageElement} vImage ImageManager의 리소스 이름이나 이미지 엘리먼트
	 * @private
	 */
	setImage : function (vImage) {
		if (typeof vImage === "string" || !vImage) {
			// 이미 걸어놓은 이미지가 있다면 취소
			if (this._htGetImageData !== null && this._htGetImageData.name !== vImage) {
				collie.ImageManager.cancelGetImage(this._htGetImageData.name, this._htGetImageData.callback);
				this._htGetImageData = null;
			}
			
			if (!vImage) {
				this._elImage = null;
				this.setChanged();
			} else {
				this._htGetImageData = {
					name : vImage,
					callback : (function (elImage) {
						this.setImage(elImage);
					}).bind(this)
				};
				
				collie.ImageManager.getImage(this._htGetImageData.name, this._htGetImageData.callback);
			}
			
			return;
		}
		
		// 같은 이미지면 적용하지 않음
		if (this._elImage && this._elImage === vImage) {
			return;
		}
		
		// reflow 예방을 위한 이미지 크기 캐시
		this._elImage = vImage;
		this._nImageWidth = vImage.width;
		this._nImageHeight = vImage.height;
		this._htImageSize = {
			width : this._bRetinaDisplay ? this._nImageWidth / 2 : this._nImageWidth,
			height : this._bRetinaDisplay ? this._nImageHeight / 2 : this._nImageHeight
		};
		this._htSpriteSheet = collie.ImageManager.getSprite(this._htOption.backgroundImage);
		
		// 사용자가 크기를 설정 안했으면 자동으로 이미지 크기로 설정 됨
		if (!this._bCustomSize) {
			this.set({
				width : this._htImageSize.width,
				height : this._htImageSize.height
			});
		}
		
		this._setSpritePosition("spriteSheet", this._htOption.spriteSheet);
		this._setSpritePosition("spriteX", this._htOption.spriteX);
		this._setSpritePosition("spriteY", this._htOption.spriteY);
		this.setDirty("backgroundImage");
		this.setChanged();
	},
	
	/**
	 * 드로잉 객체를 반환
	 * @return {collie.DisplayObjectCanvas|collie.DisplayObjectDOM}
	 */
	getDrawing : function () {
		return this._oDrawing;
	},
	
	/**
	 * 변경된 내용이 있을 경우 Layer에 알린다
	 * - 개발용
	 * TODO setChanged 실행 횟수가 많은데 중복 실행을 줄이면 성능이 향상되나?
	 * -> flag만 두고 실제 setChanged 전파는 draw하기 전에 하는 것임
	 * 
	 * @private
	 * @param {Boolean} bChangedTransforms transform 값이 변경되는지 여부
	 */
	setChanged : function (bChangedTransforms) {
		// 이미 변경된 것으로 돼 있다면 실행하지 않음
		if (this._bChanged || (bChangedTransforms && this._bChangedTransforms)) {
			return;
		}
		
		if (this._oLayer !== null) {
			this._oLayer.setChanged();
		}
		
		if (!bChangedTransforms) {
			this._bChanged = true;
		}
		
		this._bChangedTransforms = true;
		
		// 부모가 있다면 부모도 바뀐 상태로 변경, 반복적으로 부모에게 전달됨
		if (this._oParent) {
			this._oParent.setChanged(false); // transforms만 바꼈어도 부모에게는 전체가 바뀐것으로 통보
		}
	},
	
	/**
	 * 변경된 내용이 반영 되었을 때
	 * TODO changed라는 이름 변경할 필요성 있음
	 * @private
	 */
	unsetChanged : function () {
		this._bChanged = false;
		this._bChangedTransforms = false;
	},
	
	/**
	 * 현재 객체에 변경된 내용 여부를 반환
	 * DOM일 경우 변경된게 없으면 다시 안그림
	 * 
	 * @param {Boolean} bChangedOnlyTranforms
	 * @return {Boolean}
	 */
	isChanged : function (bChangedOnlyTranforms) {
		return !bChangedOnlyTranforms ? (this._bChanged || this._bChangedTransforms) : !this._bChanged && this._bChangedTransforms;
	},
	
	/**
	 * 레이어에 객체를 추가
	 * 
	 * - 직접 사용하지 않는다
	 * @private
	 * @param {collie.Layer} oLayer
	 */
	setLayer : function (oLayer) {
		// 중복된 값이 있으면 에러
		if (this._sId in collie.DisplayObject.htFactory) {
			throw new Error('Exists DisplayObject Id ' + this._sId);
		}
		
		collie.DisplayObject.htFactory[this._sId] = this;
		this._oLayer = oLayer;
		this._sRenderingMode = this._oLayer.getRenderingMode();
		this._makeDrawing();
		this._oDrawing.load();
		this.setChanged();
		
		// 정렬 적용
		if (typeof this._htOption.x === "string" || typeof this._htOption.y === "string") {
			this.align(typeof this._htOption.x === "string" ? this._htOption.x : false, typeof this._htOption.y === "string" ? this._htOption.y : false);
		}
		
		if (this._nPositionRight !== null) {
			this.right(this._nPositionRight);
			this._nPositionRight = null;
		}
		
		if (this._nPositionBottom !== null) {
			this.bottom(this._nPositionBottom);
			this._nPositionBottom = null;
		}
		
		// 자식도 setLayer 적용
		for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
			this._aDisplayObjects[i].setLayer(oLayer);
		}
	},

	/**
	 * 레이어에서 객체를 뺌
	 * @private
	 */	
	unsetLayer : function () {
		if (this.getLayer()) {
			for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
				this._aDisplayObjects[i].unsetLayer();
			}
		
			this._oDrawing.unload();
			this.setDirty();
			this.setChanged();
			this._sRenderingMode = null;
			this._oDrawing = null;
			this._oLayer = null;
			delete collie.DisplayObject.htFactory[this._sId];
		}
	},
	
	/**
	 * @private
	 */
	_makeDrawing : function () {
		if (this._oDrawing === null) {
			this._oDrawing = this._sRenderingMode === "dom" ? new collie.DisplayObjectDOM(this) : new collie.DisplayObjectCanvas(this);
		}
	},
	
	/**
	 * 레이어 반환
	 * 
	 * @return {collie.Layer|Boolean}
	 */
	getLayer : function () {
		return this._oLayer || false;
	},
	
	/**
	 * 다양한 속성을 변경하며 사용할 경우 addMatrix를 이용해 설정을 미리 만들고 changeMatrix로 변경해 사용할 수 있다.
	 * 
	 * @param {Array|Object} vMatrix 배열로 여러개를 한번에 넣을 수 있음
	 * @param {String} vMatrix.name Matrix 이름
	 * @param {Number} vMatrix.property 변경할 설정을 입력한다 
	 * @example
	 * oDisplayObject.addMatrix({
	 * 	name : "test"
	 * 	offsetX : 0,
	 * 	offsetY : 100
	 * });
	 * oDisplayObject.addMatrix([
	 * 	{ name : "test2", offsetX : 100, offsetY : 100, width : 50, height : 50 },
	 * 	{ name : "test3", offsetX : 200, offsetY : 100, width : 80, height : 80 }
	 * ]);
	 * 
	 * oDisplayObject.changeMatrix("test2");
	 * oDisplayObject.changeMatrix("test3");
	 */
	addMatrix : function (vMatrix) {
		if (vMatrix instanceof Array) {
			for (var i = 0, len = vMatrix.length; i < len; i++) {
				this.addMatrix(vMatrix[i]);
			}
			return;
		}
		
		this._htMatrix[vMatrix.name] = vMatrix;
		delete this._htMatrix[vMatrix.name].name;
	},
	
	/**
	 * 해당 Matrix로 변경한다
	 * 
	 * @param {String} sName 매트릭스 이름
	 */
	changeMatrix : function (sName) {
		if (sName in this._htMatrix) {
			this.set(this._htMatrix[sName]);
		}
	},
	
	/**
	 * DisplayObject를 갱신한다.
	 * 
	 * @param {Number} nFrameDuration 진행된 프레임 시간
	 * @param {Number} nX 부모로 부터 내려온 x좌표
	 * @param {Number} nY 부모로 부터 내려온 y좌표
	 * @param {Number} nLayerWidth 레이어 너비, update는 tick안에 있는 로직이기 때문에 성능 극대화를 위해 전달
	 * @param {Number} nLayerHeight 레이어 높이
	 * @param {Object} oContext 부모의 Canvas Context, useCache를 사용하면 넘어온다
	 * @return {Boolean} true를 반환하면 계속 바뀔게 있다는 뜻
	 * @private
	 */
	update : function (nFrameDuration, nX, nY, nLayerWidth, nLayerHeight, oContext) {
		this._updateMovableOption(nFrameDuration);
		
		// Canvas 방식이고, 보이지 않는 객체면 그린걸로 친다, 자식도 그리지 않아도 된다.
		if (this._sRenderingMode === "canvas" && !this._htOption.visible) {
			this.unsetChanged();
			return;
		}
		
		nX += this._htOption.x;
		nY += this._htOption.y;
		
		// Canvas에서 화면 밖으로 나가거나 DOM에서 바뀐게 있을 떄 그림
		if (
				(this._sRenderingMode === "dom" && this.isChanged()) || (
				this._sRenderingMode === "canvas" && (
					nX + this._htOption.width >= 0 ||
					nX <= nLayerWidth ||
					nY + this._htOption.height >= 0 ||
					nY <= nLayerHeight
				)
			)) {
			this._oDrawing.draw(nFrameDuration, nX, nY, nLayerWidth, nLayerHeight, oContext);
		}
		
		this.unsetChanged();
		this._resetDirty();
		
		// 움직임이 있으면 다시 바뀐 상태로 둠
		if (
			this._htOption.velocityX !== 0 ||
			this._htOption.velocityY !== 0 ||
			this._htOption.velocityRotate !== 0 ||
			this._htOption.forceX !== 0 ||
			this._htOption.forceY !== 0 ||
			this._htOption.forceRotate !== 0
		) {
			this.setChanged(true);
		}
		
		// Canvas 방식은 자식을 직접 그리고, DOM 방식이면 부모가 보이지 않는 상태면 자식도 그리지 않는다
		if (this._sRenderingMode === "canvas" || !this._htOption.visible) {
			return;
		}
		
		// update 자식에게 전파
		if (this.hasChild()) {
			for (var i = 0, len = this._aDisplayObjects.length; i < len; i++) {
				this._aDisplayObjects[i].update(nFrameDuration, nX, nY, nLayerWidth, nLayerHeight);
			}
		}
	},
	
	_updateMovableOption : function (nFrameDuration) {
		if (
			this._htOption.velocityX !== 0 ||
			this._htOption.velocityY !== 0 ||
			this._htOption.velocityRotate !== 0 ||
			this._htOption.forceX !== 0 ||
			this._htOption.forceY !== 0 ||
			this._htOption.forceRotate !== 0
		) {
			var nFrame = Math.max(17, nFrameDuration) / 1000;
			
			// skippedFrame 적용을 하지 않는다면 1frame 씩만 그림
			if (!this._htOption.useRealTime) {
				nFrame = 1;
			}
			
			var nVelocityX = this._htOption.velocityX;
			var nVelocityY = this._htOption.velocityY;
			var nX = this._htOption.x;
			var nY = this._htOption.y;
			
			// 힘 적용 a = F / m
			nVelocityX += (this._htOption.forceX / this._htOption.mass) * nFrame;
			nVelocityY += (this._htOption.forceY / this._htOption.mass) * nFrame;
			
			// 마찰력 적용
			var nForceFrictionX = this._htOption.friction * nVelocityX * this._htOption.mass * nFrame;
			var nForceFrictionY = this._htOption.friction * nVelocityY * this._htOption.mass * nFrame;
			
			if (nVelocityX !== 0) {
				nVelocityX = (Math.abs(nVelocityX) / nVelocityX !== Math.abs(nVelocityX - nForceFrictionX) / (nVelocityX - nForceFrictionX)) ? 0 : nVelocityX - nForceFrictionX;
			}
			
			if (nVelocityY !== 0) {
				nVelocityY = (Math.abs(nVelocityY) / nVelocityY !== Math.abs(nVelocityY - nForceFrictionY) / (nVelocityY - nForceFrictionY)) ? 0 : nVelocityY - nForceFrictionY;
			}
			
			nX += nVelocityX * nFrame;
			nY += nVelocityY * nFrame;
			nVelocityX = Math.floor(nVelocityX * 1000) / 1000;
			nVelocityY = Math.floor(nVelocityY * 1000) / 1000;
			
			if (this._htOption.friction && Math.abs(nVelocityX) < 0.05) {
				nVelocityX = 0;
			}
			
			if (this._htOption.friction && Math.abs(nVelocityY) < 0.05) {
				nVelocityY = 0;
			}
		
			// 변경이 있을 때만 설정
			if (
				nX !== this._htOption.x ||
				nY !== this._htOption.y ||
				nVelocityX !== this._htOption.velocityX ||
				nVelocityY !== this._htOption.velocityY
			) {
				this.set("x", nX);
				this.set("y", nY);
				this.set("velocityX", nVelocityX);
				this.set("velocityY", nVelocityY);
			}
			
			if (this._htOption.forceRotate !== 0) {
				this.set("velocityRotate", this._htOption.velocityRotate + this._htOption.forceRotate);
			}
			
			if (this._htOption.velocityRotate !== 0) {
				var nAngleRad = collie.util.fixAngle(collie.util.toRad(this._htOption.angle + this._htOption.velocityRotate * nFrame));
				this.set("angle", Math.round(collie.util.toDeg(nAngleRad) * 1000) / 1000);
			}
		}
	},
	
	/**
	 * 부모와 연관된 전체 좌표를 구한다(절대좌표)
	 * @todo 메소드 명이 직관적이지 못하다
	 * 
	 * @return {Object} htPos
	 * @return {Number} htPos.x
	 * @return {Number} htPos.y
	 */
	getRelatedPosition : function () {
		if (this._htRelatedPosition.x === null) {
			this._htRelatedPosition.x = this._htOption.x;
			this._htRelatedPosition.y = this._htOption.y;
			
			if (this._oParent) {
				var htPosition = this._oParent.getRelatedPosition();
				this._htRelatedPosition.x += htPosition.x;
				this._htRelatedPosition.y += htPosition.y;
			}
		}
		
		return this._htRelatedPosition;
	},
	
	/**
	 * 현재 표시 객체의 사각형 영역을 반환 한다
	 * - transform된 영역을 반환
	 * TODO Transform Matrix의 origin에 상대좌표를 적용해야 하기 때문에 캐시를 적용할 수 없음
	 * TODO Transform 안 된지도 부모를 타고 가봐야 알 수 있음!
	 * 
	 * @param {Boolean} bWithRelatedPosition 절대좌표로 변경해서 반환하는지 여부
	 * @param {Boolean} bWithPoints 좌표를 반환하는지 여부, Sensor의 box hittest에서 쓰임
	 * @return {Object} oBoundary
	 * @return {Number} oBoundary.left
	 * @return {Number} oBoundary.right
	 * @return {Number} oBoundary.top
	 * @return {Number} oBoundary.bottom
	 * @return {Number} oBoundary.isTransform 트랜스폼 사용 여부
	 * @return {Array} oBoundary.points bWithPoints를 true로 하면 좌표 배열이 넘어옴, [[x, y], [x, y], ...]
	 */
	getBoundary : function (bWithRelatedPosition, bWithPoints) {
		var htBoundary = collie.Transform.getBoundary(this, bWithPoints);
		this._htBoundary.left = htBoundary.left;
		this._htBoundary.right = htBoundary.right;
		this._htBoundary.top = htBoundary.top;
		this._htBoundary.bottom = htBoundary.bottom;
		this._htBoundary.isTransform = htBoundary.isTransform;
		this._htBoundary.points = htBoundary.points;
		
		// 절대 좌표로 변환해서 반환
		if (bWithRelatedPosition) {
			var htPos = this.getRelatedPosition();
			
			if (this._htBoundary.points) {
				for (var i = 0, l = this._htBoundary.points.length; i < l; i++) {
					this._htBoundary.points[i][0] += htPos.x;
					this._htBoundary.points[i][1] += htPos.y;
				}
			}
			
			this._htBoundary.left += htPos.x;
			this._htBoundary.right += htPos.x;
			this._htBoundary.top += htPos.y;
			this._htBoundary.bottom += htPos.y;
		}
		
		return this._htBoundary;
	},
	
	/**
	 * 위치가 변경되는 경우 캐시를 초기화 해 줌
	 * @private
	 */
	resetPositionCache : function () {
		this._htRelatedPosition.x = null;
		this._htRelatedPosition.y = null;
		
		// 자체적으로 전파
		// TODO 속도 차이 반드시 확인해 봐야 함!!
		if (this.hasChild()) {
			for (var i = 0, l = this._aDisplayObjects.length; i < l; i++) {
				this._aDisplayObjects[i].resetPositionCache();
			}
		}
	},

	/**
	 * 이벤트와 관련된 영역을 반환 한다
	 * - transform된 영역을 반환
	 * - 절대 좌표로 변환해서 반환한다
	 * 
	 * @return {Object} htReturn
	 * @return {Number} htReturn.left minX
	 * @return {Number} htReturn.right maxX
	 * @return {Number} htReturn.top minY
	 * @return {Number} htReturn.bottom maxY
	 */
	getHitAreaBoundary : function () {
		if (!this._htOption.hitArea) {
			return this.getBoundary(true);
		} else if (this._htOption.hitArea instanceof Array) {
			var aPoints = collie.Transform.points(this, collie.util.getBoundaryToPoints(this._htHitAreaBoundary));
			var htBoundary = collie.util.getBoundary(aPoints);
			var htPos = this.getRelatedPosition();
			
			return {
				left : htBoundary.left + htPos.x,
				right : htBoundary.right + htPos.x,
				top : htBoundary.top + htPos.y,
				bottom : htBoundary.bottom + htPos.y
			};
		} else { // displayObject일 경우
			return this._htOption.hitArea.getBoundary(true);
		}
	},
	
	/**
	 * Scale, Angle 변경의 중심점을 구한다
	 * 
	 * @private
	 * @return {Object} htResult
	 * @return {Number} htResult.x x축 Origin
	 * @return {Number} htResult.y y축 Origin
	 */
	getOrigin : function () {
		return this._htOrigin;
	},
	
	/**
	 * origin을 px로 설정한다
	 * @private
	 */
	_setOrigin : function () {
		switch (this._htOption.originX) {
			case "left" :
				this._htOrigin.x = 0;
				break;
				
			case "right" :
				this._htOrigin.x = this._htOption.width;
				break;
				
			case "center" :
				this._htOrigin.x = this._htOption.width / 2;
				break;
				
			default :
				this._htOrigin.x = parseInt(this._htOption.originX, 10);
		}
				
		switch (this._htOption.originY) {
			case "top" :
				this._htOrigin.y = 0;
				break;
				
			case "bottom" :
				this._htOrigin.y = this._htOption.height;
				break;
				
			case "center" :
				this._htOrigin.y = this._htOption.height / 2;
				break;
				
			default :
				this._htOrigin.y = parseInt(this._htOption.originY, 10);
		}
	},
	
	/**
	 * range를 사용하고 있는 경우 range에 맞게 포지션을 변경 한다
	 * 
	 * @private
	 */
	_fixPosition : function () {
		var nX = this._htOption.x;
		var nY = this._htOption.y;
		var nMinX;
		var nMaxX;
		var nMinY;
		var nMaxY;
		
		if (this._htOption.rangeX) {
			// 상대를 절대 값으로
			nMinX = this._htOption.rangeX[0];
			nMaxX = this._htOption.rangeX[1];
			
			if (this._htOption.positionRepeat) {
				if (nX < nMinX) { // 최소값 보다 작을 때
					do {
						nX += (nMaxX - nMinX);
					} while (nX < nMinX); 
				} else if (nX > nMaxX) { // 최대값 보다 클 때
					do {
						nX -= (nMaxX - nMinX);
					} while (nX > nMaxX);
				}
			} else {
				nX = Math.max(nMinX, nX);
				nX = Math.min(nMaxX, nX);
			}
			
			if (nX !== this._htOption.x) {
				// 절대를 상대 값으로
				this.set("x", nX, true);
			}
		}
		
		if (this._htOption.rangeY) {
			nMinY = this._htOption.rangeY[0];
			nMaxY = this._htOption.rangeY[1];
			
			if (this._htOption.positionRepeat) {
				if (nY < nMinY) { // 최소값 보다 작을 때
					do {
						nY += (nMaxY - nMinY);
					} while (nY < nMinY); 
				} else if (nY > nMaxY) { // 최대값 보다 클 때
					do {
						nY -= (nMaxY - nMinY);
					} while (nY > nMaxY);
				}
			} else {
				nY = Math.max(nMinY, nY);
				nY = Math.min(nMaxY, nY);
			}
			
			if (nY !== this._htOption.y) {
				this.set("y", nY, true);
			}
		}
	},
	
	/**
	 * hitArea 옵션이 배열로 들어올 경우 boundary를 구해서 저장해놓는다
	 * @private
	 */
	_makeHitAreaBoundary : function () {
		this._htHitAreaBoundary = collie.util.getBoundary(this._htOption.hitArea);
	},
	
	/**
	 * 객체의 위치를 정렬한다.
	 * 
	 * @param {String|Boolean} [sHorizontal=center] 수평 정렬 [left|right|center], false면 정렬하지 않음
	 * @param {String|Boolean} [sVertical=center] 수직 정렬 [top|bottom|center], false면 정렬하지 않음
	 * @param {collie.DisplayObject} [oBaseObject] 기준 객체, 값이 없을 경우 부모, 부모가 없을 경우 레이어를  기준으로 정렬 한다.
	 */
	align : function (sHorizontal, sVertical, oBaseObject) {
		if (!this.getLayer()) {
			return;
		}
		
		oBaseObject = oBaseObject || this.getParent();
		var nWidth = 0;
		var nHeight = 0;
		var nX = 0;
		var nY = 0;
		
		// 기준 크기 구함
		if (oBaseObject) {
			nWidth = oBaseObject._htOption.width;
			nHeight = oBaseObject._htOption.height;
		} else {
			nWidth = this._oLayer._htOption.width;
			nHeight = this._oLayer._htOption.height;
		}
		
		if (sHorizontal !== false) {
			nX = (sHorizontal === "right") ? nWidth - this._htOption.width : nWidth / 2 - this._htOption.width / 2;
			this.set("x", nX);
		}

		if (sVertical !== false) {
			nY = (sVertical === "bottom") ? nHeight - this._htOption.height : nHeight / 2 - this._htOption.height / 2;
			this.set("y", nY);
		}
	},
	
	/**
	 * 객체의 위치를 우측 기준으로 좌표만큼 이동한다
	 * 만일 Layer에 붙은 상태가 아니라면 붙은 후에 이동할 수 있도록 해 준다
	 * 
	 * @param {Number} nPosition 우측 기준 x좌표
	 * @return {collie.DisplayObject} 자기 자신을 반환
	 */
	right : function (nPosition) {
		var nWidth = 0;
		
		// 기준 크기 구함
		if (this._oParent) {
			nWidth = this._oParent._htOption.width;
		}
		
		if (!nWidth && this._oLayer) {
			nWidth = this._oLayer._htOption.width;
		}
		
		// 크기가 구해졌을 때만 정렬
		if (nWidth) {
			this.set("x", nWidth - (this._htOption.width + nPosition));
		} else {
			this._nPositionRight = nPosition;
		}
		
		return this;
	},
	
	/**
	 * 객체의 위치를 하단 기준으로 좌표만큼 이동한다
	 * 만일 Layer에 붙은 상태가 아니라면 붙은 후에 이동할 수 있도록 해 준다
	 * 
	 * @param {Number} nPosition 하단 기준 x좌표
	 * @return {collie.DisplayObject} 자기 자신을 반환
	 */
	bottom : function (nPosition) {
		var nHeight = 0;
		
		// 기준 크기 구함
		if (this._oParent) {
			nHeight = this._oParent.get("height");
		}
		
		if (!nHeight && this._oLayer) {
			nHeight = this._oLayer.option("height");
		}
		
		// 크기가 구해졌을 때만 정렬
		if (nHeight) {
			this.set("y", nHeight - (this._htOption.height + nPosition));
		} else {
			this._nPositionBottom = nPosition;
		}
		
		return this;
	},
	
	/**
	 * 지정한 비율에 맞게 크기를 변경 한다. 리샘플링과는 다르다
	 * 인자 둘 중 하나를 설정하면 설정한 부분의 비율에 맞춰서 크기를 변경 한다
	 * 
	 * @param {Number} [nWidth] 너비
	 * @param {Number} [nHeight] 높이
	 */
	resizeFixedRatio : function (nWidth, nHeight) {
		if (this.getImage()) {
			var nImageWidth = this.getImage().width;
			var nImageHeight = this.getImage().height;
			
			if (nWidth) {
				nHeight = nWidth * (nImageHeight / nImageWidth);
			} else if (nHeight) {
				nWidth = nHeight * (nImageWidth / nImageHeight);
			}
			
			this.set("width", Math.round(nWidth));
			this.set("height", Math.round(nHeight));
		}
	},
	
	/**
	 * Sprite 위치를 설정
	 * offsetX, offsetY로 값을 설정할 경우에 spriteX, spriteY는 정상적으로 동기화되지 못하는 문제가 있음 역추적 불가능
	 * @private
	 * @param {String} sKey 속성 이름
	 * @param {Number} nValue 값
	 */
	_setSpritePosition : function (sKey, nValue) {
		if (this._elImage && nValue !== null) {
			// spriteSheet 사용 시
			if (this._htOption.spriteSheet !== null) {
				var sheet = this._htSpriteSheet[this._htOption.spriteSheet];
				var nOffsetX; 
				var nOffsetY;
				
				if (sKey === "spriteSheet" && this._htSpriteSheet && this._htSpriteSheet[nValue]) {
					if (typeof sheet[0][0] !== "undefined") {
						if (this._htOption.spriteX !== null) { // 이미 spriteX가 있다면
							nOffsetX = sheet[this._htOption.spriteX][0];
							nOffsetY = sheet[this._htOption.spriteX][1];
						} else {
							nOffsetX = sheet[0][0];
							nOffsetY = sheet[0][1];
						}
					} else {
						nOffsetX = sheet[0];
						nOffsetY = sheet[1];
					}
					
					// 초기 위치 잡아줌
					this.set("offsetX", nOffsetX, true);
					this.set("offsetY", nOffsetY, true);
				} else if (sKey === "spriteX" && typeof sheet[nValue] !== "undefined") {
					this.set("offsetX", sheet[nValue][0], true);
					this.set("offsetY", sheet[nValue][1], true);
				}
			} else {
				var htImageSize = this.getImageSize();
				var nWidth = this._htOption.width;
				var nHeight = this._htOption.height;
				var nSpriteLength = this._htOption.spriteLength - 1; // 0부터 시작
				var nMaxSpriteX = (htImageSize.width / this._htOption.width) - 1;
				var nMaxSpriteY = (htImageSize.height / this._htOption.height) - 1;
				var nMaxOffsetX = htImageSize.width - 1;
				var nMaxOffsetY = htImageSize.height - 1;
				
				// spriteLength가 적용되어 있는 경우 최대 offset이 변경 됨
				if (nSpriteLength >= 0 && nHeight < htImageSize.height) {
					nMaxOffsetX = nMaxSpriteX * htImageSize.width;
					nMaxOffsetY = nMaxSpriteY * htImageSize.height;
				}
				
				switch (sKey) {
					case "spriteX" :
						var nOffsetX = 0;
						var nOffsetY = 0;
						
						// sprite길이를 지정했고 그게 최대 스프라이트 수보다 크다면 그것을 따라감
						if (nSpriteLength > nMaxSpriteX && nHeight < htImageSize.height) {
							nOffsetY = Math.floor(nValue / (nMaxSpriteX + 1)) * nHeight;
							nOffsetX = (nValue % (nMaxSpriteX + 1)) * nWidth;
						} else {
							nOffsetX = Math.min(nValue, nMaxSpriteX) * nWidth;
						}
						
						//TODO android 성능 문제, DisplayObject#set, timer, Animation#triggerCallback, spriteX 처리
						this.set("offsetX", nOffsetX, true);
						this.set("offsetY", nOffsetY, true);
						break;
						
					case "spriteY" :
						nValue = Math.min(nValue, nMaxSpriteY);
						this.set("offsetY", nValue * nHeight, true);
						break;
				}
			}
		}
	},
	
	/**
	 * attach된 이벤트 핸들러가 있는지 여부를 반환
	 *
	 * @return {Boolean}
	 */
	hasAttachedHandler : function () {
		if (
			this._htHandler && 
			(("click" in this._htHandler) && this._htHandler.click.length > 0) ||  
			(("mousedown" in this._htHandler) && this._htHandler.mousedown.length > 0) ||  
			(("mouseup" in this._htHandler) && this._htHandler.mouseup.length > 0)  
			) {
			return true;
		} else {
			return false;
		}
	},
	
	/**
	 * 특정 속도로 해당 지점까지 이동
	 * 
	 * @param {Number} nX 가고자 하는 곳의 x 좌표
	 * @param {Number} nY 가고자 하는 곳의 y 좌표
	 * @param {Number} nVelocity 초당 이동 거리(px), 속도가 0 이면 바로 이동한다.
	 * @param {Function} fCallback 이동이 끝난 후 실행될 콜백
	 * @param {collie.DisplayObject} fCallback.displayobject 현재 객체가 인자로 넘어감=
	 * @return {collie.AnimationTransition} 이동에 사용되는 타이머를 반환
	 */
	move : function (nX, nY, nVelocity, fCallback) {
		var nCurrentX = this._htOption.x;
		var nCurrentY = this._htOption.y;
		var nDistance = collie.util.getDistance(nCurrentX, nCurrentY, nX, nY);
		var nDuration = Math.round((nDistance / nVelocity) * 1000);
		
		if (this._oTimerMove !== null) {
			this._oTimerMove.stop();
			this._oTimerMove = null;
		}
		
		// duration이 없을 정도로 짧거나 속도가 0일 경우 Timer를 이용하지 않고 바로 이동
		if (!nVelocity || nDuration < collie.Renderer.getInfo().fps) {
			this.set({
				x : nX,
				y : nY
			});
			
			
			if (fCallback) {
				fCallback(this);
			}
		} else {
			var htOption = {
				from : [nCurrentX, nCurrentY],
				to : [nX, nY],
				set : ["x", "y"]
			};
			
			if (fCallback) {
				htOption.onComplete = function () {
					fCallback(this);
				};
			}
			
			this._oTimerMove = collie.Timer.transition(this, nDuration, htOption);
			return this._oTimerMove;
		}
	},
	
	/**
	 * 상대 경로로 이동
	 * 
	 * @param {Number} nX 가고자 하는 곳의 x 좌표
	 * @param {Number} nY 가고자 하는 곳의 y 좌표
	 * @param {Number} nVelocity 초당 이동 거리(px), 속도가 0 이면 바로 이동한다.
	 * @param {Function} fCallback 이동이 끝난 후 실행될 콜백
	 * @return {collie.AnimationTransition} 이동에 사용되는 타이머를 반환
	 */
	moveBy : function (nX, nY, nVelocity, fCallback) {
		var nCurrentX = this._htOption.x;
		var nCurrentY = this._htOption.y;
		return this.move(nCurrentX + nX, nCurrentY + nY, nVelocity, fCallback);
	},
	
	/**
	 * 문자열로 클래스 정보 반환
	 * 
	 * @return {String}
	 */
	toString : function () {
		return "DisplayObject" + (this._htOption.name ? " " + this._htOption.name : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
	},
	
	/**
	 * 객체 복사
	 * 이벤트는 복사되지 않는다.
	 * @param {Boolean} bRecursive 자식까지 모두 복사하는지 여부
	 * @return {collie.DisplayObject}
	 * @example
	 * var box = new collie.DisplayObject({
	 * 	width: 100,
	 * 	height: 100,
	 * 	backgroundColor: "blue"
	 * }).addTo(layer);
	 * 
	 * var box2 = box.clone().addTo(layer);
	 */
	clone : function (bRecursive) {
		var oDisplayObject = new this.constructor(this._htOption);
		
		if (bRecursive && this._aDisplayObjects.length) {
			for (var i = 0, l = this._aDisplayObjects.length; i < l; i++) {
				this._aDisplayObjects[i].clone(true).addTo(oDisplayObject);
			}
		}
		
		return oDisplayObject;
	}
}, collie.Component);

/**
 * 표시 객체 아이디를 할당한다. 1씩 늘어남
 * 
 * @static
 * @private
 */
collie.DisplayObject._idx = 0;

/**
 * 생성된 표시 객체를 담는다. Layer에 추가하지 않아도 표시 객체를 아이디로만 가져올 수 있다
 * 
 * @static
 * @private
 */
collie.DisplayObject.htFactory = {};
