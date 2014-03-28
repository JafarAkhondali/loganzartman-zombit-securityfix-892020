window.addEventListener('load', function(){
	onScriptsLoaded.push(function(){
		init();
	});
	loadScripts();
}, false);

var targetFPS = 60;
var fps = targetFPS;
var lt = new Date().getTime(); //used for timing
var gameLevel = null; //currently loaded level
var gamePaused = false;

var tileWidth = 16; //pixel width of a tile
var tileHeight = 16;

//var entities = []; //stores all entities DEPRECATED
var items = []; //stores all items (does this need to exist?)

var gameScore = 0; //score...

//settings
var enableShaders = false; //this works, but it's probably too slow

//fps monitoring
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;
var fps = targetFPS;

particlesEnabled = true; //duh

uArgs = null; //user arguments

//utility function for efficient rendering w/ IE fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function init() {
	preload();
    //create container to center canvas
	canvContainer = document.createElement("center");
	document.getElementById("cc").appendChild(canvContainer);
        
	reinitCanvases();
	
	//parse URL flags
	var loc = document.location.href;
	uArgs = loc.lastIndexOf("#")>loc.lastIndexOf("/")?loc.substring(loc.lastIndexOf("#")+1).split("&"):"";
	if (uArgs.indexOf("nointro")>=0) {dmode = GAME;}
	if (uArgs.indexOf("nomusic")<0) {/*setTimeout(startPlaylist,4900);*/}

	//initialize drawing buffers for lighting
	initLight();
	
	loadAudio(); //load audio

	mpMode = CLIENT; //this is not a sever.  this is for shared code

	//create player
	player = new Player(50,50,"Player");
	player.inv.push(new Pistol());
	player.inv.push(new AssaultRifle());
	player.inv.push(new Typhoon());
	player.inv.push(new Gauss());
	player.inv.push(new WoodenBat());
	player.inv.push(new GlowstickGun());
	player.inv.push(new RandomGunTester(0.9));

	startGame(); //generate and populate a level
	
	//set interval for processing
	timer = setInterval(step,1000/targetFPS);

	//set up some light
	var pLight = new EntityLight(player,"rgba(200,150,110,0.5)",200,1);
	pLight = new SpecialLightContainer(pLight);
	pLight.drawLight = function(dest,x,y,brightness,mode) {
		dest.save();
		dest.globalAlpha = brightness*mode==0?0.5:0;
		dest.translate(x,y);
		dest.rotate(player.facing-Math.PI);
		dest.translate(-(x+imgFlashlightBeam.width),-(y+imgFlashlightBeam.height/2));
		dest.drawImage(imgFlashlightBeam,x,y);
		dest.restore();
	}
	registerLight(pLight);

	var rLight = new StaticLight(mouseX,mouseY,"rgba(200,180,110,0.5)",400,1);
	rLight.update = function() {
		var x = mouseX+viewX, y = mouseY+viewY;
		var d = pDist(player.x,player.y,x,y);
		//console.log(d);
		this.brightness = Math.max(0,Math.min(1,d/50)*(1-d/400));
		this.size = ((d+100)/300)*400;
	}
	rLight.getX = function(){this.update(); return mouseX+viewX;}
	rLight.getY = function(){return mouseY+viewY;}
	registerLight(rLight);

	//start music
	//setTimeout(startPlaylist,4900);

	//switch to game rendering mode in 5 sec
	setTimeout(function(){dmode=GAME;},5000);

	//start rendering
	requestAnimFrame(render);
	
	createGUI();
}

function loadScripts() {
	include("fasttrig.js");
	include("encode64.js");
	include("klass.js");
	include("interface.js");
	include("level/level.js");
	include("main.js");
	include("entities/EntityManager.js");
	include("render.js");
	include("light.js");
	include("res.js");
	include("audio.js");
	include("utils.js");
	include("client.js");
	include("network.js");
	include("dat.gui.min.js");
}

function reinitCanvases() {
        try {canvContainer.removeChild(canvas);}
        catch (e) {}
    
	//create canvas element
	canvas = document.createElement("canvas");
	canvas.width = screenWidth;
	canvas.height = screenHeight;
	canvas.style.cursor = "url('res/cursor.cur'), crosshair";
	canvContainer.appendChild(canvas);
	sctx = canvas.getContext("2d"); //screen context, shouldn't be draw onto usually

	//create invisible "buffer" canvas
	buffer = document.createElement("canvas");
	buffer.width = viewWidth;
	buffer.height = viewHeight;
	ctx = buffer.getContext("2d"); //buffer context

	//suggest to browsers not to antialias
	ctx.webkitImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.imageSmoothingEnabled = false;	
	sctx.webkitImageSmoothingEnabled = false;
	sctx.mozImageSmoothingEnabled = false;
	sctx.imageSmoothingEnabled = false;	

	//clear buffer to black
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,viewWidth,viewHeight);

	noiseCanvas = document.createElement("canvas");
	noiseCanvas.width = noiseWidth;
	noiseCanvas.height = noiseHeight;
	noiseCtx = noiseCanvas.getContext("2d");
	noiseData = noiseCtx.getImageData(0,0,noiseWidth,noiseHeight);

	//initialize advanced shader data
	oid = ctx.createImageData(viewWidth,viewHeight);
	dout = oid.data;
	for (var i=3; i<dout.length; i+=4) {dout[i] = 255;} //set to opaque
        
        addListeners(); //add input listeners
}

