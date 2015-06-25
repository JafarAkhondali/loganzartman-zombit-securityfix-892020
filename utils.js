//shut up, this is a great place to define these!
INPUT_KB = 1;
INPUT_MOUSE = 2;

VK_LEFT = 37, VK_UP=38, VK_RIGHT=39, VK_DOWN=40, VK_W=87, VK_A=65, VK_S=83, VK_D=68, VK_R=82, VK_T=84, VK_Q=81, VK_X=88;
VK_0 = 48, VK_1 = 49, VK_2 = 50, VK_3 = 51, VK_4 = 52, VK_5 = 53, VK_6 = 54, VK_7 = 55, VK_8 = 56, VK_9 = 57;
VK_F10 = 121, VK_F11 = 122, VK_ESCAPE=27, VK_ENTER=13, VK_BACKSPACE=8;

CLIENT = 1;
SERVER = 2;
mpMode = SERVER;

//I can modify String all I want
String.prototype.repeat = function(n) {
	var s = this.toString();
	var o = s;
	for (var i=0; i<n-1; i++) {o+=s;}
	return o;
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

Array.prototype.random = function() {
  return this[~~(Math.random()*this.length)];
}

//integer randoms
irand = function(max) {
	if (max) {return Math.round(Math.random()*max);}
	else {return Math.round(Math.random());}
}

irandr = function(min,max) {
	return max<=min?min:irand(max-min)+min;
}

//integer randoms
rand = function(max) {
	if (max) {return (Math.random()*max);}
	else {return (Math.random());}
}

randr = function(min,max) {
	return max<=min?min:rand(max-min)+min;
}

//normal (guassian) randoms
grand = function(max) {
	if (max) {return (((Math.random()+Math.random()+Math.random())/3)*max);}
	else {return ((Math.random()+Math.random()+Math.random())/3);}
}

grandr = function(min,max) {
	return max<=min?min:grand(max-min)+min;
}

//fast (pregenerated) randoms. originally used for shaders.
frandArray = new Array(20000);
for (var i=0; i<frandArray.length; i++) {frandArray[i] = grand();}
frandPtr = 0;
frand = function() {
  frandPtr=frandPtr==frandArray.length-1?0:frandPtr+1;
  return frandArray[frandPtr];
}
ifrand = function(max) {
  if (max) {return ~~(frand()*max);}
  else {return ~~(frand());}
}

//generate random rgb triplet (in string form to be used in css, canvas)
rcol = function(rl,rh,gl,gh,bl,bh) {
	return irandr(rl,rh)+","+irandr(gl,gh)+","+irandr(bl,bh);
}

rhue = function(hl,hh,sl,sh,ll,lh) {
	var h = randr(hl,hh),
		s = randr(sl,sh),
		l = randr(ll,lh);
	var rgb = hslToRgb(h,s,l);
	return rgb[0]+","+rgb[1]+","+rgb[2];
}

hslToRgb = function(h, s, l) {
	var r, g, b;

	if(s == 0){
		r = g = b = l; // achromatic
	}else{
		function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
},

//return x on an exponential scale of max
xexp = function(max,x) {
	return ((Math.exp(2.77258872 * x) - 1) / 15)*max;
}

//todo: implement fast cached sin
fsin = function(x) {
  return Math.sin(x);
}

//pad an array (unused?)
array_pad  = function(input, pad_size, pad_value) {
  // http://kevin.vanzonneveld.net
  // +   original by: Waldo Malqui Silva

  var pad = [],
    newArray = [],
    newLength,
    diff = 0,
    i = 0;

  if (Object.prototype.toString.call(input) === '[object Array]' && !isNaN(pad_size)) {
    newLength = ((pad_size < 0) ? (pad_size * -1) : pad_size);
    diff = newLength - input.length;

    if (diff > 0) {
      for (i = 0; i < diff; i++) {
        newArray[i] = pad_value;
      }
      pad = ((pad_size < 0) ? newArray.concat(input) : input.concat(newArray));
    } else {
      pad = input;
    }
  }

  return pad;
}

//call functionToDo, passing each x,y pair in a line from x1,y1 to x2,y2
doLine = function(x1,y1,x2,y2,functionToDo,deres)
{
	deres = deres||1;
    var dX,dY,iSteps;
    var xInc,yInc,iCount,x,y;

    dX = x1 - x2;
    dY = y1 - y2;

    if (Math.abs(dX) > Math.abs(dY))
    {
        iSteps = Math.abs(dX);
    }
    else
    {
        iSteps = Math.abs(dY);
    }

    xInc = dX/iSteps;
    yInc = dY/iSteps;

    x = x1;
    y = y1;

    for (iCount=1; iCount<=iSteps; iCount+=deres)
    {
        functionToDo(Math.floor(x),Math.floor(y));
        x -= xInc;
        y -= yInc;
    }
}

//math!
/** Unused? **/
safeJSON = function(key,val) {
 //console.log(key+":"+val);
 if (key=="mpUpdate") {
   return undefined;
 }
 else return val;
}

tileAt = function(ex, ey) {
 var bx = Math.floor(ex/tileWidth);
 var by = Math.floor(ey/tileHeight);
 if (bx>0 && by>0 && bx<gameLevel.getWidth() && by<gameLevel.getHeight()) {
   return gameLevel.getTile(bx,by);
 }
 else {return null;}
}

pDir = function(x1,y1,x2,y2) {
 var xd = x2-x1;
 var yd = y2-y1;

 return fast_atan2(yd,xd);
}

pDist = function(x1,y1,x2,y2) {
 var xd = x2-x1;
 var yd = y2-y1;
 return Math.sqrt(xd*xd+yd*yd);
}

lDirX = function(len,dir) {
 var val = Math.cos(dir)*len
 return Math.abs(val)<0?0:val;
}

lDirY = function(len,dir) {
 var val = Math.sin(dir)*len
 return Math.abs(val)<0?0:val;
}

pVector = function(x1,y1,x2,y2,speed) {
 var dx = x2 - x1;
 var dy = y2 - y1;
 var norm = Math.sqrt(dx * dx + dy * dy);
 if (norm)
 {
     dx *= (speed / norm);
     dy *= (speed / norm);
 }
 return [dx,dy];
}

radians = function(deg) {
 return deg*0.01745;
}

degrees = function(rad) {
 return rad*57.29577;
}

var wheelDistance = function(evt){
  if (!evt) evt = event;
  var w=evt.wheelDelta, d=evt.detail;
  if (d){
    if (w) return w/d/40*d>0?1:-1; // Opera
    else return -d/3;              // Firefox;         TODO: do not /3 for OS X
  } else return w/120;             // IE/Safari/Chrome TODO: /3 for Chrome OS X
};

var wheelDirection = function(evt){
  if (!evt) evt = event;
  return (evt.detail<0) ? 1 : (evt.wheelDelta>0) ? 1 : -1;
};

/*
 * object.watch polyfill
 *
 * 2012-04-03
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// object.watch
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}

// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}

//unused?
extend = function() {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        toString = Object.prototype.toString,
        hasOwn = Object.prototype.hasOwnProperty,
        push = Array.prototype.push,
        slice = Array.prototype.slice,
        trim = String.prototype.trim,
        indexOf = Array.prototype.indexOf,
        class2type = {
          "[object Boolean]": "boolean",
          "[object Number]": "number",
          "[object String]": "string",
          "[object Function]": "function",
          "[object Array]": "array",
          "[object Date]": "date",
          "[object RegExp]": "regexp",
          "[object Object]": "object"
        },
        jQuery = {
          isFunction: function (obj) {
            return jQuery.type(obj) === "function"
          },
          isArray: Array.isArray ||
          function (obj) {
            return jQuery.type(obj) === "array"
          },
          isWindow: function (obj) {
            return obj != null && obj == obj.window
          },
          isNumeric: function (obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj)
          },
          type: function (obj) {
            return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
          },
          isPlainObject: function (obj) {
            if (!obj || jQuery.type(obj) !== "object" || obj.nodeType) {
              return false
            }
            try {
              if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false
              }
            } catch (e) {
              return false
            }
            var key;
            for (key in obj) {}
            return key === undefined || hasOwn.call(obj, key)
          }
        };
      if (typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        i = 2;
      }
      if (typeof target !== "object" && !jQuery.isFunction(target)) {
        target = {}
      }
      if (length === i) {
        target = this;
        --i;
      }
      for (i; i < length; i++) {
        if ((options = arguments[i]) != null) {
          for (name in options) {
            src = target[name];
            copy = options[name];
            if (target === copy) {
              continue
            }
            if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
              if (copyIsArray) {
                copyIsArray = false;
                clone = src && jQuery.isArray(src) ? src : []
              } else {
                clone = src && jQuery.isPlainObject(src) ? src : {};
              }
              // WARNING: RECURSION
              target[name] = extend(deep, clone, copy);
            } else if (copy !== undefined) {
              target[name] = copy;
            }
          }
        }
      }
      return target;
    }
