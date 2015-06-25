//output settings
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var defaultScreenWidth = screenWidth;
var defaultScreenHeight = screenHeight;

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
var noiseIntensity = 0;
var noiseData;

var INTRO=0,GAME=1,MENU=2;
var dmode = INTRO;
var intime = null;
var showDebug = false, drawParticles = true, drawOverlay = true, tileShadows = true, entityShadows = true, enableLightRendering = true, enableLightTinting = true, enableGlare = true;
var defaultFrameBlend = 0.95, minFrameBlend = 0.4, frameBlend = defaultFrameBlend;

var enablePathDebug = false;

//ui states
var UI_UP=0, UI_HOVER=1, UI_DOWN=2;
var uiPlayState=UI_UP, uiHelpState=UI_UP;

//advanced shader data
var od,out;

//particles
var particles = [];

var renderLocked = false;
function render() {
    if (!renderLocked) { //if the level is not currently being rendered
        renderLocked = true; //lock

        if (dmode==GAME) {

            //clear screen
            ctx.fillStyle = "black";
            ctx.fillRect(0,0,viewWidth,viewHeight);

            ctx.font = '12px "uni"';

            //render the tiles
            drawgameLevel(0);
            if (tileShadows) {drawgameLevel(1);}

            updateFxBuffer();
            ctx.drawImage(fxbuffer,_fxb_offsetX,_fxb_offsetY);

            drawgameLevel(2);


            //render particles (they're entities, but they must be drawn below the others)
            if (drawParticles) {
                for (var ec = 0; ec<particles.length; ec++) {
                    var prt = particles[ec];
                    if (prt instanceof Particle && prt.depth>=0) {
                        if (prt.x>viewX && prt.x<viewX+viewWidth && prt.y>viewY && prt.y<viewY+viewHeight) {
                            prt.render(prt.x-viewX,prt.y-viewY);
                        }
                    }
                }
            }

            //render the entities
            for (var ec = 0; ec<entityManager.length(); ec++) {
                var ent = entityManager.get(ec);
                if (ent instanceof Entity) {
                    if (ent.x>viewX && ent.x<viewX+viewWidth && ent.y>viewY && ent.y<viewY+viewHeight) {
                        ent.render(ent.x-viewX,ent.y-viewY);
                    }
                }
            }

            if (drawParticles) {
                for (var ec = 0; ec<particles.length; ec++) {
                    var prt = particles[ec];
                    if (prt instanceof Particle && prt.depth<0) {
                        if (prt.x>viewX && prt.x<viewX+viewWidth && prt.y>viewY && prt.y<viewY+viewHeight) {
                            prt.render(prt.x-viewX,prt.y-viewY);
                        }
                    }
                }
            }

            //render lighting
            renderLight2();

            //draw inventory GUI
            ctx.fillStyle = "rgba(234,240,90,0.3)";
            for (var i=0; i<player.inv.size; i++) {
                var item = player.inv.get(i);
                if (item!==null) {
                    ctx.strokeStyle = i==player.inv.selected?"white":"rgba(244,250,60,0.6)"; //selected slots are white outlined

                    //draw the icon for this item
                    var bx = viewWidth-128-(18*(player.inv.size-i));
                    ctx.fillRect(bx,4,16,16);
                    ctx.strokeRect(bx,4,16,16);
                    if (item.icon) {
                        ctx.drawImage(item.icon, bx, 4);
                    }
                }
            }

            //draw healthbar
            ctx.fillStyle = "rgba(234,20,53,0.5)";
            ctx.fillRect(viewWidth-128-(18*(player.inv.size)),22,18*(player.inv.size),8);
            ctx.fillStyle = "rgba(20,230,53,1)";
            ctx.fillRect(viewWidth-128-(18*(player.inv.size)),22,18*(player.inv.size)*(player.life/100),8);
            ctx.font = '8px "uni"';
            ctx.fillStyle = "white";
            ctx.fillText(player.life.toFixed(0),(viewWidth-128-(18*(player.inv.size)*0.5)-5),28);

            //draw selected item GUI
            ctx.fillStyle = "rgba(234,240,90,0.3)";
            ctx.strokeStyle = "rgba(244,250,60,0.6)";
            ctx.fillRect(viewWidth-126,4,112,25);
            ctx.strokeRect(viewWidth-126,4,112,25);

            ctx.fillStyle = "rgba(255,255,255,1)";
            var ii = player.inv.getSelected();
            ctx.font = '9px "uni"';
            ctx.fillText(ii.name,viewWidth-118,13);

            ctx.font = '12px "uni"';
            if (ii instanceof Gun) {
                ctx.fillStyle=ii.ammo!==0 && ii.ammo!="R"?"white":"red";
                ctx.fillText("A: "+ii.ammo,viewWidth-118,25);
            }

            //draw score
            ctx.fillStyle = "rgba(234,240,90,0.3)";
            ctx.strokeStyle = "rgba(244,250,60,0.6)";
            ctx.fillRect(viewWidth/2-40,viewHeight-24,80,20);
            ctx.strokeRect(viewWidth/2-40,viewHeight-24,80,20);

            ctx.font = '13px "uni"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";
            ctx.fillText(gameScore,viewWidth/2,viewHeight-10);
            ctx.textAlign = 'left';

            //health effects
            //calculate blurriness
            frameBlend = Math.min(defaultFrameBlend,xexp((player.life/player.maxlife),defaultFrameBlend)+minFrameBlend);
            //draw blood overlay
            var mult = player.life/player.maxlife, scaleAmt = 80;
            ctx.globalAlpha = 1-xexp(mult,1);
            ctx.drawImage(imgScreenBlood,-mult*0.5*scaleAmt,-mult*0.5*scaleAmt,viewWidth+mult*scaleAmt,viewHeight+mult*scaleAmt);
            ctx.globalAlpha = 1;

            //draw overlay
            if (drawOverlay) {ctx.drawImage(imgOverlay,0,0,viewWidth,viewHeight);}

            //apply shaders
            if (enableShaders===true) {xshader(xsfx);}

            //draw fps
            if (showDebug) {
                ctx.font = '8px monospace';
                ctx.fillStyle = "white";
                ctx.fillText("FPS: "+(~~fps),4,16);
                ctx.fillText("Delta: "+(tdelta.toFixed(1)),4,26);
                ctx.fillText("Facing: "+(player.facing.toFixed(1)),4,36);
                ctx.fillText("Zombies: "+(Zombie.count),4,46);
            }

            //draw chat overlay
            if (mpChatOpen) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(8,viewHeight-24,viewWidth-16,16);

                ctx.font = '14px "uni"';
                ctx.fillStyle = "white";
                ctx.fillText(mpTypedChat,10,viewHeight-12);
            }

            //draw chat messages
            if (mpChatOpen || new Date().getTime()-mpLastMessageTime<mpMessageFadeTime) {
                var msgOpacity = mpChatOpen?1:1-(new Date().getTime()-mpLastMessageTime)/mpMessageFadeTime;
                ctx.fillStyle = "rgba(255,255,255,"+msgOpacity.toFixed(2)+")";
                ctx.font = '8px "uni"';
                for (var i=0; i<mpMessages.length; i++) {
                    ctx.fillText(mpMessages[i],8,viewHeight-28-10*i);
                }
            }

            //draw multiplayer overlay
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

            if (gamePaused) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0,0,viewWidth,viewHeight);
                ctx.font = '40px "uni"';
                ctx.textAlign = 'center';
                ctx.fillStyle = "red";

                ctx.fillText("PAUSED",viewWidth/2,96);
                ctx.font = '20px "uni"';
                ctx.fillStyle = "white";
                ctx.fillText("ESC TO CONTINUE",viewWidth/2,128);
                ctx.fillText("X TO EXIT",viewWidth/2,148);

                ctx.textAlign = 'left';
            }

            createNoise(noiseIntensity);
            for (var x=0, w=~~(viewWidth/noiseWidth)+1; x<w; x++) {
                for (var y=0, h=~~(viewHeight/noiseHeight)+1; y<h; y++) {
                    ctx.drawImage(noiseCanvas,x*noiseWidth,y*noiseHeight);
                }
            }
        }
        else if (dmode==INTRO) {
            if (intime==null) {intime=new Date().getTime();}
            var delta = new Date().getTime()-intime;

            //clear screen
            ctx.fillStyle = "rgb(40,36,38)";
            ctx.fillRect(0,0,viewWidth,viewHeight);

            ctx.font = '12px "uni"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";

            var vpos = viewHeight/2-100;

            ctx.font = '40px "uni"';
            ctx.fillText("Zombit",viewWidth/2,30+vpos);

            if (delta>750) {
                ctx.fillStyle = "lightgray";
                ctx.font = '13px "uni"';
                ctx.fillText("Programming & Design by",viewWidth/2,70+vpos);
                ctx.fillStyle = "white";
                ctx.font = '22px "uni"';
                ctx.fillText("Nondefault",viewWidth/2,90+vpos);
            }

            if (delta>1500) {
                ctx.fillStyle = "lightgray";
                ctx.font = '13px "uni"';
                ctx.fillText("Graphics & Additional Programming by",viewWidth/2,110+vpos);
                ctx.fillStyle = "white";
                ctx.font = '22px "uni"';
                ctx.fillText("Sachittome",viewWidth/2,130+vpos);
            }

            if (delta>2250) {
                ctx.fillStyle = "lightgray";
                ctx.font = '9px "uni"';
                ctx.fillText("Music by",viewWidth/2,150+vpos);
                ctx.fillStyle = "white";
                ctx.font = '15px "uni"';
                ctx.fillText("Sycamore Drive",viewWidth/2,165+vpos);
                ctx.font = '12px "uni"';
                ctx.fillText("http://sycamoredrive.co.uk/",viewWidth/2,180+vpos);
            }

            ctx.textAlign = 'left';
        }
        else if (dmode==MENU) {
            ctx.fillStyle = "rgb(40,36,38)";
            ctx.fillRect(0,0,viewWidth,viewHeight);
            ctx.font = '24px "uni"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";

            for (var x=-200+Math.sin(gameTime/400)*200; x<viewWidth; x+=tileWidth) {
                for (var y=-160+Math.sin(gameTime/200)*160; y<viewHeight; y+=tileWidth) {
                    ctx.drawImage(images[5], ~~x, ~~y);
                }
            }

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(0,0,viewWidth,viewHeight);
            ctx.drawImage(imgOverlay,0,0,viewWidth,viewHeight);

            ctx.drawImage(imgTitle,viewWidth/2-imgTitle.width/4,20,imgTitle.width/2,imgTitle.height/2);

            ctx.fillStyle = uiPlayState===UI_HOVER?"yellow":"white";
            ctx.fillText("PLAY",viewWidth/2,140);

            ctx.fillStyle = uiHelpState===UI_HOVER?"yellow":"white";
            ctx.fillText("HELP",viewWidth/2,170);

            ctx.fillStyle = "white";
            ctx.font = '8px "uni"';
            ctx.textAlign = "right";
            ctx.fillText("nondefault.net",viewWidth-8, viewHeight-8);

            ctx.textAlign = 'left';
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

function drawgameLevel(mode) {
    var w = gameLevel.getWidth();
    var h = gameLevel.getHeight();

    //loop through portion of gameLevel within view
    var chunkSize = gameLevel.cache.size;
    var incr = mode === 0 ? chunkSize : 1;
    var initialX = ~~(viewX/tileWidth),
        initialY = ~~(viewY/tileHeight),
        finalX = ~~((viewX+viewWidth)/tileWidth)+1,
        finalY = ~~((viewY+viewHeight)/tileHeight)+1;
    if (mode === 0) { //correct drawing bounds for chunks
        initialX -= initialX%chunkSize;
        initialY -= initialY%chunkSize;
        finalX += chunkSize - finalX%chunkSize;
        finalY += chunkSize - finalY%chunkSize;
    }
    for (var x=initialX; x<finalX; x+=incr) {
        for (var y=initialY; y<finalY; y+=incr) {
            var sx = ~~(x*tileWidth-viewX); //pixel x
            var sy = ~~(y*tileHeight-viewY); //pixel y

            var tile = gameLevel.getTile(x,y); //get the tile at this position
            if (!mode || mode===0) { //normal rendering
                ctx.drawImage(gameLevel.cache.getChunk(x,y), sx, sy);
                //drawtile(tile,sx,sy);
                if (enablePathDebug) {
                    var dx = playerPathfinder.getDirection(x,y);
                    if (dx !== null) {
                        var cx = sx+tileWidth*0.5,
                        cy = sy+tileHeight*0.5;
                        ctx.fillStyle = "red";
                        ctx.fillRect(cx-1, cy-1, 2, 2);
                        ctx.fillStyle = "lime";
                        ctx.fillRect(cx+2*dx[0]-1,cy+2*dx[1]-1,2,2);
                    }
                }
            }
            else if (mode==1) { //border rendering
                if (tile.solid) {
                    var tl = gameLevel.getTile(x-1,y);
                    var tt = gameLevel.getTile(x,y-1);
                    var tr = gameLevel.getTile(x+1,y);
                    var tb = gameLevel.getTile(x,y+1);

                    var offset = ~~((imgBorderTop.width-tileWidth)/2);
                    if (tl && tl.id != tile.id) {ctx.drawImage(imgBorderLeft, sx-offset, sy-offset);}
                    if (tt && tt.id != tile.id) {ctx.drawImage(imgBorderTop, sx-offset, sy-offset);}
                    if (tr && tr.id != tile.id) {ctx.drawImage(imgBorderRight, sx-offset, sy-offset);}
                    if (tb && tb.id != tile.id) {ctx.drawImage(imgBorderBottom, sx-offset, sy-offset);}
                }

                if (tile.depth==1) {
                    drawtile(tile,sx,sy);
                }
            }
            else if (mode==2) {
                if (tile.depth==2) {
                    drawtile(tile,sx,sy);
                }
            }
            else if (mode==3) { //shadow rendering
                var tile = gameLevel.getTile(x,y); //get the tile at this position
                if (tile.solid) {
                    var tl = gameLevel.getTile(x-1,y);
                    var tt = gameLevel.getTile(x,y-1);
                    var tr = gameLevel.getTile(x+1,y);
                    var tb = gameLevel.getTile(x,y+1);

                    var offset = ~~((imgBlockShadow.width-tileWidth)/2);
                    if (tl.id != tile.id || tt.id != tile.id || tr.id != tile.id || tb.id != tile.id) {ctx.drawImage(imgBlockShadow, sx-offset, sy-offset);}
                }
            }
        }
    }
}

function drawtile(tile,x,y) {
    if (tile!=null) {
        var tid = tile.id;
        if (tid!=null) {
            //ctx.strokeStyle = "white";
            //ctx.strokeRect(x,y,16,16);
            ctx.drawImage(tileImage(tid), x, y);
        }
    }
}

//color indexes
function ri(x,y) {return ((x)+(y)*viewWidth)*4+0;}
function gi(x,y) {return ((x)+(y)*viewWidth)*4+1;}
function bi(x,y) {return ((x)+(y)*viewWidth)*4+2;}
function ai(x,y) {return ((x)+(y)*viewWidth)*4+3;}

function colLevel(col,min,max) {
    return (col/255)*max+min;
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
        data[i+3] = ifrand(intensity);
    }
    noiseCtx.putImageData(noiseData,0,0);
}

