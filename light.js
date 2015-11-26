var lightArray = [];
var lightbuffer, lictx;
var gradientbuffer, grctx;
var globalBrightness = 1;
var lightScale = 0.5;
var playerLightImage = null;

function initLight() {
	lightbuffer = document.createElement("canvas");
	lightbuffer.width = ~~(viewWidth*lightScale);
	lightbuffer.height = ~~(viewHeight*lightScale);
	lictx = lightbuffer.getContext("2d");
	// lictx.scale(lightBufferScale, lightBufferScale);

	gradientbuffer = document.createElement("canvas");
	gradientbuffer.width = ~~(viewWidth*lightScale);
	gradientbuffer.height = ~~(viewHeight*lightScale);
	grctx = gradientbuffer.getContext("2d");
	// grctx.scale(lightBufferScale, lightBufferScale);
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

function StaticLight(x,y,col,size,brightness,life,img) { //a light that is drawn at a specific position
	this.x = x;
	this.y = y;
	this.col = col;
	this.size = size;
	this.brightness = brightness;
	this.img = generateLightImage(col,size,brightness,img);
	this.life = life ? life : Infinity;
	this.getX = function() {return this.x;};
	this.getY = function() {return this.y;};
	this.resetLife = function(t) {this.life = t; this.brightness = 1;};
}

function EntityLight(entity,col,size,brightness,life,img) { //a light that follows an entity
	this.entity = entity;
	this.col = col;
	this.size = size;
	this.brightness = brightness;
	this.img = generateLightImage(col,size,brightness,img);
	this.life = life ? life : Infinity;
	this.getX = function() {return this.entity.x;};
	this.getY = function() {return this.entity.y;};
	this.resetLife = function(t) {this.life = t; this.brightness = 1;};
}

function SpecialLightContainer(light) { //a light that has a custom drawing function
	this.light = light;
	this.getX = function() {return this.light.getX();};
	this.getY = function() {return this.light.getY();};
	this.size = this.light.size;
	this.col = this.light.col||null;
	this.brightness = this.light.brightness||null;
	this.life = this.light.life;
	this.resetLife = function(t) {this.life = t; this.brightness = 1;};
	//define this.drawLight(dest,[brightness])
}

function generateLightImage(color, size, brightness, img) {
	size = ~~(size*lightScale);
	var can = document.createElement("canvas");
	can.width = size;
	can.height = size;
	var ct = can.getContext("2d");

	ct.drawImage(img||imgLightRadial,0,0,size,size);
	ct.globalCompositeOperation = "multiply";
	ct.fillStyle = color;
	ct.fillRect(0,0,size,size);

	return can;
}

function drawLight(dest,x,y,col,size,brightness,mode,img) { //mode0: gradients only, mode1: both, mode2: glare only
    brightness*=globalBrightness;
	if (mode<2) {
		dest.globalAlpha = brightness>1?1:brightness;
		dest.drawImage(img,~~((x-size*0.5)*lightScale),~~((y-size*0.5)*lightScale));
	}
	dest.globalAlpha = 1;
}

function compositeLight(dest,gco) {
	dest.globalCompositeOperation = gco;
	var is = dest.imageSmoothingEnabled || dest.webkitImageSmoothingEnabled || dest.mozImageSmoothingEnabled;
	dest.imageSmoothingEnabled = dest.webkitImageSmoothingEnabled = dest.mozImageSmoothingEnabled = true;
	dest.drawImage(lightbuffer,0,0,~~(1/lightScale*lightbuffer.width),~~(1/lightScale*lightbuffer.height));
	dest.imageSmoothingEnabled = dest.webkitImageSmoothingEnabled = dest.mozImageSmoothingEnabled = is;	
	dest.globalCompositeOperation = "source-over";
 }
function drawAllLights(dest,gbrightness,mode) {
	if (mode>0) {ctx.globalCompositeOperation = "screen";}
	for (var i=0; i<lightArray.length; i++) {
		if (lightArray[i]!==null && lightArray[i].col) {
			var x = lightArray[i].getX();
			var y = lightArray[i].getY();
			var s = lightArray[i].size;

			if (x+s*0.5>=viewX && x-s*0.5<=viewX+viewWidth && y+s*0.5>=viewY && y-s*0.5<=viewY+viewHeight) {
				if (lightArray[i] instanceof SpecialLightContainer && typeof lightArray[i].drawLight === 'function') {
					// lightArray[i].drawLight(dest,x-viewX,y-viewY,gbrightness,mode);
				}
				else {
					drawLight(dest,x-viewX,y-viewY,lightArray[i].col,s,lightArray[i].brightness*gbrightness,mode,lightArray[i].img);
				}
			}

			if (lightArray[i].life-- <= 0) lightArray[i].brightness = 0;
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
	}
	if (enableShadowCasting) {
		renderCastShadows();
		if (enableSoftShadows) {
			grctx.globalCompositeOperation = "source-over";
			grctx.drawImage(gradientbuffer,0,0,gradientbuffer.width*0.5,gradientbuffer.height*0.5);
		}

		lictx.globalCompositeOperation = "multiply";

		if (enableSoftShadows) lictx.drawImage(gradientbuffer,0,0,gradientbuffer.width*2,gradientbuffer.height*2);
		else lictx.drawImage(gradientbuffer, 0, 0);
	}
	if (false && enableLightRendering || enableShadowCasting) {
		compositeLight(ctx,newmode?"hard-light":"multiply");

		lictx.globalCompositeOperation = "source-over";
		clearCanvas(lictx,enableLightRendering?"black":"white");

		
		clearCanvas(grctx, "black");
	}
}

function clearCanvas(context, color) {
	var tempa = context.globalCompositeOperation;
	var tempb = context.globalAlpha;
	context.globalCompositeOperation = "source-over";
	context.globalAlpha = 1;
	context.fillStyle = color;
	context.fillRect(0,0,viewWidth,viewHeight);
	context.globalCompositeOperation = tempa;
	context.globalAlpha = tempb;
}

function addLightsToLevel(level,spacing,color,size,randomness,chanceBroken,brightness) {
	for (var x=spacing, w=level.getWidth()*tileWidth; x<w; x+=spacing) {
		for (var y=spacing, h=level.getHeight()*tileHeight; y<h; y+=spacing) {
			if (Math.random()*Math.random()<chanceBroken) {registerLight(new StaticLight(x,y,color,size-(Math.random()*size*randomness),brightness*Math.random()));}
		}
	}
}
