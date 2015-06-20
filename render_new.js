"use strict";

//output settings
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

//viewport settings
var outputScale = 3;
var viewWidth = screenWidth/outputScale;
var viewHeight = screenHeight/outputScale;
var viewX = 0;
var viewY = 0;
var viewRange = 0.5;

var noiseCanvas;
var noiseCtx;
var noiseWidth = 128;
var noiseHeight = 128;
var noiseIntensity = 50;
var noiseData;

var particles = [];

var INTRO=0,GAME=1,MENU=2;
var dmode = INTRO;

var UI_UP=0, UI_HOVER=1, UI_DOWN=2;
var uiPlayState=UI_UP, uiHelpState=UI_UP;

var intime = null;
var showDebug = true, drawParticles = true, drawOverlay = true, tileShadows = true, entityShadows = true, enableLightRendering = true, enableLightTinting = true, enableGlare = true;
var defaultFrameBlend = 0.95, minFrameBlend = 0.4, frameBlend = defaultFrameBlend;

var renderLocked = false;
function render() {
	if (!renderLocked) {
		switch (dmode) {
			case INTRO:
			break;

			case MENU:
			break;

			case GAME:
				//clear screen
				ctx.fillStyle = "black";
				ctx.fillRect(0,0,screenWidth,screenHeight);
				ctx.font = "12px \"uni\"";

				//render level
				drawLevel(DEPTH_ZERO);
				if (tileShadows) {
					drawLevel(DEPTH_ONE);
				}
				drawLevel(DEPTH_TWO);

				//render particles
				for (var ec = 0; ec<particles.length; ec++) {
					var e = particles[ec];
					if (e instanceof Particle && e.depth >= 0) {
						if (e.x>viewX &&
							e.x<viewX+viewWidth &&
							e.y>viewY &&
							e.y<viewY+viewHeight) {
							e.render(
								(e.x-viewX)*outputScale,
								(e.y-viewY)*outputScale
							);
						}
					}
				}

				//render entities
				for (var depth=1; depth>=-1; depth--) {
					for (var i=0; i<entityManager.length(); i++) {
						var e = entityManager.get(i);
						if (e instanceof Entity) {
							if (e.x>viewX &&
								e.x<viewX+viewWidth &&
								e.y>viewY &&
								e.y<viewY+viewHeight) {
								e.render(
									(e.x-viewX),
									(e.y-viewY)
								);
							}
						}
					}
				}

				//render particles
				for (var ec = 0; ec<particles.length; ec++) {
					var e = particles[ec];
					if (e instanceof Particle && e.depth < 0) {
						if (e.x>viewX &&
							e.x<viewX+viewWidth &&
							e.y>viewY &&
							e.y<viewY+viewHeight) {
							e.render(
								(e.x-viewX)*outputScale,
								(e.y-viewY)*outputScale
							);
						}
					}
				}

				//render lighting
				renderLight2();

				//draw inventory GUI
				drawInventory(player.inv);

				//draw healthbar
				drawHealthbar();

				//draw injury effects
		        //calculate blurriness
		        frameBlend = Math.min(defaultFrameBlend,xexp((player.life/player.maxlife),defaultFrameBlend)+minFrameBlend);
		        //draw blood overlay
		        var mult = player.life/player.maxlife, scaleAmt = 80;
		        ctx.globalAlpha = 1-xexp(mult,1);
				ctx.drawImage(
					Resources.image.screenBlood,
					(-mult*0.5*scaleAmt)*outputScale,
					(-mult*0.5*scaleAmt)*outputScale,
					(viewWidth+mult*scaleAmt)*outputScale,
					(viewHeight+mult*scaleAmt)*outputScale
		        );
		        ctx.globalAlpha = 1;

				//draw overlay
				if (drawOverlay) {
					ctx.drawImage(
						Resources.image.overlay,
						0,
						0,
						screenWidth,
						screenHeight
					);
				}

				//draw fps
				if (showDebug) {
					drawDebug();
				}

				//draw multiplayer overlays and stuff
				drawMultiplayer();

				//generate noise overlay
				createNoise(noiseIntensity);
				for (var x=0, w=~~(screenWidth/noiseWidth)+1; x<w; x++) {
					for (var y=0, h=~~(screenHeight/noiseHeight)+1; y<h; y++) {
						ctx.drawImage(noiseCanvas,x*noiseWidth,y*noiseHeight);
					}
				}
			break;
		}

		//copy buffer to screen at proper scale
		sctx.globalAlpha = frameBlend;
		sctx.drawImage(buffer,0,0,screenWidth,screenHeight);
		sctx.globalAlpha = 1;

		renderLocked = false;

		//request another frame
		requestAnimFrame(render);
	}
}

var DEPTH_ZERO=0, DEPTH_ONE=1, DEPTH_TWO=2;
function drawLevel(depth) {
	var w = gameLevel.getWidth(),
		h = gameLevel.getHeight();

	for (var x=~~(viewX/tileWidth); x<~~((viewX+viewWidth)/tileWidth)+1; x++) {
		for (var y=~~(viewY/tileHeight); y<~~((viewY+viewHeight)/tileHeight)+1; y++) {
			var outX = ~~((x*tileWidth-viewX)),
				outY = ~~((y*tileWidth-viewY));

			var tile = gameLevel.getTile(x,y);
			switch (depth) {
				case DEPTH_ZERO:
					if (tile.depth === DEPTH_ZERO) {
						drawTile(tile,outX,outY);
					}
				break;

				case DEPTH_ONE:
					if (tile.solid) {
						var tl = gameLevel.getTile(x-1,y);
						var tt = gameLevel.getTile(x,y-1);
						var tr = gameLevel.getTile(x+1,y);
						var tb = gameLevel.getTile(x,y+1);

						var offset = ~~((Resources.image.borderTop.width-tileWidth*outputScale)/(2));
						if (tl instanceof Tile && tl.id != tile.id) {ctx.drawImage(Resources.image.borderLeft, outX-offset, outY-offset);}
						if (tt instanceof Tile && tt.id != tile.id) {ctx.drawImage(Resources.image.borderTop, outX-offset, outY-offset);}
						if (tr instanceof Tile && tr.id != tile.id) {ctx.drawImage(Resources.image.borderRight, outX-offset, outY-offset);}
						if (tb instanceof Tile && tb.id != tile.id) {ctx.drawImage(Resources.image.borderBottom, outX-offset, outY-offset);}
					}

					if (tile.depth === DEPTH_ONE) {
						drawTile(tile,outX,outY);
					}
				break;

				case DEPTH_TWO:
					if (tile.depth === DEPTH_TWO) {
						drawTile(tile,outX,outY);
					}
				break;
			}
		}
	}
}

