//output settings
var screenWidth = window.innerWidth * (devicePixelRatio ? devicePixelRatio : 1);
var screenHeight = window.innerHeight * (devicePixelRatio ? devicePixelRatio : 1);
var defaultScreenWidth = screenWidth;
var defaultScreenHeight = screenHeight;

var outrunPalette = [new Color("#D7F522"), new Color("#D43017"), new Color("#07D9D5")];
var titlePalette = [new Color("#1C141C"), new Color("#D43017"), new Color("#541D54")];
var lightsPalette = [new Color("#D43017"), new Color("#07D9D5")];
var textPalette = [new Color("#D7F522"), new Color("#D43017")];

//viewport settings
var outputScale = 3;
var viewWidth = screenWidth/outputScale;
var viewHeight = screenHeight/outputScale;
var viewX = 0;
var viewY = 0;
var viewTargetX = 0;
var viewTargetY = 0;
var viewRange = 0.5;

var noiseCanvas;
var noiseCtx;
var noiseWidth = 64;
var noiseHeight = 64;
var noiseIntensity = 100;
var noiseData;

var INTRO=0,GAME=1,MENU=2;
var dmode = INTRO;
var intime = null;
var showDebug = false, drawParticles = true, drawOverlay = true, tileShadows = true, entityShadows = true, enableLightRendering = true, enableLightTinting = true, enableGlare = true;
var defaultFrameBlend = 0.95, minFrameBlend = 0.4, frameBlend = defaultFrameBlend;
var FADE_IN_TIME = 120;
var fpsUpdateTimer = 0, fpsDisplayValue = 0;

var enablePathDebug = false;

var solidRenderedBlocks = [];
var introTimeout = false;

//ui states
var UI_UP=0, UI_HOVER=1, UI_DOWN=2;
var uiPlayState=UI_UP, uiHelpState=UI_UP;

//advanced shader data
var od,out;

//particles
var particles = [];

var Shake = {
    rx: null,
    ry: null,
    magnitude: 70,
    out: {
        x: 0,
        y: 0
    },
    intensity: 0,
    init: function() {
        Shake.rx = new SmoothRandom(1000);
        Shake.ry = new SmoothRandom(1000);
    },
    shake: function(intensity) {
        Shake.intensity = Math.min(1, Shake.intensity+intensity);
    },
    step: function() {
        Shake.intensity *= 0.47;
        if (Shake.intensity*Shake.magnitude < 1) Shake.intensity = 0;
        Shake.rx.offset(Shake.intensity*8+1);
        Shake.ry.offset(Shake.intensity*8+1);
        Shake.out = {
            x: (Shake.rx.next()-0.5)*Shake.magnitude*Shake.intensity,
            y: (Shake.ry.next()-0.5)*Shake.magnitude*Shake.intensity
        };
    }
};

