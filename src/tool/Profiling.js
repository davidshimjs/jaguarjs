(function () {
    var _htPerf = {};
    var _aSortedPerf = [];

    var _initPerf = function (sName) {
        if (!_htPerf[sName]) {
            _htPerf[sName] = {
                name : sName,
                startTime : null,
                totalTime : 0,
                averageTime : 0,
                count : 0
            };
        }
    };
    
    var _startPerf = function (sName) {
        _initPerf(sName);
        
        if (_htPerf[sName].startTime === null) {
            _htPerf[sName].startTime = (+new Date());
        }
    };
    
    var _endPerf = function (sName) {
        if (_htPerf[sName].startTime !== null) {
            _htPerf[sName].totalTime += (+new Date()) - _htPerf[sName].startTime;
            _htPerf[sName].count++;
            _htPerf[sName].averageTime = _htPerf[sName].totalTime / _htPerf[sName].count;
            _htPerf[sName].startTime = null;
        }
    };
    
    var _sortPerf = function () {
        for (var i in _htPerf) {
            _aSortedPerf.push(_htPerf[i]);
        }

        // 내림차순 정렬      
        _aSortedPerf.sort(function (a, b) {
            return b.totalTime - a.totalTime;
            // return b.averageTime - a.averageTime;
        });
    };
    
    /**
     * 콜리에 쓰이는 기능들에 대한 성능을 측정해서 결과를 보여준다.
     * 단독으로 쓰이지 않고 보통 useConsole과 같이 쓰인다
     * @example
     * var oConsole = new collie.FPSConsole({
     *  useProfiling: true
     * });
     * 
     * collie.Profiling.setConsole(oConsole);
     * collie.Profiling.load(300);
     * collie.Renderer.start();
     * @requires collie.tool.js 
     * @namespace
     */
    collie.Profiling = {
        /**
         * FPSConsole을 설정한다.
         * @param {collie.FPSConsole} oConsole
         */
        setConsole : function (oConsole) {
            this._oConsole = oConsole;
            this._oConsole.option("useConsole", false);
            this._oConsole.option("visible", false);
        },
        
        /**
         * @param {Number} nLimit 해당 프레임까지만 재생한 후에 결과를 표시한다
         */
        load : function (nLimit) {
            if (nLimit) {
                collie.Renderer.attach("process", function (e) {
                    if (e.frame > nLimit) {
                        collie.Profiling.getResults();
                    }
                });
            }
            
            for (var i in collie) {
                if (typeof collie[i] === 'object') {
                    for (var j in collie[i]) {
                        if (!j.toString().match(/^\$super/) && j !== "constructor" && j !== "prototype" && typeof collie[i][j] === "function") {
                            (function (i, j) {
                                var sName = i + "_" + j;
                                var beforeFunction = collie[i][j];
                                
                                collie[i][j] = function () {
                                    _startPerf(sName);
                                    var ret = beforeFunction.apply(this, arguments);
                                    _endPerf(sName);
                                    return ret;
                                };
                            })(i, j);
                        }
                    }
                }
                
                if (typeof collie[i] !== "object") {
                    for (var j in collie[i].prototype) {
                        if (!j.toString().match(/^\$super/) && j !== "constructor" && j !== "prototype" && j !== "$init" && typeof collie[i].prototype[j] === "function") {
                            (function (i, j) {
                                var sName = i + "_" + j;
                                var beforeFunction = collie[i].prototype[j];
                                
                                collie[i].prototype[j] = function () {
                                    _startPerf(sName);
                                    var ret = beforeFunction.apply(this, arguments);
                                    _endPerf(sName);
                                    return ret;
                                };
                            })(i, j);
                        }
                    }
                }
            }
        },
        
        /**
         * 결과를 출력
         */
        getResults : function () {
            collie.Renderer.stop();
            _sortPerf();
            this._showPage();
        },
        
        /**
         * @private
         */
        _showPage : function () {
            var sAgent = navigator.userAgent;
            var nRatio = window.devicePixelRatio;
            var htSize = {
                width : document.body.clientWidth,
                height : document.body.clientHeight
            };
            var elContainer = document.createElement("div");
            elContainer.style.cssText = "position:absolute;top:0;left:0;width:" + htSize.width + "px;height:100%;background-color:#fff;padding:10px;line-height:1.5;font:1em Helvetica;";
            var elTitle = document.createElement("div");
            elTitle.style.cssText = "margin-bottom:15px;border-bottom:1px solid #aaa;padding-bottom:15px;";
            elTitle.innerHTML = '<h1 style="margin-bottom:10px;">Collie Profiling</h1><div style="font-size:0.75em;color:gray;">ratio : ' + nRatio + ', agent : ' + sAgent + '</div>';
            elContainer.appendChild(elTitle);
            
            // 콘솔 정보 삽입     
            if (this._oConsole) {
                this._oConsole.getElement().style.display = 'none';
                var elConsoleList = document.createElement("ul");
                elConsoleList.style.marginBottom = "15px";
                var htConsole = this._oConsole._getValue();
                
                for (var j in htConsole) {
                    elConsoleList.innerHTML += '<li style="list-style-type:none;padding:3px;margin-bottom:3px;font-size:0.8em;"><strong>' + j + '</strong> <span style="color:gray;">' + this._oConsole._getValue(j) + '</span></li>';
                }
                
                elContainer.appendChild(elConsoleList);
            }
            
            // // 프로파일링 정보 삽입
            var elList = document.createElement("ul");
            
            for (var i = 0, nLen = Math.min(_aSortedPerf.length, 100); i < nLen; i++) {
                var sName = _aSortedPerf[i].name.replace(/_/, '.');
                var sValue = (Math.round(_aSortedPerf[i].averageTime * 100) / 100) + "ms / " + _aSortedPerf[i].totalTime + "ms (" + _aSortedPerf[i].count + ")";
                elList.innerHTML += '<li style="list-style-type:none;padding:3px;margin-bottom:3px;border-bottom:1px solid #aaa;font-size:0.75em;"><strong>' + sName + '</strong> <span style="color:gray;">' + sValue + '</span></li>';
            }
            
            elContainer.appendChild(elList);
            document.body.appendChild(elContainer);
        }
    };
})();