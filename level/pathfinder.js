/**
 * A simple, fast pathfinder implementation used by zombies. Only one pathfinder
 * is required per level; an array is maintained with a cell for each tile in
 * the level. Each cell contains the direction in which a hostile should travel
 * to avoid obstacles and reach the target.
 */
var Pathfinder = function(level, target) {
    this.level = level;
    this.target = target;
    this.maxCost = 0;

    this.clearGrid(true, 0);
};

/**
 * clear the pathfinding grid to a value
 * @param clear whether to reconstruct arrays
 * @param val value to clear to
 */
Pathfinder.prototype.clearGrid = function(clear, val) {
    if (clear) this.grid = [];
    for (var x = this.level.getWidth(); x>=0; x--) {
        if (clear) this.grid[x] = [];
        for (var y = this.level.getHeight(); y>=0; y--) {
            this.grid[x][y] = val;
        }
    }
};
/**
 * Recalculate the pathfinding grid.
 * Called once per step.
 */
Pathfinder.prototype.recalculate = function() {
    //target position in cell coordinates
    var targetX = Math.floor(this.target.x / tileWidth),
        targetY = Math.floor(this.target.y / tileHeight);

    //reset grid and mark walls as visited
    this.maxCost = 0;

    //clear the pathfinding grid to zero, except for walls which are marked as
    //null (non-traversable)
    for (var x = this.level.getWidth(); x>=0; x--) {
        for (var y = this.level.getHeight(); y>=0; y--) {
            var tile = this.level.getTile(x,y);
            if (tile.solid) this.grid[x][y] = 0;
            else this.grid[x][y] = null;
        }
    }

    //this is a queue (array) -based implementation of a recursive traversal of
    //all level tiles. By recording the direction of traversal in each cell, we
    //obtain a poor quality (but valid) path to the player
    var queue = [];
    queue.push([targetX, targetY, [0,0]]); //[tileX, tileY, [directionX, directionY]]
    var indLow = 0, indHigh = 1; //array.shift() is slow

    while (indLow <= queue.length-1) {
        var loc = queue[indLow++];

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
        queue[indHigh++] = [loc[0]+1, loc[1], [-1,0]];
        queue[indHigh++] = [loc[0]-1, loc[1], [1,0]];
        queue[indHigh++] = [loc[0], loc[1]+1, [0,-1]];
        queue[indHigh++] = [loc[0], loc[1]-1, [0,1]];
        queue[indHigh++] = [loc[0]+1, loc[1]+1, [-1,-1]];
        queue[indHigh++] = [loc[0]+1, loc[1]-1, [-1,1]];
        queue[indHigh++] = [loc[0]-1, loc[1]+1, [1,-1]];
        queue[indHigh++] = [loc[0]-1, loc[1]-1, [1,1]];
    }

};

/**
 * Determines whether a location (tile coordinates) is within both the level and
 * the onscreen area. Used as a bound for traversal.
 * @return boolean indicating whether cell is inbounds
 */
Pathfinder.prototype.inbounds = function(x,y) {
    if (x<0 || y<0 || x>=this.grid.length || y>=this.grid[0].length) return false;
    if (x<viewTargetX/tileWidth || y<viewTargetY/tileHeight || x>=(viewTargetX+viewWidth)/tileWidth || y>=(viewTargetY+viewHeight)/tileHeight) return false;
    return true;
};

/**
 * Obtain the direction stored in a cell, or null if the cell does not exist or
 * was not reached in traversal.
 * @param x x coordinate of tile
 * @param y y coordinate of tile
 * @return array representing x and y components of direction stored in x,y
 */
Pathfinder.prototype.getDirection = function(x,y) {
    if (!this.inbounds(x,y)) return null;
    if (this.grid[x][y] === 0) return null;
    return this.grid[x][y];
};

/**
 * Look at surrounding tiles and walls to determine an improved movement
 * direction.
 * @param x x coordinate of tile
 * @param y y coordinate of tile
 * @return array representing x and y components of direction stored in x,y
 */
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
