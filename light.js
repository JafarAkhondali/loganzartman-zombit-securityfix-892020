var lightArray = [];
var lightbuffer, lictx;
var gradientbuffer, grctx;
var globalBrightness = 1;

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
		lictx.globalCompositeOperation = "source-over";
		clearCanvas(lictx,"black");
		clearCanvas(grctx,"rgba(0,0,0,0)");

		//first composite: subtract opacity from lit areas of view
		var newmode = false;
		lictx.globalCompositeOperation = newmode?"lighter":"screen";
		drawAllLights(lictx,newmode?0.5:1,0);

		compositeLight(ctx,newmode?"hard-light":"multiply");
	}
}

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
