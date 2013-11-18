/**
 * 이미지 리소스 관리
 * @example
 * // 한 개의 이미지를 로딩
 * collie.ImageManager.add("key", "sample.png");
 * new collie.DisplayObject({
 *  backgroundImage: "key"
 * });
 * @example
 * // 여러 이미지를 한 번에 로딩
 * collie.ImageManager.add({
 *  image1 : "image1.png",
 *  image2 : "image2.png"
 * }, function () {
 *  alert("complete");
 * });
 * @namespace
 */
collie.ImageManager = collie.ImageManager || new (collie.Class(/** @lends collie.ImageManager */{
    /**
     * 이미지 로딩 실패시 재시도 횟수
     * @type {Number}
     */
    RETRY_COUNT : 3,
    
    /**
     * 이미지 로딩 실패시 재시도 딜레이 ms
     * @type {Number}
     */
    RETRY_DELAY : 500,
    
    /**
     * DOM일 때 css3d 엘리먼트를 미리 만들어놓는지 여부
     * - 기능 불안정으로 기본 사용 false로 변경, top, left를 멀리 보내버리면 3d 렌더링에 부담이 될 수 있다.
     * @type {Boolean} 
     */
    USE_PRERENDERING_DOM : false,
    
    $init : function () {
        this._aImages = [];
        this._htImageNames = {};
        this._htImageRetryCount = {};
        this._htImageWhileLoading = {};
        this._nCount = 0;
        this._oSpriteSheet = new collie.SpriteSheet();
    },
    
    /**
     * 이미지를 추가
     * - 외부에서 직접 사용하면 count가 어긋나기 때문에 private 처리
     * 
     * @private
     * @param {String} sName 리소스 이름, 나중에 이 이름으로 리소스를 찾는다
     * @param {HTMLElement} elImage 저장할 엘리먼트
     */
    _addImage : function (elImage, sName) {
        var nLength = this._aImages.push({
            element : elImage,
            name : sName
        });
        
        var aCallback = this._htImageNames[sName];
        this._htImageNames[sName] = nLength - 1;
        delete this._htImageRetryCount[sName];
        
        // callback 실행
        if (aCallback && aCallback instanceof Array) {
            for (var i = 0, len = aCallback.length; i < len; i++) {
                aCallback[i](elImage, sName);
            }
            
            aCallback = null;
        }
        
        /**
         * 한개의 이미지가 로딩되었을 때 발생
         * @name collie.ImageManager#process
         * @event
         * @param {Object} oEvent
         * @param {String} oEvent.name 이미지 이름
         * @param {String} oEvent.url 이미지 URL
         * @param {Number} oEvent.count 현재 로딩된 갯수
         * @param {Number} oEvent.total 전체 이미지 갯수
         * @param {Number} oEvent.ratio 로딩된 이미지의 비율 (0~1)
         */
        this.fireEvent("process", {
            name : sName,
            url : elImage.src,
            count : nLength,
            total : this._nCount,
            ratio : Math.round((nLength / this._nCount) * 1000) / 1000
        });
        
        if (this._nCount === nLength) {
            /**
             * 등록된 이미지가 모두 로드 되었을 경우
             * @name collie.ImageManager#complete
             * @event
             * @param {Object} oEvent
             */
            this.fireEvent("complete");
        }
    },
    
    /**
     * 자리를 찜, 이미 자리가 있는 경우에는 아무것도 하지 않는다
     * 
     * @private
     * @param {String} sName 이미지 이름
     */
    _markImage : function (sName) {
        if (!this._htImageNames[sName]) {
            this._htImageNames[sName] = [];
        }
        
        if (!this._htImageRetryCount[sName]) {
            this._htImageRetryCount[sName] = 0;
        } 
    },
    
    /**
     * 해쉬를 다시 만듦
     * @private
     */
    _makeHash : function () {
        this._htImageNames = {};
        
        for (var i = 0, len = this._aImages.length; i < len; i++) {
            this._htImageNames[this._aImages[i].name] = i;
        }
    },
    
    /**
     * 이미지를 가져온다
     * 
     * @static
     * @param {String} sName 리소스 이름
     * @param {Function} fCallback 리소스가 로드되지 않았을 수도 있으므로 콜백으로 처리
     * @return {HTMLElement}
     */
    getImage : function (sName, fCallback) {
        if (!sName && sName !== 0) {
            return false;
        }
        
        // 마크되지 않은 이름이라면 마크함
        if (!(sName in this._htImageNames)) {
            this._markImage(sName);
        }
        
        // 마크가 된 상황이고 아직 로딩되지 않았다면
        if (this._htImageNames[sName] instanceof Array) {
            return (fCallback && this._addMarkCallback(sName, fCallback));
        } else {
            if (fCallback) {
                fCallback(this._aImages[this._htImageNames[sName]].element);
            } else {
                return this._aImages[this._htImageNames[sName]].element;
            }
        }
    },
    
    /**
     * 마크된 영역에 콜백을 등록, 로딩이 완료되면 콜백이 실행된다
     * @private
     * @param {String} sName
     * @param {Function} fCallback
     * @param {Function} fFail
     * @return {Boolean} callback이 등록될 경우 true를 반환
     */
    _addMarkCallback : function (sName, fCallback, fFail) {
        if ((sName in this._htImageNames) && this._htImageNames[sName] instanceof Array) {
            if (fFail) {
                var fError = function fError(oEvent) {
                    if (oEvent.name === sName) {
                        fFail();
                        this.detach("error", fError);
                    }
                };
                
                this.attach("error", fError);
            }
            
            if (fCallback) {
                this._htImageNames[sName].push(fCallback);
            }
            
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * 이미지를 삭제한다
     * @param {String} sName 리소스 이름
     */
    removeImage : function (sName) {
        if (!(sName in this._htImageNames)) {
            return false;
        }
        
        var elImage = this._aImages.splice(this._htImageNames[sName], 1);
        this._makeHash();
        elImage.onload = null;
        elImage.onerror = null;
        elImage.src = null;
        elImage = null;
        this._oSpriteSheet.remove(sName);
    },
    
    /**
     * 이미지를 삭제한다
     * @see collie.ImageManager.removeImage
     */
    remove : function (sName) {
        this.removeImage(sName);
    },
    
    /**
     * 이미지 리소스를 추가한다
     * 
     * @example
     * // 1개의 이미지를 추가
     * collie.ImageManager.add("key", "sample.png", function () {
     *  // callback
     * });
     * @example
     * // 여러 개의 이미지를 추가
     * collie.ImageManager.add({
     *  key : "sample.png",
     *  key2 : "sample2.png"
     * }, function () {
     *  // callback
     * });
     * 
     * @see collie.ImageManager.addImage
     * @see collie.ImageManager.addImages
     */
    add : function () {
        if (typeof arguments[0] === "object") {
            this.addImages.apply(this, arguments);
        } else {
            this.addImage.apply(this, arguments);
        }
    },
    
    /**
     * 여러 개의 이미지 리소스를 한번에 추가 한다.
     * 
     * @param {Object} htList { sName : sURL , sName2 : sURL2 }
     * @param {Function} fCallback 선택한 파일이 모두 로드될 때 실행될 함수. 없으면 실행되지 않는다. 인자로 htList를 반환
     * @param {Function} fFail 선택한 파일 중에 한개라도 로드되지 않았을 때 실행될 함수. 실패한 이미지의 [el, sName, sURL] 배열 목록을 인자로 갖는다
     */
    addImages : function (htList, fCallback, fFail) {
        var fOnComplete = null;
        var fOnFail = null;
        var nTotalCount = 0;
        var nCurrentCount = 0;
        var aFailedImages = [];
        
        // 돌면서 갯수 먼저 파악
        for (var i in htList) {
            nTotalCount++;
        }
        
        // 콜백
        if (fCallback && fCallback !== null) {
            fOnComplete = (function () {
                nCurrentCount++;
                
                if (nCurrentCount >= nTotalCount) {
                    fCallback(htList);  
                }
            }).bind(this);
        }
        
        // 실패했을 경우
        if (fFail && fFail !== null) {
            fOnFail = (function (el, sName, sURL) {
                aFailedImages.push([el, sName, sURL]);
                
                if (aFailedImages.length + nCurrentCount >= nTotalCount) {
                    fFail(aFailedImages);
                }
            }).bind(this);
        }
        
        // 로드
        for (var i in htList) {
            this.addImage(i, htList[i], fOnComplete, fOnFail);
        }
    },
    
    /**
     * 비동기로 이미지를 로딩
     * 
     * @param {String} sName 이미지 이름, 이름이 없을 경우 Loader에 저장하지 않는다
     * @param {String} sURL 이미지 주소
     * @param {Function} fCallback 성공시 실행될 함수
     * @param {HTMLElement} fCallback.elImage 엘리먼트
     * @param {String} fCallback.sName 리소스 이름
     * @param {String} fCallback.sURL URL
     * @param {Function} fFail 실패시 실행될 함수
     */
    addImage : function (sName, sURL, fCallback, fFail) {
        // 이미 이미지가 있으면 바로 콜백 실행
        if (this.getImage(sName)) {
            if (fCallback && fCallback !== null) {
                fCallback(this.getImage(sName), sName, sURL);
            }
            return;
        }
        
        // 이미 로딩 중이고 마크가 된 상황이라면 콜백 등록하고 멈춤
        if ((sName in this._htImageWhileLoading) && this._addMarkCallback(sName, fCallback, fFail)) {
            return;
        }
        
        this._nCount++;
        this._markImage(sName);
        var el = new Image();
        
        // DOM모드면 미리 OpenGL 레이어로 변환해 놓는다
        if (this.USE_PRERENDERING_DOM && collie.Renderer.getRenderingMode() === "dom" && collie.util.getSupportCSS3d() && !collie.util.getDeviceInfo().android) {
            el.style.webkitTransform = "translateZ(0)";
            el.style.position = "absolute";
            el.style.visibility = "hidden";
            collie.Renderer.getElement().appendChild(el);
        }
        
        this._htImageWhileLoading[sName] = el;
        
        el.onload = (function (e) {
            this._addImage(el, sName);
            
            if (fCallback && fCallback !== null) {
                fCallback(el, sName, sURL);
            }
            
            el.onerror = el.onload = null;
            this._deleteWhileLoading(sName);
        }).bind(this);
        
        el.onerror = (function (e) {
            // 재시도
            if (this._htImageRetryCount[sName] < this.RETRY_COUNT) {
                this._htImageRetryCount[sName]++;
                
                /**
                 * 한 개의 이미지가 로딩 실패 했을 때 실행
                 * @name collie.ImageManager#retry
                 * @event
                 * @param {Object} oEvent
                 * @param {String} oEvent.name 실패된 이미지 이름
                 * @param {String} oEvent.url 실패된 이미지 URL
                 * @param {Number} oEvent.count 현재 로딩된 갯수
                 * @param {Number} oEvent.total 전체 이미지 갯수
                 */
                this.fireEvent("retry", {
                    count : this._aImages.length,
                    total : this._nCount,
                    name : sName,
                    url : sURL,
                    delay : this.RETRY_DELAY,
                    retryCount : this._htImageRetryCount[sName]
                });
                
                setTimeout(function () {
                    // workaround http://code.google.com/p/chromium/issues/detail?id=7731
                    el.src = "about:blank";
                    el.src = sURL;
                }, this.RETRY_DELAY);
                return;
            }
            
            if (fFail && fFail !== null) {
                fFail(el, sName, sURL);
            }
            
            /**
             * 한 개의 이미지가 로딩 실패 했을 때 실행
             * @name collie.ImageManager#error
             * @event
             * @param {Object} oEvent
             * @param {String} oEvent.name 실패된 이미지 이름
             * @param {String} oEvent.url 실패된 이미지 URL
             * @param {Number} oEvent.count 현재 로딩된 갯수
             * @param {Number} oEvent.total 전체 이미지 갯수
             */
            this.fireEvent("error", {
                count : this._aImages.length,
                total : this._nCount,
                name : sName,
                url : sURL
            });
            
            el.onerror = el.onload = null;
            this._deleteWhileLoading(sName);
        }).bind(this);
        
        // Webkit 버그로 인해서 CORS 주석 처리
        // el.crossOrigin = "";
        el.src = sURL;
    },
    
    /**
     * 로딩 중에 임시로 담아놓는 변수를 제거
     * @private
     * @param {String} sName
     */
    _deleteWhileLoading : function (sName) {
        delete this._htImageWhileLoading[sName];
    },
    
    /**
     * 로드되고 있는 파일을 모두 멈춤
     */
    abort : function () {
        for (var i in this._htImageWhileLoading) {
            this._htImageWhileLoading[i].onload = this._htImageWhileLoading[i].onerror = null; 
            this._htImageWhileLoading[i].src = null;
            this._htImageWhileLoading[i] = null;
        }
        
        this._htImageWhileLoading = {};
        this._htImageStartedLoading = {};
    },
    
    /**
     * 등록된 파일을 모두 제거
     */
    reset : function () {
        this.abort();
        this._aImages = [];
        this._htImageNames = {};
        this._htImageRetryCount = {};
        this._htImageWhileLoading = {};
        this._nCount = 0;
        this._oSpriteSheet.reset();
    },
    
    /**
     * 비동기로 등록된 이미지 콜백을 취소 한다
     * DisplayObject에서 setImage처리할 때 자동으로 호출 된다
     * @private
     * @arguments collie.ImageManager.getImage
     */
    cancelGetImage : function (sName, fCallback) {
        if (this._htImageNames[sName] instanceof Array) {
            for (var i = 0, len = this._htImageNames[sName].length; i < len; i++) {
                if (this._htImageNames[sName][i] === fCallback) {
                    this._htImageNames[sName].splice(i, 1);
                    return;
                }
            }
        }
    },
    
    /**
     * 이미지에 스프라이트 시트 정보를 추가한다
     * 
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     * @param {String|Object} vSpriteName 객체로 한 번에 여러 개의 정보를 등록할 수 있음
     * @example
     * collie.ImageManager.add({
     *  "sample" : "sample.png"
     * });
     * 
     * // Add Sprites with key-value object
     * collie.ImageManager.addSprite("sample", {
     *  normal : [0, 0], // [offsetX, offsetY]
     *  action : [30, 0],
     *  jump : [60, 0, 30, 30, 8] // [startOffsetX, startOffsetY, a width per one frame, a height per one frame, spriteLength] 
     * });
     * 
     * // or Add Sprites with array
     * collie.ImageManager.addSprite("sample", [
     *  [0, 0], // key 0
     *  [30, 0], // key 1
     *  [60, 0, 30, 30, 8] // key 2 and [startOffsetX, startOffsetY, a width per one frame, a height per one frame, spriteLength]
     * ]);
     * 
     * var item = new collie.DisplayObject({
     *  spriteSheet : "normal", // or 0
     *  backgroundImage : "sample"
     * });
     * 
     * // with Timer
     * collie.Timer.cycle(item, 1000, {
     *  from: 0, 
     *  to: 1,
     *  set: "spriteSheet"
     * });
     * 
     * // If you use five parameters in the addSprite method, you can use spriteX option with spriteSheet 
     * item.set("spriteSheet", "jump");
     * collie.Timer.cycle(item, 1000, {
     *  from: 0,
     *  to: 7 // spriteLength 8
     * });
     */
    addSprite : function (sImageName, vSpriteName, nOffsetX, nOffsetY) {
        this._oSpriteSheet.add(sImageName, vSpriteName, nOffsetX, nOffsetY);
    },
    
    /**
     * 스프라이트 시트 정보를 반환한다
     * 
     * @private
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     * @return {Object} 
     */
    getSprite : function (sImageName) {
        return this._oSpriteSheet.get(sImageName);
    },
    
    /**
     * 스프라이트 정보를 제거한다
     * 
     * @param {String} sImageName collie.ImageManager에 등록된 이미지 이름
     */
    removeSprite : function (sImageName) {
        this._oSpriteSheet.remove(sImageName);
    }
    
    /**
     * 이미지를 사용 가능한 상태로 미리 만들어 놓는다. mark된 이미지는 DisplayObject에서 사용할 수 있다
     *
     * @name collie.ImageManager.mark 
     * @param {Object|String} vName 점찍을 이미지 이름, load에서 쓰이는 sName을 뜻하며 addImages의 HashTable 형태로 넣을 경우 키 값이 이름으로 들어가게 된다
     * @deprecated 정의되지 않은 이름을 부를 때 자동으로 mark되도록 수정
     */
    /**
     * @name collie.ImageManager.load 
     * @deprecated add로 변경
     */
}, collie.Component))();