window.addEventListener('load', function(){
	var getGlobals = function(){return Object.getOwnPropertyNames(window)};
	var preInit = getGlobals();
	onScriptsLoaded.push(function(){
		init();
		var postInit = getGlobals();
		console.log("Leaked vars to global scope:", postInit.filter(function(item){return preInit.indexOf(item)<0}));
	});
	loadScripts();
}, false);

var targetFPS = 60;
var fps = targetFPS;
var lt = new Date().getTime(); //used for timing
var gameLevel = null; //currently loaded level
var gamePaused = true;

var tileWidth = 16; //pixel width of a tile
var tileHeight = 16;

var items = []; //stores all items (does this need to exist?)

var gameScore = 0; //score...
var gameTime = 0;

//settings
var enableShaders = false; //this works, but it's probably too slow
var spawnEnabled = true;

//fps monitoring
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;
var fps = targetFPS;

var VERSION = 130;
var SUBVER = "goty edition";

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

window.addEventListener("resize", function(){
    screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;

	if (devicePixelRatio && devicePixelRatio > 1) {
		screenWidth *= devicePixelRatio;
		screenHeight *= devicePixelRatio;
	}

	defaultScreenWidth = screenWidth;
	defaultScreenHeight = screenHeight;
	viewWidth = screenWidth/outputScale;
	viewHeight = screenHeight/outputScale;

    initLight();
	reinitCanvases();
}, false);

function init() {
    //create container to center canvas
	canvContainer = document.createElement("center");
	document.getElementById("cc").appendChild(canvContainer);

	reinitCanvases();

	//switch to title rendering mode in 5 sec
	var introTimeout = setTimeout(function(){dmode=MENU;},3700);

	//parse URL flags
	var loc = document.location.href;
	uArgs = loc.lastIndexOf("#")>loc.lastIndexOf("/")?loc.substring(loc.lastIndexOf("#")+1).split("&"):"";
	if (uArgs.indexOf("nointro")>=0) {dmode = MENU; clearTimeout(introTimeout)}
	if (uArgs.indexOf("nomusic")<0) {/*setTimeout(startPlaylist,4900);*/}

	//initialize drawing buffers for lighting
	initLight();
	loadAudio(); //load audio

	mpMode = CLIENT; //this is not a sever.  this is for shared code

	//set interval for processing
	timer = setInterval(step,1000/targetFPS);

	//start music
	//setTimeout(startPlaylist,4900);

	//start rendering
	requestAnimFrame(render);
}

var mfLight;
function restartGame() {
	LevelFactory.fromFile("level/test.json", function(level){
		if (level) {
			gameLevel = level;
			startGame(true);

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
				var d = Util.pointDist(player.x,player.y,x,y);
				//console.log(d);
				this.brightness = Math.max(0,Math.min(1,d/50)*(1-d/400));
				this.size = ((d+100)/300)*400;
			}
			rLight.getX = function(){this.update(); return mouseX+viewX;}
			rLight.getY = function(){return mouseY+viewY;}
			registerLight(rLight);

			var centerLight = new StaticLight(player.x, player.y, "rgba(170,160,240,0.8)", 600, 1);
			registerLight(centerLight);

			dmode = GAME;
			gamePaused = false;
			if (typeof gui === "undefined") {createGUI();}
			gameTime = 0;
		}
		else {
			throw new Error("LEVEL FAILED TO LOAD");
		}
	});
}

function endGame() {
	showScorescreen();
	cleanupGame();
	sndDie.play();
}

function cleanupGame() {
	gameTime = 0;
	gameScore = 0;
	dmode = MENU;
	gamePaused = true;

	keys = [];

	clearInterval(spawnInterval);
	lightArray = [];
	if (typeof entityManager !== "undefined") entityManager.clearAll();
}

function showGameHelp() {
	showAlert(
		'<span style="color:blue; font-size: 100px;">HELP</span><br>'+
		'<span style="font-size: 20px;">Currently, Zombit is a roguelike shooter where the goal is to score as many points as possible.  '+
		'As of right now, there is no endgame.  Just kill zombies, find loot, and collect weapons.<br><br>'+
		'When the game starts, you have 20 seconds until zombies begin to spawn.  Use this time to collect weapons that have been dropped conveniently '+
		'on floors.  Zombies sometimes become inexplicably confused, but they can surround you, so be careful and don\'t get caught reloading!'+
		'<br><br>'+
		'<span style="font-size: 40px;">Controls:</span>'+
		'<span style="font-size: 18px;"><br>'+
		'<b>Movement:</b> WASD<br>'+
		'<b>Shoot/Use:</b> Left mouse<br>'+
		'<b>Switch item:</b> Scroll/Number keys<br>'+
		'<b>Drop item:</b> Q<br>'+
		'<b>Pause Game:</b> ESC<br>'+
		'</span></span>'
	,function(){},window.innerWidth*(3/4),window.innerHeight*(3/4));
}

function showScorescreen() {
	showAlert(
		'<span style="color:red; font-size: 100px;">YOU DIED.</span><br>'+
		'<span style="font-size: 40px;">You acquired <span style="color: green;">'+gameScore+'</span> points before being slain.</span><br>'
	,function(){},window.innerWidth*(3/4),window.innerHeight*(3/4));
}

function loadScripts() {
	include("encode64.js");
	include("klass.js");
	include("utils.js");
	include("interface.js");
	include("level/LevelCache.js");
	include("level/level.js");
	include("level/Tile.js");
	include("main.js");
	include("entities/EntityManager.js");
	include("level/Pathfinder.js");
	include("render.js");
	include("caster.js");
	include("light.js");
	include("res.js");
	include("audio.js");
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

	//fix for high density screens
	if (devicePixelRatio && devicePixelRatio > 1) {
		var transx = screenWidth*0.5,
			transy = screenHeight*0.5;
		var sc = (1/devicePixelRatio).toFixed(2);
		canvas.style["webkit-transform"] = canvas.style["transform"] = "scale("+sc+","+sc+") " +
		"translate(-"+transx.toFixed(0)+"px,-"+transy.toFixed(0)+"px)";
	}

	canvas.style.cursor = "none";
	canvContainer.appendChild(canvas);
	sctx = canvas.getContext("2d"); //screen context, shouldn't be draw onto usually

	//create invisible buffer canvas
	buffer = document.createElement("canvas");
	buffer.width = viewWidth;
	buffer.height = viewHeight;
	ctx = buffer.getContext("2d"); //buffer context

	//create blood/fx buffer
	fxbuffer = document.createElement("canvas");
	fxbuffer.width = viewWidth;
	fxbuffer.height = viewHeight;
	fxctx = fxbuffer.getContext("2d"); //buffer context

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
	gameTime++;
	time = performance.now();
	//console.log("d "+(time-prevtime));
	tdelta = (time-prevtime)/(1000/targetFPS);
	//console.log("e "+delta);

	//monitor framerate
	var thisFrameTime = (thisLoop=time) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
	fps = (1000/frameTime).toFixed(1);

	if (dmode === GAME) {
		processStep(tdelta);
		entityManager.step();

		//clip viewport position
		if (viewX<0) {viewX = 0;}
		if (viewX>gameLevel.getWidth()*tileWidth-viewWidth) {viewX = gameLevel.getWidth()*tileWidth-viewWidth;}
		if (viewY<0) {viewY = 0;}
		if (viewY>gameLevel.getHeight()*tileHeight-viewHeight) {viewY = gameLevel.getHeight()*tileHeight-viewHeight;}
	}

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

function giveZedGun() {
	player.inv.push(new ZombieGun());
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
