var Editor = {
    enabled: false,
    selected: 1,
    gui: null,
    _x0: null,
    _y0: null,
    map: null,
    tilenames: null,

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
        Editor.gui.add(Editor, "selected", map);
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
            Editor.setTile(mouseX, mouseY, Editor.selected);
            var tx = ~~((mouseX + viewX)/tileWidth),
                ty = ~~((mouseY + viewY)/tileHeight);
            gameLevel.cache.recacheAt(tx,ty);
        }
        else if (mouseRight) {
            Editor._x0 = mouseX;
            Editor._y0 = mouseY;
        }
    },

    handleDrag: function(event) {
        if (!Editor.enabled) return;
        if (mouseLeft) Editor.handleClick(event);
    },

    handleUp: function(event) {
        if (!Editor.enabled) return;
        if (mouseRight && Editor._x0 !== null) {
            for (var x=Editor._x0; x<mouseX; x+=tileWidth) {
                for (var y=Editor._y0; y<mouseY; y+=tileHeight) {
                    Editor.setTile(x, y, Editor.selected);
                }
                var tx = ~~((x + viewX)/tileWidth),
                    ty = ~~((y + viewY)/tileHeight);
                gameLevel.cache.recacheAt(tx,ty);
            }
            Editor._x0 = null;
            Editor._y0 = null;
        }
        gameLevel.cache.recacheScreen();
        cacheShadowPoints(gameLevel);
    }
};
