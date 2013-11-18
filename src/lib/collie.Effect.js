/*
 * TERMS OF USE - EASING EQUATIONS
 * Open source under the BSD License.
 * Copyright (c) 2001 Robert Penner, all rights reserved.
 */
/**
 * 새로운 이펙트 함수를 생성한다.
 * 진도 프레임워크의 jindo.Effect를 사용
 * @namespace 수치의 중간값을 쉽게 얻을 수 있게 하는 static 컴포넌트
 * @function
 * @param {Function} fEffect 0~1 사이의 숫자를 인자로 받아 정해진 공식에 따라 0~1 사이의 값을 리턴하는 함수
 * @return {Function} 이펙트 함수. 이 함수는 시작값과 종료값을 입력하여 특정 시점에 해당하는 값을 구하는 타이밍 함수를 생성한다.
 */
collie.Effect = function(fEffect) {
    if (this instanceof arguments.callee) {
        throw new Error("You can't create a instance of this");
    }
    
    var rxNumber = /^(\-?[0-9\.]+)(%|px|pt|em)?$/,
        rxRGB = /^rgb\(([0-9]+)\s?,\s?([0-9]+)\s?,\s?([0-9]+)\)$/i,
        rxHex = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
        rx3to6 = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/i;
    
    var getUnitAndValue = function(v) {
        var nValue = v, sUnit;
        
        if (rxNumber.test(v)) {
            nValue = parseFloat(v); 
            sUnit = RegExp.$2 || "";
        } else if (rxRGB.test(v)) {
            nValue = [parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10), parseInt(RegExp.$3, 10)];
            sUnit = 'color';
        } else if (rxHex.test(v = v.replace(rx3to6, '#$1$1$2$2$3$3'))) {
            nValue = [parseInt(RegExp.$1, 16), parseInt(RegExp.$2, 16), parseInt(RegExp.$3, 16)];
            sUnit = 'color';
        } 
                
        return { 
            nValue : nValue, 
            sUnit : sUnit 
        };
    };
    
    return function(nStart, nEnd) {
        var sUnit;
        if (arguments.length > 1) {
            nStart = getUnitAndValue(nStart);
            nEnd = getUnitAndValue(nEnd);
            sUnit = nEnd.sUnit;
        } else {
            nEnd = getUnitAndValue(nStart);
            nStart = null;
            sUnit = nEnd.sUnit;
        } 
        
        // 두개의 단위가 다르면
        if (nStart && nEnd && nStart.sUnit != nEnd.sUnit) {
            throw new Error('unit error');
        }
        
        nStart = nStart && nStart.nValue;
        nEnd = nEnd && nEnd.nValue;
        
        var fReturn = function(p) {
            var nValue = fEffect(p),
                getResult = function(s, d) {
                    return (d - s) * nValue + s + sUnit; 
                };
            
            if (sUnit == 'color') {
                var r = Math.max(0, Math.min(255, parseInt(getResult(nStart[0], nEnd[0]), 10))) << 16;
                r |= Math.max(0, Math.min(255, parseInt(getResult(nStart[1], nEnd[1]), 10))) << 8;
                r |= Math.max(0, Math.min(255, parseInt(getResult(nStart[2], nEnd[2]), 10)));
                
                r = r.toString(16).toUpperCase();
                for (var i = 0; 6 - r.length; i++) {
                    r = '0' + r;
                }
                    
                return '#' + r;
            }
            return getResult(nStart, nEnd);
        };
        
        if (nStart === null) {
            fReturn.setStart = function(s) {
                s = getUnitAndValue(s);
                
                if (s.sUnit != sUnit) {
                    throw new Error('unit eror');
                }
                nStart = s.nValue;
            };
        }
        return fReturn;
    };
};

/**
 * linear 이펙트 함수
 */
collie.Effect.linear = collie.Effect(function(s) {
    return s;
});

/**
 * easeInSine 이펙트 함수
 */
