EMPTY=0, FLOOR=1, WALL=2, PLANT=3, GRASS=4, WOODFLOOR=5;
NUM_TILES = 6;
BORDER_MATRIX = [
	[0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 1, 0],
	[0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0],
	[0, 1, 0, 0, 1, 0]
];
SOLIDS = [false,false,true,true,false,false];
DEPTHS = [0,0,2,2,0,0]; //depths: 0-bottom, 1-shadow layer, 2-top layer
TILE_SOUNDS = [null,1,null,null,4,5];

Tile = function(id,x,y) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.solid = SOLIDS[this.id];
	this.depth = DEPTHS[this.id];
	this.sound = TILE_SOUNDS[this.id]===null?null:sndStep[TILE_SOUNDS[this.id]];
	//implement solid
}

tileImage = function(id) {
	return images[id];
}

isSolid = function(tile) {
	return SOLIDS[tile.id];
}
