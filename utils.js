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
};

Array.prototype.shuffle = function() {
	var o = this;
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

Array.prototype.pad = function(size, val) {
	var out = [];
	for (var i=0; i<this.length; i++)
		if (i>=this.length) out[i] = val;
		else out[i] = this[i];
	return out;
};

var Util = {};

Util.loadJSON = function(url, callback) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.status == 200) {
			var json = JSON.parse(req.responseText);
			callback(json);
		}
	};
	req.open("GET", url+"?"+Date.now(), true);
	try {
		if (url === "") callback(false);
		req.send();
	}
	catch (error) {
		callback(false);
	}
};

Util.inView = function(x,y) {
	return x>=viewX && y>=viewY && x<=viewX+viewWidth && y<=viewY+viewHeight;
};

/**
 * Determine if a box is at least partially visible
 * @param box {x1, y1, x2, y2}
 */
Util.rectInView = function(box) {
	return box.x2>viewX && viewX+viewWidth>box.x1 && box.y2>viewY && viewY+viewHeight>box.y1;
};

/**
 * Returns vertices of intersection between rectangle and view
 * @param box {x1, y1, x2, y2}
 * @return false or array of points
 */
Util.rectViewEdgePoints = function(box) {
	var vx1 = viewX,
		vy1 = viewY,
		vx2 = viewX+viewWidth,
		vy2 = viewY+viewHeight;
	var ix1 = Math.max(box.x1, vx1),
		iy1 = Math.max(box.y1, vy1),
		ix2 = Math.min(box.x2, vx2),
		iy2 = Math.min(box.y2, vy2);
	if (ix1 > ix2 || iy1 > iy2) return false;
	if (ix1 === box.x1 && ix2 === box.x2 && iy1 === box.y1 && iy2 === box.y2) return false;
	return [
		{x: ix1, y: iy1},
		{x: ix2, y: iy1},
		{x: ix1, y: iy2},
		{x: ix2, y: iy2}
	];
};

//integer randoms
Util.irand = function(max) {
	if (max) {return Math.round(Math.random()*max);}
	else {return Math.round(Math.random());}
};

Util.irandr = function(min,max) {
	return max<=min?min:Util.irand(max-min)+min;
};

//integer randoms
Util.rand = function(max) {
	if (max) {return (Math.random()*max);}
	else {return (Math.random());}
};

Util.randr = function(min,max) {
	return max<=min?min:Util.rand(max-min)+min;
};

//normal (guassian) randoms
Util.grand = function(max) {
	if (max) {return (((Math.random()+Math.random()+Math.random())/3)*max);}
	else {return ((Math.random()+Math.random()+Math.random())/3);}
};

Util.grandr = function(min,max) {
	return max<=min?min:Util.grand(max-min)+min;
};

function SmoothRandom(len) {
    this.len = len;
    this.data = [];
    this._idx = 0;
    this.generate();
}
SmoothRandom.SMOOTH_SIZE = 4;
SmoothRandom.SMOOTH_ITERATIONS = 3;
SmoothRandom.prototype._get = function(idx) {
    if (idx<0) return this.data[this.len+idx%this.len-1];
    return this.data[idx%this.len];
}
SmoothRandom.prototype.generate = function() {
    var i, j, n, smooth;
    //randomize
    for (i=this.len-1; i>=0; i--)
        this.data[i] = Math.random();

    //smooth
    for (var z=0; z<SmoothRandom.SMOOTH_ITERATIONS; z++) {
        n = SmoothRandom.SMOOTH_SIZE*2+1;
        smooth = [];
        for (i=this.len-1; i>=0; i--) {
            smooth[i] = 0;
            for (j=-SmoothRandom.SMOOTH_SIZE; j<=SmoothRandom.SMOOTH_SIZE; j++) {
                smooth[i] += this._get(i+j);
            }
            smooth[i] /= n;
        }
        this.data = smooth;
    }

    //normalize
    var high = Math.max.apply(this, this.data);
    var low = Math.min.apply(this, this.data);
    var scale = high-low;
    for (i=this.len-1; i>=0; i--)
        this.data[i] = (this.data[i]-0.5)/scale + 0.5;
};
SmoothRandom.prototype.offset = function(idx) {
	if ((this._idx+=idx) >= this.len) this._idx = 0;
};
SmoothRandom.prototype.next = function() {
    if (++this._idx >= this.len) this._idx = 0;
    return this.data[~~this._idx];
};

