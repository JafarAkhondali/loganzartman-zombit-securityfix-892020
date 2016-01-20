var Editor = {
    enabled: false,
    selected: 1,
    gui: null,
    _x0: null,
    _y0: null,
    _prevtx: 0,
    _prevty: 0,
    map: null,
    tilenames: null,
    editLights: true,
    lightInteractRange: 8,
    lightIndex: null,

    createControls: function(gui) {
        gui.add(Editor, "enabled");
        Editor.gui = gui;
        if (!Editor._selectedList && TILE_LIST) Editor.tilesReady(gui);
    },

    tilesReady: function() {
        if (!Editor.gui) return;
        Editor._selectedList = true;
        var map = {};
        for (var i=0; i<TILE_LIST.length; i++) {
            map[TILE_LIST[i].name] = i;
        }
        Editor.map = map;
        Editor.tilenames = Object.keys(Editor.map);
        // Editor.gui.add(Editor, "selected", map);
        Editor.gui.addFolder("Press enter for editor console.");
    },

    drawUI: function() {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        if (Editor._x0 !== null) {
            ctx.strokeStyle = "lime";
            ctx.strokeRect(
                Math.floor((Editor._x0+viewX)/tileWidth)*tileWidth-viewX,
                Math.floor((Editor._y0+viewY)/tileHeight)*tileHeight-viewY,
                Math.ceil(((mouseX)-Editor._x0)/tileWidth)*tileWidth,
                Math.ceil(((mouseY)-Editor._y0)/tileHeight)*tileHeight
            );
        }

        var mx0 = Math.floor((mouseX+viewX)/tileWidth)*tileWidth-viewX,
            my0 = Math.floor((mouseY+viewY)/tileHeight)*tileHeight-viewY;

        //render light gui
        if (Editor.editLights) {
            Editor.lightIndex = null;
            for (var i=0; i<lightArray.length; i++) {
                var light = lightArray[i];
                if (light !== null) {
                    if (light.getX() - light.size < viewX+viewWidth && light.getX() + light.size > viewX && light.getY() - light.size < viewY+viewHeight && light.getY() + light.size > viewY) {
                        //interactivity
                        var selected = false;
                        var mdx = (mouseX+viewX) - light.getX(),
                            mdy = (mouseY+viewY) - light.getY();
                        if (Math.sqrt(mdx*mdx+mdy*mdy) <= Editor.lightInteractRange) {
                            Editor.lightIndex = i;
                            selected = true;
                        }

                        //outer
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = selected ? 1 : 0.2;
                        if (!selected) ctx.setLineDash([10,10]);
                        ctx.strokeStyle = "white";
                        ctx.beginPath();
                        ctx.arc(
                            light.getX() - viewX,
                            light.getY() - viewY,
                            light.size * 0.5,
                            0,
                            Math.PI*2
                        );
                        ctx.stroke();

                        //handle
                        ctx.lineWidth = selected ? 2 : 1;
                        ctx.globalAlpha = 1.0;
                        ctx.strokeStyle = "white";
                        ctx.setLineDash([]);
                        ctx.beginPath();
                        ctx.arc(
                            light.getX() - viewX,
                            light.getY() - viewY,
                            Editor.lightInteractRange,
                            0,
                            Math.PI*2
                        );
                        ctx.stroke();
                        ctx.lineWidth = 1;
                    }
                }
            }
        }
        //render tile gui
        else {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(images[Editor.selected], mx0, my0);
            ctx.beginPath();
            ctx.moveTo(0,my0);
            ctx.lineTo(viewWidth,my0);
            ctx.moveTo(0,my0+tileHeight);
            ctx.lineTo(viewWidth,my0+tileHeight);
            ctx.moveTo(mx0,0);
            ctx.lineTo(mx0,viewHeight);
            ctx.moveTo(mx0+tileHeight,0);
            ctx.lineTo(mx0+tileHeight,viewHeight);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.strokeRect(
                mx0,
                my0,
                tileWidth,
                tileHeight
            );
        }
    },

    setTile: function(mouseXPos, mouseYPos, type) {
        var tx = ~~((mouseXPos + viewX)/tileWidth),
            ty = ~~((mouseYPos + viewY)/tileHeight);
        var tile = new Tile(type, tx, ty);
        gameLevel.setTile(tile, tx, ty);
    },

    matchInput: function(input) {
        return Editor.tilenames.filter(function(item){
            return item.indexOf(input)>=0;
        });
    },

    updateInput: function(input) {
        mpMessages = Editor.matchInput(input).map(function(item){
            return "Tile: "+item;
        }).concat(["export", "import"]);
    },

    acceptInput: function(input) {
        var m = Editor.matchInput(input);
        if (m.length > 0) {
            Editor.selected = Editor.map[m[0]];
        }
    },

    handleClick: function(event) {
        if (!Editor.enabled) return;
        if (mouseLeft) {
            if (Editor.editLights) {
                var col = "white"//prompt("Color");
                var size = 128//parseInt(prompt("size")) || 16;
                var brightness = 1//parseFloat(prompt("brightness")) || 1.0;
                var light = new StaticLight(mouseX + viewX, mouseY + viewY, col, size, brightness);
                registerLight(light);
            }
            else {
                Editor.setTile(mouseX, mouseY, Editor.selected);
                var tx = ~~((mouseX + viewX)/tileWidth),
                    ty = ~~((mouseY + viewY)/tileHeight);
                gameLevel.cache.recacheAt(tx,ty);
            }
        }
        else if (mouseRight) {
            if (Editor.editLights) {
                if (Editor.lightIndex !== null) {
                    unregisterLight(lightArray[Editor.lightIndex]);
                }
            }
            else {
                Editor._x0 = mouseX;
                Editor._y0 = mouseY;
            }
        }
    },

    handleDrag: function(event) {
        if (!Editor.enabled) return;
        if (mouseLeft) Editor.handleClick(event);
    },

    handleUp: function(event) {
        if (!Editor.enabled) return;
        if (mouseRight && Editor._x0 !== null && !Editor.editLights) {
            for (var x=Editor._x0; x<mouseX; x+=tileWidth) {
                for (var y=Editor._y0; y<mouseY; y+=tileHeight) {
                    Editor.setTile(x, y, Editor.selected);
                }
            }
            for (var x = Editor._x0; x<mouseX; x+=gameLevel.cache.size*tileWidth) {
                for (var y=Editor._y0; y<mouseY; y+=gameLevel.cache.size*tileHeight) {
                    var tx = ~~((x + viewX)/tileWidth),
                        ty = ~~((y + viewY)/tileHeight);
                    gameLevel.cache.recacheAt(tx,ty);
                }
            }
            Editor._x0 = null;
            Editor._y0 = null;
        }
        if (mouseLeft) {
            var tx = ~~((Editor._x0 + viewX)/tileWidth),
                ty = ~~((Editor._y0 + viewY)/tileHeight);
            if (tx !== Editor._prevtx || ty !== Editor._prevty) {
                gameLevel.cache.recacheAt(tx,ty);
                Editor._prevtx = tx;
                Editor._prevty = ty;
            }
        }
        cacheShadowPoints(gameLevel);
    }
};
