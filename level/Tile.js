EMPTY=0, FLOOR=1, WALL=2, PLANT=3, GRASS=4, WOODFLOOR=5, ASPHALT=6, ASPHALT_LINE=7, SHELVES=8;
NUM_TILES = 9;

BORDER_MAP = {};
BORDER_MAP[EMPTY] = [];
BORDER_MAP[FLOOR] = [GRASS, ASPHALT];
BORDER_MAP[WALL] = [];
BORDER_MAP[PLANT] = [];
BORDER_MAP[GRASS] = [];
BORDER_MAP[WOODFLOOR] = [FLOOR, GRASS];
BORDER_MAP[ASPHALT] = [GRASS];
BORDER_MAP[ASPHALT_LINE] = BORDER_MAP[ASPHALT];
BORDER_MAP[SHELVES] = [];

BORDER_MATRIX = [];
for (var x=0; x<NUM_TILES; x++) {
	BORDER_MATRIX[x] = [];
	for (var y=0; y<NUM_TILES; y++) {
		BORDER_MATRIX[x][y] = 0;
	}
}
for (var key in BORDER_MAP) {
	if (BORDER_MAP.hasOwnProperty(key)) {
		var vals = BORDER_MAP[key];
		for (var i=0; i<vals.length; i++) {
			BORDER_MATRIX[key][vals[i]] = 1;
		}
	}
}

SOLIDS = [false,false,true,true,false,false,false,false,true];
DEPTHS = [0,0,2,2,0,0,0,0,2]; //depths: 0-bottom, 1-shadow layer, 2-top layer
TILE_SOUNDS = [null,1,null,null,4,5,1,1,null];

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