var imgOverlay, imgEntityGeneric, imgPlayer;

//no idea why this exists
function tileImage(id) {
	return images[id];
}

//delta function.  use to make fps scalable
function d(s) {
	return s;  //LIES
	//return (60/fps)*s;
}

tdelta = 1;
window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return Date.now(); };
})();
prevtime = performance.now();
function step() {
	time = performance.now();
	//console.log("d "+(time-prevtime));
	tdelta = (time-prevtime)/(1000/targetFPS);
	//console.log("e "+delta);

	//monitor framerate
	var thisFrameTime = (thisLoop=time) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
	fps = (1000/frameTime).toFixed(1);
	
	processStep(tdelta);

	// Switch sprites on key events (for player)
	/*if (keys[VK_LEFT]) {viewX-=3;}
	if (keys[VK_RIGHT]) {viewX+=3;}
	if (keys[VK_UP]) {viewY-=3;}
	if (keys[VK_DOWN]) {viewY+=3;}*/

	//clip viewport position
	if (viewX<0) {viewX = 0;}
	if (viewX>gameLevel.getWidth()*tileWidth-viewWidth) {viewX = gameLevel.getWidth()*tileWidth-viewWidth;}
	if (viewY<0) {viewY = 0;}
	if (viewY>gameLevel.getHeight()*tileHeight-viewHeight) {viewY = gameLevel.getHeight()*tileHeight-viewHeight;}

	//now called by animation frame
	//render();
	prevtime = time;
}

function godMode() {
	player.inv.getSelected().ammo = Infinity;
	player.inv.getSelected().clipsize = Infinity;
	player.life = Infinity;
	player.maxlife = Infinity;
}

function randomGun() {
	showPrompt("Enter awesomeness rating (0 to 1):", function(inpt){
		player.inv.push(new RandomGun(parseFloat(inpt)));
	});
}

function giveNyanGun() {
	player.inv.push(new NyanGun());
}

/**
 * Includes a javascript file dynamically.
 * Must be redefined in server code.
 * @param filename the file path to load
 */
scriptLoadQueue = [];
scriptsToLoad = 0;
scriptsLoaded = 0;
onScriptsLoaded = [];
isScriptLoading = false;
function include(filename,loadImmediately) {
  if (isScriptLoading && !loadImmediately) {
  	scriptLoadQueue.push(filename);
  }
  else {
  	  isScriptLoading = true;
	  scriptsToLoad++;
	  var d = window.document;
	  var isXML = d.documentElement.nodeName !== 'HTML' || !d.write; // Latter is for silly comprehensiveness
	  var js = d.createElementNS && isXML ? d.createElementNS('http://www.w3.org/1999/xhtml', 'script') : d.createElement('script');
	  js.setAttribute('type', 'text/javascript');
	  js.setAttribute('src', filename);
	  js.setAttribute('defer', 'defer');
	  js.onload = function(){
	  	scriptsLoaded++;
	  	
	  	var el = document.getElementById("loading-div");
	  	el.innerHTML = "loading script "+scriptsLoaded+":";

	  	if (scriptLoadQueue.length>0) {
	  		var cscript = scriptLoadQueue.shift();
  			include(cscript,true);
  			el.innerHTML+="<br>"+cscript;
  		}
  		else {
  			isScriptLoading = false;
  		}

	  	if (scriptsLoaded>=scriptsToLoad) {
	  		for (var i=0; i<onScriptsLoaded.length; i++) {
	  			onScriptsLoaded[i]();
	  		}

	  		onScriptsLoaded = [];
	  		scriptsLoaded = 0;
	  		scriptsToLoad = 0;
	  	}
	  };
	  d.getElementsByTagNameNS && isXML ? (d.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'head')[0] ? d.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'head')[0].appendChild(js) : d.documentElement.insertBefore(js, d.documentElement.firstChild) // in case of XUL
	  ) : d.getElementsByTagName('head')[0].appendChild(js);
	  // save include state for reference by include_once
	  var cur_file = {};
	  cur_file[window.location.href] = 1;

	  // BEGIN REDUNDANT
	  this.php_js = this.php_js || {};
	  // END REDUNDANT
	  if (!this.php_js.includes) {
		this.php_js.includes = cur_file;
	  }
	  if (!this.php_js.includes[filename]) {
		this.php_js.includes[filename] = 1;
	  } else {
		this.php_js.includes[filename]++;
	  }

	  return this.php_js.includes[filename];
  }
}