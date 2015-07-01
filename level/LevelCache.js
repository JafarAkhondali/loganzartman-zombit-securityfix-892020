LevelCache = function(level, chunksize) {
    this.level = level;
    this.size = chunksize;
    this.width = Math.ceil(level.getWidth() / this.size);
    this.height = Math.ceil(level.getHeight() / this.size);
    this._rand = new SmoothRandom(2048);

    this.recache();
};
LevelCache.EXPERIMENTALS = true;
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
    var xo, yo, tile;
    for (xo=0; xo<this.size; xo++) {
        for (yo=0; yo<this.size; yo++) {
            tile = this.level.getTile(x*this.size+xo, y*this.size+yo);
            if (tile !== null && tile.depth === 0)
                ctx.drawImage(tileImage(tile.id), xo*tileWidth, yo*tileHeight);
        }
    }

    //post-process
    //create top buffer, which will allow us to draw without retrieving imagedata again
    var topBuffer = document.createElement("canvas");
    topBuffer.width = canvas.width;
    topBuffer.height = canvas.height;
    var bctx = topBuffer.getContext("2d");

    //set up tile sampler, to sample pixels from tile textures
    var tileSampler = document.createElement("canvas");
    tileSampler.width = NUM_TILES*tileWidth;
    tileSampler.height = tileHeight;
    var tsctx = tileSampler.getContext("2d");
    for (var i=0; i<NUM_TILES; i++)
        tsctx.drawImage(tileImage(i), i*tileWidth, 0);
    var tsidata = tsctx.getImageData(0,0,tileSampler.width,tileSampler.height),
        tsdata = tsidata.data;
    var tsample = function(id, x, y) {
        x = x>=tileWidth?tileWidth-1:x<0?0:x;
        y = y>=tileHeight?tileHeight-1:y<0?0:y;
        x += id*tileWidth;
        var idx = ((y*tileSampler.width)+x)*4;
        //return [255, 0, 0];
        return [tsdata[idx+0], tsdata[idx+1], tsdata[idx+2]];
    };

    //set up image data access functions
    var imgdata = ctx.getImageData(0,0,canvas.width,canvas.height),
        data = imgdata.data;
    var putpixel = function(x,y,r,g,b,a) {
        x = x<0 ? 0 : x>=canvas.width ? canvas.width-1 : x;
        y = y<0 ? 0 : y>=canvas.height ? canvas.height-1 : y;
        var idx = 4*((y*canvas.width)+x);
        data[idx+0] = r<0?0:r>255?255:r;
        data[idx+1] = g<0?0:g>255?255:g;
        data[idx+2] = b<0?0:b>255?255:b;
        data[idx+3] = typeof a === "undefined" ? 255 : a;
    };
    var getpixel = function(x,y) {
        var idx = 4*((y*canvas.width)+x);
        return [data[idx], data[idx+1], data[idx+2]];
    };

    //creates randomized borders on tiles (less artwork for me!)
    var _rand = this._rand;
    var borderize = function(tx, ty, sideX, sideY, neighbor) {
        var darken = 20;
        var x, y, distort, col, basecol, z;
        if (sideX !== 0) {
            x = sideX < 0 ? 0 : tileWidth;
            for (y=0; y<tileHeight; y++) {
                distort = Math.round(_rand.next()*3);
                col = getpixel(tx*tileWidth+x-distort*sideX,ty*tileHeight+y);
                for (z = 0; z !== distort*sideX; z+=sideX) {
                    basecol = tsample(neighbor.id,x-z,y);
                    putpixel(tx*tileWidth+x-z, ty*tileHeight+y, basecol[0], basecol[1], basecol[2], 255);
                }
                putpixel(tx*tileWidth+x-distort*sideX, ty*tileHeight+y, col[0]-darken, col[1]-darken, col[2]-darken);
            }
        }
        if (sideY !== 0) {
            y = sideY < 0 ? 0 : tileHeight;
            for (x=0; x<tileWidth; x++) {
                distort = Math.round(_rand.next()*3);
                col = getpixel(tx*tileWidth+x,ty*tileHeight+y-distort*sideY);
                for (z = 0; z !== distort*sideY; z+=sideY) {
                    basecol = tsample(neighbor.id,x,y-z);
                    putpixel(tx*tileWidth+x, ty*tileHeight+y-z, basecol[0], basecol[1], basecol[2], 255);
                }
                putpixel(tx*tileWidth+x, ty*tileHeight+y-distort*sideY, col[0]-darken, col[1]-darken, col[2]-darken);
            }
        }
    };

    //draw lines on asphalt tiles
    var drawLines = function(tx, ty, nw, ne, nn, ns) {
        tx *= tileWidth;
        ty *= tileHeight;
        var x = tileWidth*0.5,
            y = tileHeight*0.5,
            w = 0,
            h = 0;
        if (ne !== null && ne.id === ASPHALT_LINE) {
            w += tileWidth*0.5;
        }
        if (nw !== null && nw.id === ASPHALT_LINE) {
            x = 0;
            w += tileWidth*0.5;
        }
        if (ns !== null && ns.id === ASPHALT_LINE) {
            h += tileHeight*0.5;
        }
        if (nn !== null && nn.id === ASPHALT_LINE) {
            y = 0;
            h += tileWidth*0.5;
        }
        bctx.strokeStyle = "yellow";
        bctx.lineWidth = 3;
        bctx.beginPath();
        bctx.moveTo(tx+x, ty+tileHeight*0.5);
        bctx.lineTo(tx+x+w, ty+tileHeight*0.5);
        bctx.moveTo(tx+tileWidth*0.5, ty+y);
        bctx.lineTo(tx+tileWidth*0.5, ty+y+h);
        bctx.stroke();
    };

    //perform border rendering
    var border = function(center, tile) {
        return tile !== null && BORDER_MATRIX[center.id][tile.id];
    }
    for (xo=0; xo<this.size; xo++) {
        for (yo=0; yo<this.size; yo++) {
            var tileBaseX = x*this.size+xo,
                tileBaseY = y*this.size+yo;
            tile = this.level.getTile(tileBaseX, tileBaseY);
            var neighborWest = this.level.getTile(tileBaseX - 1, tileBaseY),
                neighborEast = this.level.getTile(tileBaseX + 1, tileBaseY),
                neighborNorth = this.level.getTile(tileBaseX, tileBaseY - 1),
                neighborSouth = this.level.getTile(tileBaseX, tileBaseY + 1);

            if (tile !== null && tile.depth === 0) {
                if (tile.id === ASPHALT_LINE) drawLines(xo, yo, neighborWest, neighborEast, neighborNorth, neighborSouth);
                if (border(tile, neighborWest)) borderize(xo, yo, -1, 0, neighborWest);
                if (border(tile, neighborNorth)) borderize(xo, yo, 0, -1, neighborNorth);
                if (border(tile, neighborEast)) borderize(xo, yo, 1, 0, neighborEast);
                if (border(tile, neighborSouth)) borderize(xo, yo, 0, 1, neighborSouth);
            }
        }
    }
    ctx.putImageData(imgdata, 0, 0);
    ctx.drawImage(topBuffer, 0, 0);
};
LevelCache.prototype.getChunk = function (tx, ty) {
    var x = tx / this.size,
        y = ty / this.size;
    return this.arr[~~x][~~y];
};