var _fxb_lx, _fxb_ly;
var _fxb_offsetX=0, _fxb_offsetY=0;
var _fxb_canvas, _fxb_ctx;
function updateFxBuffer() {
    if (typeof _fxb_lx === "undefined") {
        _fxb_lx = viewX;
        _fxb_ly = viewY;
        _fxb_canvas = document.createElement("canvas");
        _fxb_canvas.width = fxbuffer.width;
        _fxb_canvas.height = fxbuffer.height;
        _fxb_ctx = _fxb_canvas.getContext("2d");
        return;
    }
    else {
        var dx = viewX - _fxb_lx,
            dy = viewY - _fxb_ly;

        var movx = Math.round(dx),
            movy = Math.round(dy);

        _fxb_ctx.clearRect(0,0,_fxb_canvas.width,_fxb_canvas.height); //clear buffer
        _fxb_ctx.drawImage(fxbuffer,0,0); //store display data in buffer
        fxctx.clearRect(0,0,fxbuffer.width,fxbuffer.height); //clear display
        fxctx.drawImage(_fxb_canvas,-movx,-movy); //copy buffer to display

        _fxb_offsetX = (dx-movx);
        _fxb_offsetY = (dy-movy);
        _fxb_lx = viewX-_fxb_offsetX;
        _fxb_ly = viewY-_fxb_offsetY;
    }
}