function drawTile(tile, x, y) {
	if (tile instanceof Tile) {
		ctx.drawImage(tileImage(tile.id), x, y);
	}
}

function drawInventory(inv) {
	ctx.fillStyle = "rgba(234,240,90,0.3)";
	for (var i=0; i<inv.size; i++) {
		var item = inv.get(i);
		if (item !== null) {
			ctx.strokeStyle = i==inv.selected?"white":"rgba(244,250,60,0.6)"; //selected slots are white outlined

			//draw the icon for this item
			var bx = viewWidth-128-(18*(inv.size-i));
			ctx.fillRect(bx,4,16,16);
			ctx.strokeRect(bx,4,16,16);
			if (item.icon) {
			ctx.drawImage(item.icon, bx, 4);
			}
		}
	}

	//draw selected item GUI
	ctx.fillStyle = "rgba(234,240,90,0.3)";
	ctx.strokeStyle = "rgba(244,250,60,0.6)";
	ctx.fillRect(viewWidth-126,4,112,25);
	ctx.strokeRect(viewWidth-126,4,112,25);

	ctx.fillStyle = "rgba(255,255,255,1)";
	var ii = inv.getSelected();
	ctx.font = '9px "uni"';
	ctx.fillText(ii.name,viewWidth-118,13);

	ctx.font = '12px "uni"';
	if (ii instanceof Gun) {
		ctx.fillStyle=ii.ammo!=0 && ii.ammo!="R"?"white":"red";
		ctx.fillText("A: "+ii.ammo,viewWidth-118,25);
	}
}

function drawHealthbar() {
	ctx.fillStyle = "rgba(234,20,53,0.5)";
	ctx.fillRect(viewWidth-128-(18*(player.inv.size)),22,18*(player.inv.size),8);
	ctx.fillStyle = "rgba(20,230,53,1)";
	ctx.fillRect(viewWidth-128-(18*(player.inv.size)),22,18*(player.inv.size)*(player.life/100),8);
	ctx.font = '8px "uni"';
	ctx.fillStyle = "white";
	ctx.fillText(player.life.toFixed(0),(viewWidth-128-(18*(player.inv.size)*0.5)-5),28);
}

function drawDebug() {
	ctx.font = '8px monospace';
	ctx.fillStyle = "white";
	ctx.fillText("FPS: "+(~~fps),4,16);
	ctx.fillText("Delta: "+(tdelta.toFixed(1)),4,26);
	ctx.fillText("Facing: "+(player.facing.toFixed(1)),4,36);
}

function drawMultiplayer() {
	if (mpChatOpen) {
		ctx.fillStyle = "rgba(0,0,0,0.7)";
		ctx.fillRect(8,viewHeight-24,viewWidth-16,16);

		ctx.font = '14px "uni"';
		ctx.fillStyle = "white";
		ctx.fillText(mpTypedChat,10,viewHeight-12);
	}

	if (mpChatOpen || new Date().getTime()-mpLastMessageTime<mpMessageFadeTime) {
		var msgOpacity = mpChatOpen?1:1-(new Date().getTime()-mpLastMessageTime)/mpMessageFadeTime;
		ctx.fillStyle = "rgba(255,255,255,"+msgOpacity.toFixed(2)+")";
		ctx.font = '8px "uni"';
		for (var i=0; i<mpMessages.length; i++) {
			ctx.fillText(mpMessages[i],8,viewHeight-28-10*i);
		}
	}

	if (mpActive && !mpReady) {
		ctx.fillStyle = "rgba(0,0,0,0.5)";
		ctx.fillRect(0,0,viewWidth,viewHeight);

		ctx.fillRect(0,viewHeight/2-24,viewWidth,48);
		var txt = mpConnected?"Loading level...":"Connecting...";

		ctx.font = '24px "uni"';
		ctx.textAlign = 'center';
		ctx.fillStyle = "white";
		ctx.fillText(txt,viewWidth/2,viewHeight/2);
		ctx.textAlign = 'left';
	}
}



function strokeEllipse(ctx, x, y, w, h) {
	var kappa = .5522848,
	ox = (w / 2) * kappa, // control point offset horizontal
	oy = (h / 2) * kappa, // control point offset vertical
	xe = x + w,           // x-end
	ye = y + h,           // y-end
	xm = x + w / 2,       // x-middle
	ym = y + h / 2;       // y-middle

	ctx.beginPath();
	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	ctx.closePath();
	ctx.stroke();
}

function createNoise(intensity) {
	var data = noiseData.data;
	for (var i=0; i<noiseWidth*noiseHeight*4; i+=4) {
		data[i+2] = data[i+1] = data[i] = 0;
		data[i+3] = (~~(Math.random()*intensity));
	}
	noiseCtx.putImageData(noiseData,0,0);
}