var renderLocked = false;
function render() {
    if (!renderLocked) { //if the level is not currently being rendered
        renderLocked = true; //lock

        ////////////////////////////////////////////
        ////////////////////////////////////////////
        if (dmode==GAME) {
            Shake.step();
            viewX = viewTargetX + Shake.out.x;
            viewY = viewTargetY + Shake.out.y;

            //clear screen
            ctx.fillStyle = "black";
            ctx.fillRect(0,0,viewWidth,viewHeight);

            ctx.font = '12px "volter"';

            //render the tiles
            drawgameLevel(0);
            if (tileShadows) {drawgameLevel(1);}

            updateFxBuffer();
            ctx.drawImage(fxbuffer,_fxb_offsetX,_fxb_offsetY);

            drawgameLevel(2);

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
                    if (prt instanceof Particle) {
                        if (prt.x>viewX && prt.x<viewX+viewWidth && prt.y>viewY && prt.y<viewY+viewHeight) {
                            prt.render(prt.x-viewX,prt.y-viewY);
                        }
                    }
                }
            }

            //render lighting
            renderLight2();

            //draw inventory GUI
            for (var i=0; i<player.inv.size; i++) {
                var item = player.inv.get(i);
                if (item!==null) {
                    var sel = i==player.inv.selected;
                    ctx.fillStyle = outrunPalette[0].addHSL(0,sel?-0.1:0.0,sel?0.2:0.0).setAlpha(0.3);
                    ctx.strokeStyle = sel?"white":outrunPalette[0].setAlpha(0.6); //selected slots are white outlined

                    //draw the icon for this item
                    var bx = viewWidth-140-(20*(player.inv.size-i));
                    ctx.fillRect(bx,sel?6:8,16,sel?18:16);
                    ctx.strokeRect(bx,sel?6:8,16,sel?18:16);
                    if (item.icon) {
                        ctx.drawImage(item.icon, bx, 8);
                    }
                }
            }

            //draw healthbar
            ctx.fillStyle = outrunPalette[1].setAlpha(0.5);
            ctx.fillRect(viewWidth-140-(20*(player.inv.size)),26,20*(player.inv.size)-4,8);
            ctx.fillStyle = outrunPalette[2].setAlpha(0.5);
            ctx.fillRect(viewWidth-140-(20*(player.inv.size)),26,20*(player.inv.size)*(player.life/100)-4,8);
            ctx.font = '8px "volter"';
            ctx.fillStyle = "white";
            ctx.fillText(player.life.toFixed(0),~~(viewWidth-140-(20*(player.inv.size)*0.5)-5),32);

            //draw selected item GUI
            ctx.fillStyle = outrunPalette[0].setAlpha(0.3);
            ctx.strokeStyle = outrunPalette[0].setAlpha(0.6);
            ctx.fillRect(viewWidth-135,8,112,25);
            ctx.strokeRect(viewWidth-135,8,112,25);

            ctx.fillStyle = "rgba(255,255,255,1)";
            var ii = player.inv.getSelected();
            ctx.font = '9px "volter"';
            ctx.fillText(ii.name,~~(viewWidth-127),17);

            ctx.font = '12px "volter"';
            if (ii instanceof Gun) {
                ctx.fillStyle=ii.ammo!==0 && ii.ammo!="R"?"white":"red";
                ctx.fillText("A: "+ii.ammo,~~(viewWidth-127)+0.5,29);
            }

            //draw score
            ctx.fillStyle = outrunPalette[0].setAlpha(0.3);
            ctx.strokeStyle = outrunPalette[0].setAlpha(0.6);
            ctx.fillRect(viewWidth/2-40,viewHeight-24,80,20);
            ctx.strokeRect(viewWidth/2-40,viewHeight-24,80,20);

            ctx.font = '13px "volter"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";
            ctx.fillText(gameScore,viewWidth/2,viewHeight-10);
            ctx.textAlign = 'left';

            //health effects
            //calculate blurriness
            frameBlend = Math.min(defaultFrameBlend,Util.xexp((player.life/player.maxlife),defaultFrameBlend)+minFrameBlend);
            //draw blood overlay
            var mult = player.life/player.maxlife, scaleAmt = 80;
            ctx.globalAlpha = 1-Util.xexp(mult,1);
            ctx.drawImage(imgScreenBlood,-mult*0.5*scaleAmt,-mult*0.5*scaleAmt,viewWidth+mult*scaleAmt,viewHeight+mult*scaleAmt);
            ctx.globalAlpha = 1;

            //draw overlay
            if (drawOverlay) {ctx.drawImage(imgOverlay,0,0,viewWidth,viewHeight);}

            //apply shaders
            if (enableShaders===true) {xshader(xsfx);}

            //draw fps
            if (showDebug) {
                var h=11;
                ctx.font = '9px volter';
                ctx.fillStyle = "white";
                if (++fpsUpdateTimer > 15) {
                    fpsUpdateTimer = 0;
                    fpsDisplayValue = fps;
                }
                ctx.fillText("FPS: "+(fpsDisplayValue.toFixed(1)),4.5,16);
                ctx.fillText("Delta: "+(tdelta.toFixed(2)),4.5,16+h);
                ctx.fillText("Facing: "+(player.facing.toFixed(1)),4.5,16+2*h);
                var i=0;
                for (var key in entityManager.count) {
                    ctx.fillText("#"+key+": "+entityManager.count[key],4.5,16+3*h+h*(i++));
                }
            }

            //draw chat overlay
            if (mpChatOpen) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(8,viewHeight-24,viewWidth-16,16);

                ctx.font = '9px "volter"';
                ctx.fillStyle = "white";
                ctx.fillText(mpTypedChat,10,viewHeight-12);
            }

            //draw chat messages
            if (mpChatOpen || new Date().getTime()-mpLastMessageTime<mpMessageFadeTime) {
                var msgOpacity = mpChatOpen?1:1-(new Date().getTime()-mpLastMessageTime)/mpMessageFadeTime;
                ctx.fillStyle = "rgba(255,255,255,"+msgOpacity.toFixed(2)+")";
                ctx.font = '8px "volter"';
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

                ctx.font = '24px "volter"';
                ctx.textAlign = 'center';
                ctx.fillStyle = "white";
                ctx.fillText(txt,viewWidth/2,viewHeight/2);
                ctx.textAlign = 'left';
            }

            if (gamePaused) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0,0,viewWidth,viewHeight);
                ctx.font = '40px "volter"';
                ctx.textAlign = 'center';
                ctx.fillStyle = "red";

                ctx.fillText("PAUSED",viewWidth/2,96);
                ctx.font = '20px "volter"';
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

            if (gameTime < FADE_IN_TIME) {
                ctx.globalAlpha = 1-gameTime/FADE_IN_TIME;
                ctx.fillStyle = "rgb(10,9,9)";
                ctx.fillRect(0,0,viewWidth,viewHeight);
                ctx.globalAlpha = 1;
            }

            if (Editor.enabled) Editor.drawUI();
        }

        ////////////////////////////////////////////
        ////////////////////////////////////////////
        else if (dmode==INTRO) {
            if (intime==null) {intime=new Date().getTime();}
            var delta = new Date().getTime()-intime;

            var items = [["Programming & Design by", "Nondefault"],["Music by","Mr.Skeltal"],["Graphics by","Canvas2D"]];
            var time0 = 200, dtime = 300, attack=700, hold=4500, lineheight = 50, moveheight = 10, floatheight = 2;
            var tmax = dtime*items.length+attack+hold+time0;

            //clear screen
            var basecol = Color.gradientMix(titlePalette, delta/tmax, true);
            var gradient = ctx.createLinearGradient(0,viewHeight,0,0);
            gradient.addColorStop(0, basecol.addHSL(0,-0.05,-0.1));
            gradient.addColorStop(0.25, basecol.addHSL(0,-0.2,-0.3));
            gradient.addColorStop(1.0, basecol.addHSL(0,-0.3,-0.5));
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,viewWidth,viewHeight);

            ctx.font = '12px "volter"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";

            var vpos = viewHeight/2-100;

            ctx.globalAlpha = Math.min(1, delta/1000);

            var adelt = 1-Math.min(1100, delta)/1100;
            adelt = 1-adelt*adelt;
            var posx = viewWidth/2,
                posy = 20 + 20 - adelt*20;
            ctx.drawImage(imgTitle,posx-imgTitle.width/4,posy,imgTitle.width/2,imgTitle.height/2+Math.sin(gameTime*0.1)*2);



            if (!introTimeout) introTimeout = setTimeout(function(){dmode = MENU;}, tmax);

            items.forEach(function(item,idx){
                if (delta>(time0+=dtime)) {
                    var textcol = Color.gradientMix(textPalette, (delta-time0)*0.001, true);

                    var endtime = (time0+attack),
                        timenow = (delta-time0);

                    adelt = 1-Math.min(attack, timenow)/attack;
                    adelt = 1-adelt*adelt;

                    var floatval = Math.sin((delta-idx*dtime*0.5)*0.008)*floatheight;

                    ctx.globalAlpha = Math.min(1, timenow/endtime) - (delta>=time0+hold ? Math.min(1,(delta-hold)/endtime) : 0);
                    // ctx.shadowOffsetX = floatval;
                    // ctx.shadowColor = textcol.addHSL(0.5,0,0);
                    ctx.fillStyle = textcol.addHSL(0,0,-0.2);
                    ctx.font = '9px "volter"';
                    ctx.fillText(item[0],posx, posy + imgTitle.height/2 + lineheight*idx - adelt*moveheight + moveheight + floatval);
                    ctx.fillStyle = textcol;
                    ctx.font = '27px "volter"';
                    ctx.fillText(item[1],posx, posy + imgTitle.height/2 + 23 + lineheight*idx - adelt*moveheight + moveheight + floatval);
                    // ctx.shadowOffsetX = 0;
                }
            });

            ctx.globalAlpha = 1;

            ctx.textAlign = 'left';
        }

        ////////////////////////////////////////////
        ////////////////////////////////////////////
        else if (dmode==MENU) {
            ctx.fillStyle = "rgb(40,36,38)";
            ctx.fillRect(0,0,viewWidth,viewHeight);
            ctx.font = '24px "volter"';
            ctx.textAlign = 'center';
            ctx.fillStyle = "white";

            var basecol = Color.gradientMix(outrunPalette, gameTime*0.01, true);
            var gradient = ctx.createLinearGradient(0,viewHeight,0,0);
            gradient.addColorStop(0, basecol.addHSL(0,-0.05,-0.1));
            gradient.addColorStop(0.25, basecol.addHSL(0,-0.2,-0.3));
            gradient.addColorStop(1.0, basecol.addHSL(0,-0.3,-0.5));

            ctx.fillStyle = "black";
            ctx.fillRect(0,0,viewWidth,viewHeight);

            var pw = menuLevel.getWidth()*tileWidth;
            var extra = viewWidth-pw;
            for (var xx=0; xx<menuLevel.getWidth()/menuLevel.cache.size; xx++) {
                var tx = Math.floor((xx+extra)/(menuLevel.cache.size*tileWidth));
                ctx.drawImage(menuLevel.cache.arr[xx][0], xx*menuLevel.cache.size*tileWidth+extra*0.5, viewHeight*0.67-menuLevel.cache.size*tileHeight*0.5);
            }

            var dh = Math.abs(Math.sin(gameTime*0.1));
            ctx.drawImage(imgCar, viewWidth*0.5-imgCar.width*0.5, viewHeight*0.67-imgCar.height*0.5+dh, imgCar.width, imgCar.height);

            ctx.globalCompositeOperation = "overlay";
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,viewWidth,viewHeight);
            ctx.globalCompositeOperation = "source-over";

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(0,0,viewWidth,viewHeight);
            ctx.drawImage(imgOverlay,0,0,viewWidth,viewHeight);

            ctx.drawImage(imgTitle,viewWidth/2-imgTitle.width/4,20,imgTitle.width/2,imgTitle.height/2+Math.sin(gameTime*0.1)*2);

            var items = ["PLAY", "HELP"];
            var states = [uiPlayState, uiHelpState];
            items.forEach(function(item,idx){
                var state = states[idx];
                var textcol = Color.gradientMix(textPalette, (gameTime-idx*100)*0.01, true);
                var floatval = Math.sin((gameTime-idx*40)*0.08)*2*(state?2:1);
                ctx.font = (state?"30px":"24px")+" \"volter\"";
                // ctx.shadowOffsetX = floatval;
                // ctx.shadowColor = textcol.addHSL(0.5,0,0);
                ctx.fillStyle = textcol.addHSL(0,0,-0.2);
                ctx.fillText(item,viewWidth/2,140+30*idx+floatval);
                // ctx.shadowOffsetX = 0;
                // ctx.shadowColor = "black";
            });

            ctx.fillStyle = "lightgray";
            ctx.font = '9px "volter"';
            ctx.textAlign = "left";
            ctx.fillText("beta v"+VERSION+" "+SUBVER,8, viewHeight-8);
            ctx.fillStyle = "white";
            ctx.textAlign = "right";
            ctx.fillText("nondefault.net",viewWidth-8, viewHeight-8);

            ctx.textAlign = 'left';
        }

        ctx.globalCompositeOperation = "difference";
        ctx.drawImage(imgCursorInv, mouseX-8, mouseY-8);
        ctx.globalCompositeOperation = "source-over";

        //copy buffer to screen at proper scale
        sctx.globalAlpha = frameBlend;
        sctx.drawImage(buffer,0,0,screenWidth,screenHeight);
        // sctx.globalCompositeOperation = "difference";
       	// sctx.globalAlpha = Math.random()*Math.random()*0.2+Math.abs(Shake.out.x);
        // sctx.drawImage(buffer,-3-Math.random()*Math.random()*Shake.out.x*4,Math.random()*Shake.out.y*2,screenWidth,screenHeight);
        // sctx.globalCompositeOperation = "source-over";
        sctx.globalAlpha = 1;

        renderLocked = false;

        //request another frame
        // requestAnimFrame(render);
    }
}

