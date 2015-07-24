var lightArray = [];
var lightbuffer, lictx;
var gradientbuffer, grctx;
var globalBrightness = 1;
var enableShadowCasting = true;

function initLight() {
	lightbuffer = document.createElement("canvas");
	lightbuffer.width = viewWidth;
	lightbuffer.height = viewHeight;
	lictx = lightbuffer.getContext("2d");

	gradientbuffer = document.createElement("canvas");
	gradientbuffer.width = viewWidth;
	gradientbuffer.height = viewHeight;
	grctx = gradientbuffer.getContext("2d");
}

function registerLight(light) {
	if (lightArray.indexOf(light)<0) {
		lightArray.push(light);
	}
}

function unregisterLight(light) {
	var i = lightArray.indexOf(light);
	if (i>=0) {lightArray[i] = null;}
}

function StaticLight(x,y,col,size,brightness) { //a light that is drawn at a specific position
	this.x = x;
	this.y = y;
	this.col = col;
	this.size = size;
	this.brightness = brightness;
	this.img = generateLightImage(col,size,brightness);
	this.getX = function() {return this.x;};
	this.getY = function() {return this.y;};
}

function EntityLight(entity,col,size,brightness) { //a light that follows an entity
	this.entity = entity;
	this.col = col;
	this.size = size;
	this.brightness = brightness;
	this.img = generateLightImage(col,size,brightness);
	this.getX = function() {return this.entity.x;};
	this.getY = function() {return this.entity.y;};
}

function SpecialLightContainer(light) { //a light that has a custom drawing function
	this.light = light;
	this.getX = function() {return this.light.getX();};
	this.getY = function() {return this.light.getY();};
	this.size = this.light.size;
	this.col = this.light.col||null;
	this.brightness = this.light.brightness||null;

	//define this.drawLight(dest,[brightness])
}

function generateLightImage(color, size, brightness) {
	var can = document.createElement("canvas");
	can.width = size;
	can.height = size;
	var ct = can.getContext("2d");

	ct.drawImage(imgLightRadial,0,0,size,size);
	ct.globalCompositeOperation = "multiply";
	ct.fillStyle = color;
	ct.fillRect(0,0,size,size);

	return can;
}

var GLARESCALE = 2;
function drawLight(dest,x,y,col,size,brightness,mode,img) { //mode0: gradients only, mode1: both, mode2: glare only
    brightness*=globalBrightness;
	if (mode<2) {
		dest.globalAlpha = brightness>1?1:brightness;
		dest.drawImage(img,Math.floor(x-size/2),Math.floor(y-size/2),size,size);
	}
	if (enableGlare && mode>0 && brightness>0.6) { //glare (brightness can go up to 2)
		var sm = 1-(Math.sin(Date.now()*0.05)*0.05);
		ctx.globalAlpha = brightness>2?1*sm:(brightness-0.5)*0.5*sm;
		//console.log("glaring "+ctx.globalAlpha);
		ctx.drawImage(imgGlare,x-(imgGlare.width*0.5*((size*GLARESCALE)/imgGlare.width)*sm),y-(imgGlare.height*0.5*((size*GLARESCALE)/imgGlare.height)*sm),size*GLARESCALE*sm,size*GLARESCALE*sm);
	}
	dest.globalAlpha = 1;
}

function compositeLight(dest,gco) {
	dest.globalCompositeOperation = gco;
	dest.drawImage(lightbuffer,0,0);
	dest.globalCompositeOperation = "source-over";
 }
function drawAllLights(dest,gbrightness,mode) {
	if (mode>0) {ctx.globalCompositeOperation = "screen";}
	for (var i=0; i<lightArray.length; i++) {
		if (lightArray[i]!==null && lightArray[i].col) {
			var x = lightArray[i].getX();
			var y = lightArray[i].getY();
			var s = lightArray[i].size;

			if (x+s>=viewX && x-s<=viewX+viewWidth && y+s>=viewY && y-s<=viewY+viewHeight) {
				if (lightArray[i] instanceof SpecialLightContainer && typeof lightArray[i].drawLight === 'function') {
					lightArray[i].drawLight(dest,x-viewX,y-viewY,gbrightness,mode);
				}
				else {
					drawLight(dest,x-viewX,y-viewY,lightArray[i].col,s,lightArray[i].brightness*gbrightness,mode,lightArray[i].img);
				}
			}
		}
	}
	if (mode>0) {ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;}
}

