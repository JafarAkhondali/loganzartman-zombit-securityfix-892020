LevelCache = function(level, chunksize) {
    this.level = level;
    this.size = chunksize;
    this.width = Math.ceil(level.getWidth() / this.size);
    this.height = Math.ceil(level.getHeight() / this.size);

    this.recache();
};
LevelCache.prototype.recache = function() {
    this.arr = [];
    for (var x=0; x<=this.width; x++) {
        this.arr[x] = [];
        for (var y=0; y<=this.height; y++) {
            this.arr[x][y] = this.makeChunk(x,y);
        }
    }
};
LevelCache.prototype.makeChunk = function(x,y) {
    var img = document.createElement("canvas");
    img.width = tileWidth * this.size;
    img.height = tileHeight * this.size;
    this.drawChunk(img,x,y);
    return img;
};
LevelCache.prototype.drawChunk = function(canvas,x,y) {
    var ctx = canvas.getContext("2d");
    for (var xo=0; xo<this.size; xo++) {
        for (var yo=0; yo<this.size; yo++) {
            var tile = this.level.getTile(x*this.size+xo, y*this.size+yo);
            if (tile !== null && tile.depth === 0)
                ctx.drawImage(tileImage(tile.id), xo*tileWidth, yo*tileHeight);
        }
    }
};
LevelCache.prototype.getChunk = function (tx, ty) {
    var x = tx / this.size,
        y = ty / this.size;
    return this.arr[~~x][~~y];
};