function drawgameLevel(mode) {
    solidRenderedBlocks = [];
    var w = gameLevel.getWidth();
    var h = gameLevel.getHeight();

    //loop through portion of gameLevel within view
    var chunkSize = gameLevel.cache.size;
    var incr = mode === 0 ? chunkSize : 1;
    var initialX = ~~(viewX/tileWidth),
        initialY = ~~(viewY/tileHeight),
        finalX = ~~((viewX+viewWidth)/tileWidth)+1,
        finalY = ~~((viewY+viewHeight)/tileHeight)+1;
    if (initialX < 0) initialX = 0;
    if (initialY < 0) initialY = 0;
    if (finalX >= gameLevel.getWidth()) finalX = gameLevel.getWidth();
    if (finalY >= gameLevel.getHeight()) finalY = gameLevel.getHeight();
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
                    solidRenderedBlocks.push(tile);
                    drawtile(tile,sx,sy);
                }
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

function drawLoadingScreen(progress) {
    dmode = -1;

    var msg = "preparing...";
    var w = ctx.measureText(msg).width;
    var lbx = viewWidth/2-w*0.5, lby = viewHeight/2 + 11;

    // ctx.shadowOffsetY=2+Math.sin(gameTime*0.1)*3;
    // ctx.shadowOffsetX=Math.sin(gameTime*0.078+0.24)*5;
    // ctx.shadowColor = "black";
    // ctx.shadowBlur = 0;

    var basecol = Color.gradientMix(outrunPalette, gameTime*0.01, true);
    var gradient = ctx.createLinearGradient(lbx,lby,lbx+((progress||1)*w),lby);
    gradient.addColorStop(0, basecol.addHSL(0,-0.05,-0.1));
    gradient.addColorStop(1.0, basecol.addHSL(-0.5,-0.05,-0.1));

    ctx.fillStyle = "rgb(10,9,9)";
    ctx.fillRect(0,0,viewWidth,viewHeight);
    ctx.font = '24px "volter"';
    ctx.textAlign = 'center';
    ctx.fillStyle = gradient;
    ctx.fillText(msg,viewWidth/2,viewHeight/2);

    ctx.fillStyle = "black";
    ctx.fillRect(lbx, lby, w, 4);
    ctx.fillStyle = gradient;
    ctx.fillRect(lbx, lby, ~~((progress||1)*w), 4);

    // ctx.shadowOffsetY=0;
    // ctx.shadowOffsetX=0;
    // ctx.shadowColor = "black";
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
        data[i+3] = Util.ifrand(intensity);
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