Util.CachedRandom = {
	len: 2000,
	data: [],
	_idx: 0,
	init: function() {
		for (var i=0; i<Util.CachedRandom.len; i++) {
			Util.CachedRandom.data[i] = (Math.random()+Math.random()+Math.random())/3;
		}
	},
	next: function() {
		if (++this._idx >= this.len) this._idx = 0;
	    return this.data[~~this._idx];
	}
};
Util.CachedRandom.init();

//fast (pregenerated) randoms. originally used for shaders.
Util.frandArray = new Array(2000);
for (var i=0; i<Util.frandArray.length; i++) {Util.frandArray[i] = Util.grand();}
Util.frandPtr = 0;
Util.frand = function() {
  Util.frandPtr=Util.frandPtr==Util.frandArray.length-1?0:Util.frandPtr+1;
  return Util.frandArray[Util.frandPtr];
};
Util.ifrand = function(max) {
  if (max) {return ~~(Util.frand()*max);}
  else {return ~~(Util.frand());}
};

//generate random rgb triplet (in string form to be used in css, canvas)
Util.rcol = function(rl,rh,gl,gh,bl,bh) {
	return Util.irandr(rl,rh)+","+Util.irandr(gl,gh)+","+Util.irandr(bl,bh);
};

Util.rhue = function(hl,hh,sl,sh,ll,lh) {
	var h = Util.randr(hl,hh),
		s = Util.randr(sl,sh),
		l = Util.randr(ll,lh);
	var rgb = Util.hslToRgb(h,s,l);
	return rgb[0]+","+rgb[1]+","+rgb[2];
};

Util.hslToRgb = function(h, s, l) {
	var r, g, b;

	if(s === 0){
		r = g = b = l; // achromatic
	}else{
		var hue2rgb = function(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

//return x on an exponential scale of max
Util.xexp = function(max,x) {
	return ((Math.exp(2.77258872 * x) - 1) / 15)*max;
};

//call functionToDo, passing each x,y pair in a line from x1,y1 to x2,y2
Util.applyLine = function(x1,y1,x2,y2,functionToDo,deres) {
	deres = deres||1;
    var dX,dY,iSteps;
    var xInc,yInc,iCount,x,y;

    dX = x1 - x2;
    dY = y1 - y2;

    if (Math.abs(dX) > Math.abs(dY)) {
        iSteps = Math.abs(dX);
    }
    else {
        iSteps = Math.abs(dY);
    }

    xInc = dX/iSteps;
    yInc = dY/iSteps;
    x = x1;
    y = y1;

    for (iCount=1; iCount<=iSteps; iCount+=deres) {
        functionToDo(Math.floor(x),Math.floor(y));
        x -= xInc;
        y -= yInc;
    }
};

Util.pointDir = function(x1,y1,x2,y2) {
 var xd = x2-x1;
 var yd = y2-y1;

 return Math.atan2(yd,xd);
}

Util.pointDist = function(x1,y1,x2,y2) {
 var xd = x2-x1;
 var yd = y2-y1;
 return Math.sqrt(xd*xd+yd*yd);
}

Util.radians = function(deg) {
 return deg*0.01745;
};

Util.degrees = function(rad) {
 return rad*57.29577;
};

Util.wheelDistance = function(evt){
  if (!evt) evt = event;
  var w=evt.wheelDelta, d=evt.detail;
  if (d){
    if (w) return w/d/40*d>0?1:-1; // Opera
    else return -d/3;              // Firefox;         TODO: do not /3 for OS X
  } else return w/120;             // IE/Safari/Chrome TODO: /3 for Chrome OS X
};

Util.wheelDirection = function(evt){
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
// this is used in now-unused network code (see network.js).
// I originally wanted this game to have multiplayer, but it's simply not built
// well enough to make that feasible.
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
