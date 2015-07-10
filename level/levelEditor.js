window.addEventListener("load", function(){
    editor.canvas = document.getElementById("disp");
    editor.canvas.width = ~~(window.innerWidth/editor.scale);
    editor.canvas.height = ~~(window.innerHeight/editor.scale);
    editor.canvas.style.width = editor.canvas.style.height ="100%";
    editor.ctx = editor.canvas.getContext("2d");

    document.addEventListener("mousemove", function(event){
        Mouse.x = event.pageX;
        Mouse.y = event.pageY;
        Mouse.update();
    }, false);
    document.addEventListener("mousedown", function(event){
        Mouse.down = event.which === 1;
        Mouse.rdown = event.which === 3;
        if (event.which === 3) {
            Mouse.srdX = Mouse.tx;
            Mouse.srdY = Mouse.ty;
        }
    }, false);
    document.addEventListener("mouseup", function(event){
        Mouse.down = event.which === 1 ? false : Mouse.down;
        Mouse.rdown = event.which === 3 ? false : Mouse.rdown;
        if (event.which === 3) {
            var w = Mouse.tx - Mouse.srdX,
                h = Mouse.ty - Mouse.srdY;
            if (w!==0 && h!==0) {
                var x1 = Mouse.srdX,
                    y1 = Mouse.srdY,
                    x2 = Mouse.srdX + w,
                    y2 = Mouse.srdY + h;
                if (w<0) {
                    var t = x1;
                    x1 = x2;
                    x2 = t;
                }
                if (h<0) {
                    var t = y1;
                    y1 = y2;
                    y2 = t;
                }
                for (var x=x1; x<x2; x++) {
                    for (var y=y1; y<y2; y++) {
                        if (x >= 0 && y >= 0 && x < editor.level.width && y < editor.level.height) {
                            idx = (y*editor.level.width)+x;
                            editor.level.data[idx] = editor.selectedId;
                        }
                    }
                }
            }
        }
    }, false);
    document.addEventListener("keydown", function(event){
        Keyboard[event.keyCode] = true;
        if (String.fromCharCode(event.keyCode).match(/\d/))
            editor.selectedId = parseInt(String.fromCharCode(event.keyCode));
        if (event.keyCode === 88) {
            window.open("data:text/plain;base64,"+btoa(JSON.stringify(editor.level)));
        }
    }, false);
    document.addEventListener("keyup", function(event){
        Keyboard[event.keyCode] = false;
    }, false);

    var datasrc = prompt("url to load:");
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            editor.level = JSON.parse(req.responseText);
            alert("Loaded!");
            editor.init();
        }
    }
    req.open("GET", datasrc, true);
    try {
        if (datasrc === "") throw new Error();
        req.overrideMimeType("application/json");
        req.send();
    }
    catch (error) {
        alert("Creating blank level for you...");
        editor.createNewLevel();
        editor.init();
    }
}, false);