function renderLight2() {
	if (enableLightRendering) {
		//first composite: subtract opacity from lit areas of view
		var newmode = false;
		lictx.globalCompositeOperation = newmode?"lighter":"screen";
		drawAllLights(lictx,newmode?0.5:1,0);

		if (enableShadowCasting) {
			renderCastShadows();
			var scale = 2;
			grctx.drawImage(gradientbuffer, 0, 0, (1/scale)*gradientbuffer.width, (1/scale)*gradientbuffer.height);
			grctx.drawImage(gradientbuffer, 0, 0, scale*gradientbuffer.width, scale*gradientbuffer.height);
			lictx.globalCompositeOperation = "multiply";
			lictx.drawImage(gradientbuffer,0,0);
		}

		compositeLight(ctx,newmode?"hard-light":"multiply");

		lictx.globalCompositeOperation = "source-over";
		clearCanvas(lictx,"black");

		var grd = grctx.createRadialGradient(player.x-viewX,player.y-viewY,20,player.x-viewX,player.y-viewY,75);
		grd.addColorStop(0,"rgb(100,100,100)");
		grd.addColorStop(1,"black");
		clearCanvas(grctx, grd);
	}
}

//http://tavianator.com/fast-branchless-raybounding-box-intersections/
fmax = function(a,b) {return a<b?b:a;}
fmin = function(a,b) {return a<b?a:b;}
function rayBoxIntersect(ray, box) {
	var tx1 = (box.x1 - ray.x)/ray.vx;
  var tx2 = (box.x2 - ray.x)/ray.vx;

  var tmin = fmin(tx1, tx2);
  var tmax = fmax(tx1, tx2);

  var ty1 = (box.y1 - ray.y)/ray.vy;
  var ty2 = (box.y2 - ray.y)/ray.vy;

  tmin = fmax(tmin, fmin(ty1, ty2));
  tmax = fmin(tmax, fmax(ty1, ty2));

  if (tmax >= 0 && tmax >= tmin) {
		return {
			x: ray.x + ray.vx*tmin,
			y: ray.y + ray.vy*tmin,
			t: tmin
		};
	}
	return false;
}

function renderCastShadows() {
	var pang = function(point) {
		if (point === null) return Infinity;
		var dx = point.x - player.x,
				dy = point.y - player.y;
		return Math.atan2(dy,dx);
	};

	var boxes = [
		{x1: viewX, y1: viewY, x2: viewX+viewWidth, y2: viewY},
		{x1: viewX, y1: viewY, x2: viewX, y2: viewY+viewHeight},
		{x1: viewX+viewWidth, y1: viewY, x2: viewX+viewWidth, y2: viewY+viewHeight},
		{x1: viewX, y1: viewY+viewHeight, x2: viewX+viewWidth, y2: viewY+viewHeight}
	], points = [
		{x: viewX, y: viewY},
		{x: viewX+viewWidth, y: viewY},
		{x: viewX, y: viewY+viewHeight},
		{x: viewX+viewWidth, y: viewY+viewHeight}
	];
	for (var i=0; i<solidRenderedBlocks.length; i++) {
		var tile = solidRenderedBlocks[i];
		var tilex = tile.x * tileWidth,
				tiley = tile.y * tileHeight;

		boxes.push({
			x1: tilex,
			y1: tiley,
			x2: tilex+tileWidth,
			y2: tiley+tileHeight
		});
		points.push({x: tilex, y: tiley});
		points.push({x: tilex+tileWidth, y: tiley});
		points.push({x: tilex, y: tiley+tileHeight});
		points.push({x: tilex+tileWidth, y: tiley+tileHeight});
	}

	points.sort(function(a,b){return pang(a)-pang(b)});

	grctx.globalCompositeOperation = "source-over";
	grctx.beginPath();
	grctx.fillStyle = "white";

	var started = false, moved = 0;

	for (var i=0; i<points.length; i++) {
		var p = points[i];

		for (var k=-1; k<=1; k++) {
			var dx = p.x - player.x,
					dy = p.y - player.y;
			var dir = Math.atan2(dy,dx)+k*0.0001;
			var vx = Math.cos(dir),
					vy = Math.sin(dir);

			var min = {t: Infinity};
			for (var j=0; j<boxes.length; j++) {
				var isect = rayBoxIntersect({
					x: player.x,
					y: player.y,
					vx: vx,
					vy: vy
				}, boxes[j]);
				if (isect && isect.t < min.t) {
					min = isect;
				}
			}

			if (!started) {
				started = true;
				grctx.moveTo(min.x - viewX, min.y - viewY);
			}
			else grctx.lineTo(min.x - viewX, min.y - viewY);
		}
	}

	grctx.fill();
};

function clearCanvas(context, color) {
	var tempa = context.globalCompositeOperation;
	var tempb = context.globalAlpha;
	context.globalCompositeOperation = "copy";
	context.globalAlpha = 1;
	context.fillStyle = color;
	context.fillRect(0,0,viewWidth,viewHeight);
	context.globalCompositeOperation = tempa;
	context.globalAlpha = tempb;
}

function addLightsToLevel(level,spacing,color,size,randomness,chanceBroken,brightness) {
	for (var x=spacing, w=level.getWidth()*tileWidth; x<w; x+=spacing) {
		for (var y=spacing, h=level.getHeight()*tileHeight; y<h; y+=spacing) {
			if (Math.random()>chanceBroken) {registerLight(new StaticLight(x,y,color,size-(Math.random()*size*randomness),brightness));}
		}
	}
}