collie.Effect.easeInSine = collie.Effect(function(s) {
    return (s == 1) ? 1 : -Math.cos(s * (Math.PI / 2)) + 1;
});
/**
 * easeOutSine 이펙트 함수
 */
collie.Effect.easeOutSine = collie.Effect(function(s) {
    return Math.sin(s * (Math.PI / 2));
});
/**
 * easeInOutSine 이펙트 함수
 */
collie.Effect.easeInOutSine = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInSine(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutSine(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInSine 이펙트 함수
 */
collie.Effect.easeOutInSine = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutSine(0, 1)(2 * s) * 0.5 : collie.Effect.easeInSine(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInQuad 이펙트 함수
 */
collie.Effect.easeInQuad = collie.Effect(function(s) {
    return s * s;
});
/**
 * easeOutQuad 이펙트 함수
 */
collie.Effect.easeOutQuad = collie.Effect(function(s) {
    return -(s * (s - 2));
});
/**
 * easeInOutQuad 이펙트 함수
 */
collie.Effect.easeInOutQuad = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInQuad(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutQuad(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInQuad 이펙트 함수
 */
collie.Effect.easeOutInQuad = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutQuad(0, 1)(2 * s) * 0.5 : collie.Effect.easeInQuad(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInCubic 이펙트 함수
 */
collie.Effect.easeInCubic = collie.Effect(function(s) {
    return Math.pow(s, 3);
});
/**
 * easeOutCubic 이펙트 함수
 */
collie.Effect.easeOutCubic = collie.Effect(function(s) {
    return Math.pow((s - 1), 3) + 1;
});
/**
 * easeInOutCubic 이펙트 함수
 */
collie.Effect.easeInOutCubic = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeIn(0, 1)(2 * s) * 0.5 : collie.Effect.easeOut(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInCubic 이펙트 함수
 */
collie.Effect.easeOutInCubic = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOut(0, 1)(2 * s) * 0.5 : collie.Effect.easeIn(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInQuart 이펙트 함수
 */
collie.Effect.easeInQuart = collie.Effect(function(s) {
    return Math.pow(s, 4);
});
/**
 * easeOutQuart 이펙트 함수
 */
collie.Effect.easeOutQuart = collie.Effect(function(s) {
    return -(Math.pow(s - 1, 4) - 1);
});
/**
 * easeInOutQuart 이펙트 함수
 */
collie.Effect.easeInOutQuart = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInQuart(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutQuart(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInQuart 이펙트 함수
 */
collie.Effect.easeOutInQuart = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutQuart(0, 1)(2 * s) * 0.5 : collie.Effect.easeInQuart(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInQuint 이펙트 함수
 */
collie.Effect.easeInQuint = collie.Effect(function(s) {
    return Math.pow(s, 5);
});
/**
 * easeOutQuint 이펙트 함수
 */
collie.Effect.easeOutQuint = collie.Effect(function(s) {
    return Math.pow(s - 1, 5) + 1;
});
/**
 * easeInOutQuint 이펙트 함수
 */
collie.Effect.easeInOutQuint = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInQuint(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutQuint(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInQuint 이펙트 함수
 */
collie.Effect.easeOutInQuint = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutQuint(0, 1)(2 * s) * 0.5 : collie.Effect.easeInQuint(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInCircle 이펙트 함수
 */
collie.Effect.easeInCircle = collie.Effect(function(s) {
    return -(Math.sqrt(1 - (s * s)) - 1);
});
/**
 * easeOutCircle 이펙트 함수
 */
collie.Effect.easeOutCircle = collie.Effect(function(s) {
    return Math.sqrt(1 - (s - 1) * (s - 1));
});
/**
 * easeInOutCircle 이펙트 함수
 */
collie.Effect.easeInOutCircle = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInCircle(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutCircle(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutInCircle 이펙트 함수
 */
collie.Effect.easeOutInCircle = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutCircle(0, 1)(2 * s) * 0.5 : collie.Effect.easeInCircle(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInBack 이펙트 함수
 */
collie.Effect.easeInBack = collie.Effect(function(s) {
    var n = 1.70158;
    return (s == 1) ? 1 : (s / 1) * (s / 1) * ((1 + n) * s - n);
});
/**
 * easeOutBack 이펙트 함수
 */
collie.Effect.easeOutBack = collie.Effect(function(s) {
    var n = 1.70158;
    return (s === 0) ? 0 : (s = s / 1 - 1) * s * ((n + 1) * s + n) + 1;
});
/**
 * easeInOutBack 이펙트 함수
 */
collie.Effect.easeInOutBack = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInBack(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutBack(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInElastic 이펙트 함수
 */
collie.Effect.easeInElastic = collie.Effect(function(s) {
    var p = 0, a = 0, n;
    if (s === 0) {
        return 0;
    }
    if ((s/=1) == 1) {
        return 1;
    }
    if (!p) {
        p = 0.3;
    }
    if (!a || a < 1) { 
        a = 1; n = p / 4; 
    } else {
        n = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    return -(a * Math.pow(2, 10 * (s -= 1)) * Math.sin((s - 1) * (2 * Math.PI) / p));
});

/**
 * easeOutElastic 이펙트 함수
 */
collie.Effect.easeOutElastic = collie.Effect(function(s) {
    var p = 0, a = 0, n;
    if (s === 0) {
        return 0;
    }
    if ((s/=1) == 1) {
        return 1;
    }
    if (!p) {
        p = 0.3;
    }
    if (!a || a < 1) { 
        a = 1; n = p / 4; 
    } else {
        n = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    return (a * Math.pow(2, -10 * s) * Math.sin((s - n) * (2 * Math.PI) / p ) + 1);
});
/**
 * easeInOutElastic 이펙트 함수
 */
collie.Effect.easeInOutElastic = collie.Effect(function(s) {
    var p = 0, a = 0, n;
    if (s === 0) {
        return 0;
    }
    if ((s/=1/2) == 2) {
        return 1;
    }
    if (!p) {
        p = (0.3 * 1.5);
    }
    if (!a || a < 1) { 
        a = 1; n = p / 4; 
    } else {
        n = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    if (s < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (s -= 1)) * Math.sin( (s - n) * (2 * Math.PI) / p ));
    }
    return a * Math.pow(2, -10 * (s -= 1)) * Math.sin( (s - n) * (2 * Math.PI) / p ) * 0.5 + 1;
});

/**
 * easeOutBounce 이펙트 함수
 */
collie.Effect.easeOutBounce = collie.Effect(function(s) {
    if (s < (1 / 2.75)) {
        return (7.5625 * s * s);
    } else if (s < (2 / 2.75)) {
        return (7.5625 * (s -= (1.5 / 2.75)) * s + 0.75);
    } else if (s < (2.5 / 2.75)) {
        return (7.5625 * (s -= (2.25 / 2.75)) * s + 0.9375);
    } else {
        return (7.5625 * (s -= (2.625 / 2.75)) * s + 0.984375);
    } 
});
/**
 * easeInBounce 이펙트 함수
 */
collie.Effect.easeInBounce = collie.Effect(function(s) {
    return 1 - collie.Effect.easeOutBounce(0, 1)(1 - s);
});
/**
 * easeInOutBounce 이펙트 함수
 */
collie.Effect.easeInOutBounce = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInBounce(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutBounce(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * easeInExpo 이펙트 함수
 */
collie.Effect.easeInExpo = collie.Effect(function(s) {
    return (s === 0) ? 0 : Math.pow(2, 10 * (s - 1));
});
/**
 * easeOutExpo 이펙트 함수
 */
collie.Effect.easeOutExpo = collie.Effect(function(s) {
    return (s == 1) ? 1 : -Math.pow(2, -10 * s / 1) + 1;
});
/**
 * easeInOutExpo 이펙트 함수
 */
collie.Effect.easeInOutExpo = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeInExpo(0, 1)(2 * s) * 0.5 : collie.Effect.easeOutExpo(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});
/**
 * easeOutExpo 이펙트 함수
 */
collie.Effect.easeOutInExpo = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.easeOutExpo(0, 1)(2 * s) * 0.5 : collie.Effect.easeInExpo(0, 1)((2 * s) - 1) * 0.5 + 0.5;
});

/**
 * Cubic-Bezier curve
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @see http://www.netzgesta.de/dev/cubic-bezier-timing-function.html
 */
collie.Effect._cubicBezier = function(x1, y1, x2, y2){
    return function(t){
        var cx = 3.0 * x1, 
            bx = 3.0 * (x2 - x1) - cx, 
            ax = 1.0 - cx - bx, 
            cy = 3.0 * y1, 
            by = 3.0 * (y2 - y1) - cy, 
            ay = 1.0 - cy - by;
        
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function sampleCurveY(t) {
            return ((ay * t + by) * t + cy) * t;
        }
        function sampleCurveDerivativeX(t) {
            return (3.0 * ax * t + 2.0 * bx) * t + cx;
        }
        function solveCurveX(x,epsilon) {
            var t0, t1, t2, x2, d2, i;
            for (t2 = x, i = 0; i<8; i++) {
                x2 = sampleCurveX(t2) - x; 
                if (Math.abs(x2) < epsilon) {
                    return t2;
                } 
                d2 = sampleCurveDerivativeX(t2); 
                if(Math.abs(d2) < 1e-6) {
                    break;
                } 
                t2 = t2 - x2 / d2;
            }
            t0 = 0.0; 
            t1 = 1.0; 
            t2 = x; 
            if (t2 < t0) {
                return t0;
            } 
            if (t2 > t1) {
                return t1;
            }
            while (t0 < t1) {
                x2 = sampleCurveX(t2); 
                if (Math.abs(x2 - x) < epsilon) {
                    return t2;
                } 
                if (x > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                } 
                t2 = (t1 - t0) * 0.5 + t0;
            }
            return t2; // Failure.
        }
        return sampleCurveY(solveCurveX(t, 1 / 200));
    };
};

/**
 * Cubic-Bezier 함수를 생성한다.
 * @see http://en.wikipedia.org/wiki/B%C3%A9zier_curve
 * @param {Number} x1 control point 1의 x좌표
 * @param {Number} y1 control point 1의 y좌표
 * @param {Number} x2 control point 2의 x좌표
 * @param {Number} y2 control point 2의 y좌표
 * @return {Function} 생성된 이펙트 함수
 */
collie.Effect.cubicBezier = function(x1, y1, x2, y2){
    return collie.Effect(collie.Effect._cubicBezier(x1, y1, x2, y2));
};

/**
 * Cubic-Bezier 커브를 이용해 CSS3 Transition Timing Function과 동일한 ease 함수
 * collie.Effect.cubicBezier(0.25, 0.1, 0.25, 1);
 * @see http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
 */
collie.Effect.cubicEase = collie.Effect.cubicBezier(0.25, 0.1, 0.25, 1);

/**
 * Cubic-Bezier 커브를 이용해 CSS3 Transition Timing Function과 동일한 easeIn 함수
 * collie.Effect.cubicBezier(0.42, 0, 1, 1);
 * @see http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
 */
collie.Effect.cubicEaseIn = collie.Effect.cubicBezier(0.42, 0, 1, 1);

/**
 * Cubic-Bezier 커브를 이용해 CSS3 Transition Timing Function과 동일한 easeOut 함수
 * collie.Effect.cubicBezier(0, 0, 0.58, 1);
 * @see http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
 */
collie.Effect.cubicEaseOut = collie.Effect.cubicBezier(0, 0, 0.58, 1);

/**
 * Cubic-Bezier 커브를 이용해 CSS3 Transition Timing Function과 동일한 easeInOut 함수
 * collie.Effect.cubicBezier(0.42, 0, 0.58, 1);
 * @see http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
 */
collie.Effect.cubicEaseInOut = collie.Effect.cubicBezier(0.42, 0, 0.58, 1);

/**
 * Cubic-Bezier 커브를 이용해 easeOutIn 함수를 구한다.
 * collie.Effect.cubicBezier(0, 0.42, 1, 0.58);
 */
collie.Effect.cubicEaseOutIn = collie.Effect.cubicBezier(0, 0.42, 1, 0.58);

/**
 * overphase 이펙트 함수
 */
collie.Effect.overphase = collie.Effect(function(s){
    s /= 0.652785;
    return (Math.sqrt((2 - s) * s) + (0.1 * s)).toFixed(5); 
});

/**
 * sin 곡선의 일부를 이용한 sinusoidal 이펙트 함수
 */
collie.Effect.sinusoidal = collie.Effect(function(s) {
    return (-Math.cos(s * Math.PI) / 2) + 0.5;
});

/**
 * mirror 이펙트 함수
 * sinusoidal 이펙트 함수를 사용한다.
 */
collie.Effect.mirror = collie.Effect(function(s) {
    return (s < 0.5) ? collie.Effect.sinusoidal(0, 1)(s * 2) : collie.Effect.sinusoidal(0, 1)(1 - (s - 0.5) * 2);
});

/**
 * nPulse의 진동수를 가지는 cos 함수를 구한다.
 * @param {Number} nPulse 진동수
 * @return {Function} 생성된 이펙트 함수
 * @example
var f = collie.Effect.pulse(3); //진동수 3을 가지는 함수를 리턴
//시작 수치값과 종료 수치값을 설정해 collie.Effect 함수를 생성
var fEffect = f(0, 100);
fEffect(0); => 0
fEffect(1); => 100
 */
collie.Effect.pulse = function(nPulse) {
    return collie.Effect(function(s){
        return (-Math.cos((s * (nPulse - 0.5) * 2) * Math.PI) / 2) + 0.5;   
    });
};

/**
 * nPeriod의 주기와 nHeight의 진폭을 가지는 sin 함수를 구한다.
 * @param {Number} nPeriod 주기
 * @param {Number} nHeight 진폭
 * @return {Function} 생성된 이펙트 함수
 * @example
var f = collie.Effect.wave(3, 1); //주기 3, 높이 1을 가지는 함수를 리턴
//시작 수치값과 종료 수치값을 설정해 collie.Effect 함수를 생성
var fEffect = f(0, 100);
fEffect(0); => 0
fEffect(1); => 0
 */
collie.Effect.wave = function(nPeriod, nHeight) {
    return collie.Effect(function(s){
        return (nHeight || 1) * (Math.sin(nPeriod * (s * 360) * Math.PI / 180)).toFixed(5);
    });
};

/**
 * easeIn 이펙트 함수
 * easeInCubic 함수와 동일하다.
 * @see easeInCubic
 */
collie.Effect.easeIn = collie.Effect.easeInCubic;
/**
 * easeOut 이펙트 함수
 * easeOutCubic 함수와 동일하다.
 * @see easeOutCubic
 */
collie.Effect.easeOut = collie.Effect.easeOutCubic;
/**
 * easeInOut 이펙트 함수
 * easeInOutCubic 함수와 동일하다.
 * @see easeInOutCubic
 */
collie.Effect.easeInOut = collie.Effect.easeInOutCubic;
/**
 * easeOutIn 이펙트 함수
 * easeOutInCubic 함수와 동일하다.
 * @see easeOutInCubic
 */
collie.Effect.easeOutIn = collie.Effect.easeOutInCubic;
/**
 * bounce 이펙트 함수
 * easeOutBounce 함수와 동일하다.
 * @see easeOutBounce
 */
collie.Effect.bounce = collie.Effect.easeOutBounce;
/**
 * elastic 이펙트 함수
 * easeInElastic 함수와 동일하다.
 * @see easeInElastic
 */
collie.Effect.elastic = collie.Effect.easeInElastic;