var editor = {
    canvas: null,
    ctx: null,
    tileSize: 16,
    tileImages: [null],
    scale: 2,
    level: null,
    viewX: 0,
    viewY: 0,
    scrollSpeed: 6,
    viewW: 0,
    viewH: 0,
    selectedId: 0,

    init: function() {
        var toLoad = [];
        for (var i=1; i<NUM_TILES; i++)
            toLoad.push("../res/tile/"+i+".png");

        var loadNext = function() {
            var src = toLoad.shift();
            var img = new Image();
            img.onload = function() {
                editor.tileImages.push(img);
                if (toLoad.length > 0)
                    loadNext();
                else
                    editor.ready();
            };
            img.src = src;
        };

        loadNext();
    },

    createNewLevel: function() {
        editor.level = {
        	"name": "Dummy Level",
        	"min_version": 123,
        	"width": 200,
        	"height": 200,
        	"data": []
        };
        for (var i=editor.level.width*editor.level.height-1; i>=0; i--)
            editor.level.data[i] = 0;
    },

    ready: function() {
        setInterval(editor.step, 1000/60);
    },

    step: function() {
        if (Keyboard[87]) editor.viewY -= editor.scrollSpeed;
        if (Keyboard[65]) editor.viewX -= editor.scrollSpeed;
        if (Keyboard[83]) editor.viewY += editor.scrollSpeed;
        if (Keyboard[68]) editor.viewX += editor.scrollSpeed;

        var idx;
        if (Mouse.down) {
            if (Mouse.tx >= 0 && Mouse.ty >= 0 && Mouse.tx < editor.level.width && Mouse.ty < editor.level.height) {
                idx = (Mouse.ty*editor.level.width)+Mouse.tx;
                editor.level.data[idx] = editor.selectedId;
            }
        }

        editor.ctx.fillStyle = "rgba(0,0,0,0.5)";
        editor.ctx.fillRect(0,0,editor.canvas.width,editor.canvas.height);

        editor.viewW = editor.canvas.width / editor.tileSize;
        editor.viewH = editor.canvas.height / editor.tileSize;
        for (var x=~~(editor.viewX/editor.tileSize); x<~~(editor.viewX/editor.tileSize+editor.viewW); x++) {
            if (x<0 || x>=editor.level.width) continue;
            for (var y=~~(editor.viewY/editor.tileSize); y<~~(editor.viewY/editor.tileSize+editor.viewH); y++) {
                if (y<0 || y>=editor.level.height) continue;
                idx = (y*editor.level.width)+x;
                var id = editor.level.data[idx];
                if (id > 0)
                    editor.ctx.drawImage(editor.tileImages[id], x*editor.tileSize-editor.viewX, y*editor.tileSize-editor.viewY);
            }
        }
        editor.ctx.strokeStyle = "lime";
        if (Mouse.rdown) {
            var x1 = Mouse.srdX*editor.tileSize-editor.viewX,
                y1 = Mouse.srdY*editor.tileSize-editor.viewY;
            editor.ctx.strokeRect(
                x1,
                y1,
                Mouse.tx*editor.tileSize-editor.viewX-x1,
                Mouse.ty*editor.tileSize-editor.viewY-y1
            );
        }
        if (editor.selectedId > 0 && editor.selectedId < NUM_TILES)
            editor.ctx.drawImage(editor.tileImages[editor.selectedId], Mouse.tx*editor.tileSize-editor.viewX, Mouse.ty*editor.tileSize-editor.viewY, editor.tileSize, editor.tileSize);
        editor.ctx.strokeRect(Mouse.tx*editor.tileSize-editor.viewX, Mouse.ty*editor.tileSize-editor.viewY, editor.tileSize, editor.tileSize);
        editor.ctx.strokeStyle = "red";
        editor.ctx.strokeRect(-editor.viewX, -editor.viewY, editor.level.width*editor.tileSize, editor.level.height*editor.tileSize);
        editor.ctx.fillStyle = "yellow";
        editor.ctx.fillRect(editor.level.width*editor.tileSize*0.5-editor.viewX,-editor.viewY,1,editor.level.height*editor.tileSize);
        editor.ctx.fillRect(-editor.viewX,editor.level.height*editor.tileSize*0.5-editor.viewY,editor.level.width*editor.tileSize,1);

        editor.ctx.fillStyle = "white";
        editor.ctx.fillText((Mouse.x/editor.scale+editor.viewX).toFixed(0)+" , "+(Mouse.y/editor.scale+editor.viewY).toFixed(0), 8, 16);
    }
};

var Keyboard = [];
var Mouse = {
    x: 0,
    y: 0,
    srdX: 0,
    srdY: 0,
    tx: 0,
    ty: 0,
    down: false,
    update: function() {
        this.tx = ~~((this.x+editor.viewX*editor.scale)/(editor.tileSize*editor.scale));
        this.ty = ~~((this.y+editor.viewY*editor.scale)/(editor.tileSize*editor.scale));
    }
};
