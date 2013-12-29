/**
 * 별도의 이벤트를 다룰 수 있고 옵션 값을 갖는 컴포넌트 클래스
 * @class
 */
collie.Component = collie.Class(/** @lends collie.Component.prototype */{
    $init : function () {
        this._bInitOption = false;
        this._htOption = {};
        this._htOptionSetter = {};
        this._htHandler = {};
    },
    
    /**
     * 컴포넌트의 옵션을 설정한다.
     * @example
     * component.option({
     *  a : 1,
     *  b : true
     * });
     * 
     * component.option("a", 1);
     * component.option("a"); // return 1
     * @param {Object|String} vName 옵션 이름이나 여러 옵션을 설정할 수 있는 객체를 넣을 수 있다.
     * @param {Variables} [vValue] 옵션 값, 값이 없다면 해당 옵션 값을 반환한다.
     * @param {Boolean} [bNotOverwrite] 이 값이 true면 기존에 값이 있을 경우 덮이 씌우지 않는다
     */
    option : function (vName, vValue, bNotOverwrite) {
        if (typeof vName === "object") {
            // 초기에 넣을 때는 기본 값으로 설정
            if (!this._bInitOption) {
                this._htOption = collie.util.cloneObject(vName);
                this._bInitOption = true;
            } else {
                for (var i in vName) {
                    this.option(i, vName[i], bNotOverwrite);
                }
            }
        } else if (typeof vName === "string") {
            // setter
            if (vValue !== undefined) {
                if (!bNotOverwrite || typeof this._htOption[vName] === "undefined") {
                    this._htOption[vName] = vValue;
                    
                    if (this._htOptionSetter[vName] !== undefined) {
                        this._htOptionSetter[vName](vValue);
                    }
                    
                    this._bInitOption = true;
                }
            } else { // getter
                return this._htOption[vName];
            }
        } else {
            return this._htOption;
        }
    },
    
    /**
     * DisplayObject와 Layer의 서로 다른 인터페이스를 맞추기 위한 임시 메서드
     * 
     * @see collie.Component#option
     * @param {String} sName
     * @return {Variables}
     */
    get : function (sName) {
        return this.option(sName);
    },
    
    /**
     * DisplayObject와 Layer의 서로 다른 인터페이스를 맞추기 위한 임시 메서드
     * 
     * @see collie.Component#option
     * @param {String} sName
     * @param {Variables} vValue
     * @param {Boolean} [bNotOverwrite]
     * @return {Object} For method chaining
     */
    set : function (sName, vValue, bNotOverwrite) {
        this.option(sName, vValue, bNotOverwrite);
        return this;
    },
    
    /**
     * 옵션을 제거한다
     * 
     * @param {String} sKey
     */
    unset : function (sKey) {
        if (this._htOption && typeof this._htOption[sKey] !== "undefined") {
            delete this._htOption[sKey];
        }
    },
    
    /**
     * 옵션 값이 설정될 때 실행될 함수를 지정한다. Setter는 한 속성 당 한 개의 함수만 설정할 수 있다.
     * 
     * @param {String} sName
     * @param {Function} fSetter
     */
    optionSetter : function (sName, fSetter) {
        this._htOptionSetter[sName] = fSetter;
    },
    
    /**
     * 이벤트 발생
     * 
     * @param {String} sName
     * @param {Object} oEvent
     * @return {Boolean} 이벤트 발생 중 collie.ComponentEvent의 stop 메소드가 실행될 경우 false를 반환한다
     */
    fireEvent : function (sName, oEvent) {
        if (typeof this._htHandler[sName] !== "undefined" && this._htHandler[sName].length > 0) {
            oEvent = oEvent || {};
            oCustomEvent = new collie.ComponentEvent(sName, oEvent);
            var aHandler = this._htHandler[sName].concat();
            var bCanceled = false;
            
            for (var i = 0, len = aHandler.length; i < len; i++) {
                this._htHandler[sName][i](oCustomEvent);
                
                // stop했으면 false를 반환
                if (oCustomEvent.isStop()) {
                    bCanceled = true;
                }
            }
            
            if (bCanceled) {
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * 이벤트 핸들러 추가
     * 
     * @param {Object|String} vEvent
     * @param {Function} fHandler
     * @return {collie.Component} 메소드 체이닝 지원
     */
    attach : function (vEvent, fHandler) {
        if (typeof vEvent !== "string") {
            for (var i in vEvent) {
                this.attach(i, vEvent[i]);
            }
        } else {
            this._htHandler[vEvent] = this._htHandler[vEvent] || [];
            var aHandler = this._htHandler[vEvent];
            
            // 핸들러가 있을 때만 등록
            if (!fHandler) {
                return this;
            }
            
            // 중복된 핸들러는 등록하지 않음
            for (var i = 0, len = aHandler.length; i < len; i++) {
                if (aHandler[i] === fHandler) {
                    return this;
                }
            }
            
            // 핸들러 등록
            aHandler.push(fHandler);
        }
        
        return this;
    },
    
    /**
     * 이벤트 핸들러를 해제한다
     * 
     * @param {Object|String} vEvent
     * @param {Function} fHandler 값이 없을 경우 이 이벤트에 할당된 전체 핸들러를 해제한다
     */
    detach : function (vEvent, fHandler) {
        if (typeof vEvent !== "string") {
            for (var i in vEvent) {
                this.detach(i, vEvent[i]);
            }
        } else if (this._htHandler[vEvent] !== undefined) {
            var aHandler = this._htHandler[vEvent];
            
            // 두번째 인자가 없을 때 전체를 detach
            if (!fHandler) {
                delete this._htHandler[vEvent];
            } else {
                for (var i = 0, len = aHandler.length; i < len; i++) {
                    if (aHandler[i] === fHandler) {
                        this._htHandler[vEvent].splice(i, 1);
                        
                        // 배열이 다 없어졌다면 제거
                        if (this._htHandler[vEvent].length < 1) {
                            delete this._htHandler[vEvent];
                        }
                        break;
                    }
                }
            }
        }
    },
    
    /**
     * 모든 이벤트 핸들러를 해제
     * 
     * @param {String} sName 이벤트 이름, 값이 없으면 이 컴포넌트에 할당된 모든 이벤트를 해제한다
     */
    detachAll : function (sName) {
        if (sName) {
            if (this._htHandler[sName] !== undefined) {
                this._htHandler[sName] = [];
            }
        } else {
            this._htHandler = {};
        }
    }
});

/**
 * 컴포넌트 클래스의 이벤트가 발생될 때 생성되는 이벤트 클래스
 * @class
 * @private
 * @param {String} sName 이벤트 이름
 * @param {Object} oEvent
 */
collie.ComponentEvent = collie.Class(/** @lends collie.ComponentEvent.prototype */{
    /**
     * @constructs
     */
    $init : function (sName, oEvent) {
        this.type = sName;
        this._bCanceled = false;
        
        //TODO 향후에 이 구조를 바꾸는게 좋음
        if (oEvent) {
            for (var i in oEvent) {
                this[i] = oEvent[i];
            }
        }
    },
    
    /**
     * 이벤트를 멈추고 싶은 경우 실행
     */
    stop : function () {
        this._bCanceled = true;
    },
    
    /**
     * 이벤트가 멈췄는지 확인
     * 
     * @return {Boolean} 멈췄으면 true
     */
    isStop : function () {
        return this._bCanceled;
    }
});