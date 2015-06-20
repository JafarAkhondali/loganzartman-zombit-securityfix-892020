var Pathfinder = function(level, target) {
    this.level = level;
    this.target = target;
    this.maxCost = 0;

    this.clearGrid(true, 0);
};
Pathfinder.prototype.clearGrid = function(clear, val) {
    if (clear) this.grid = [];
    for (var x = this.level.getWidth(); x>=0; x--) {
        if (clear) this.grid[x] = [];
        for (var y = this.level.getHeight(); y>=0; y--) {
            this.grid[x][y] = val;
        }
    }
};
Pathfinder.prototype.recalculate = function() {
    //target position in cell coordinates
    var targetX = Math.round(this.target.x / tileWidth),
        targetY = Math.round(this.target.y / tileHeight);

    //reset grid and mark walls as visited
    this.maxCost = 0;

    for (var x = this.level.getWidth(); x>=0; x--) {
        for (var y = this.level.getHeight(); y>=0; y--) {
            var tile = this.level.getTile(x,y);
            if (tile.solid) this.grid[x][y] = 0;
            else this.grid[x][y] = null;
        }
    }

    var queue = [];
    queue.push([targetX, targetY, [0,0]]);
    var index = 0;
    while (index <= queue.length-1) {
        var loc = queue[index++];

        if (!this.inbounds(loc[0],loc[1])) continue; //bounds check
        if (this.grid[loc[0]][loc[1]] !== null) continue; //don't check cells that have been visited

        //check for bad diagonal movements
        if (loc[2][0] !== 0 && loc[2][1] !== 0) {
            var d1 = this.grid[loc[0]+loc[2][0]][loc[1]];
            var d2 = this.grid[loc[0]][loc[1]+loc[2][1]];
            if (d1 !== null && d1.solid) continue;
            if (d2 !== null && d2.solid) continue;
        }

        this.grid[loc[0]][loc[1]] = loc[2];

        //traverse in cardinal and diagonal directions
        queue.push([loc[0]+1, loc[1], [-1,0]]);
        queue.push([loc[0]-1, loc[1], [1,0]]);
        queue.push([loc[0], loc[1]+1, [0,-1]]);
        queue.push([loc[0], loc[1]-1, [0,1]]);
        queue.push([loc[0]+1, loc[1]+1, [-1,-1]]);
        queue.push([loc[0]+1, loc[1]-1, [-1,1]]);
        queue.push([loc[0]-1, loc[1]+1, [1,-1]]);
        queue.push([loc[0]-1, loc[1]-1, [1,1]]);
    }

};
Pathfinder.prototype.inbounds = function(x,y) {
    if (x<0 || y<0 || x>=this.grid.length || y>=this.grid[0].length) return false;
    if (x<viewX/tileWidth || y<viewY/tileHeight || x>=(viewX+viewWidth)/tileWidth || y>=(viewY+viewHeight)/tileHeight) return false;
    return true;
};
Pathfinder.prototype.getDirection = function(x,y) {
    if (!this.inbounds(x,y)) return null;
    if (this.grid[x][y] === 0) return null;
    return this.grid[x][y];
};
Pathfinder.prototype.getBestDirection = function(x,y) {
    var w = this.getDirection(x-1,y),
        e = this.getDirection(x+1,y),
        n = this.getDirection(x,y-1),
        s = this.getDirection(x,y+1);
    if (w === null) w = [2,0];
    if (e === null) e = [-2,0];
    if (n === null) n = [0,2];
    if (s === null) s = [0,-2];
    var sumX = w[0]+e[0]+n[0]+s[0],
        sumY = w[1]+e[1]+n[1]+s[1];
    var magX = Math.abs(sumX),
        magY = Math.abs(sumY);
    var max = magX > magY ? magX : magY;
    return [sumX/max, sumY/max];
};
