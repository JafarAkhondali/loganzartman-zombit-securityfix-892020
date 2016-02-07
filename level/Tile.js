EMPTY=0, FLOOR=1, WALL=2, PLANT=3, GRASS=4, WOODFLOOR=5, ASPHALT=6, ASPHALT_LINE=7, SHELVES=8, SIDEWALK=9, TILEFLOOR=10;
NUM_TILES = 11;

BORDER_MAP = {};
// BORDER_MAP[EMPTY] = [];
// BORDER_MAP[FLOOR] = [GRASS, ASPHALT];
// BORDER_MAP[WALL] = [];
// BORDER_MAP[PLANT] = [];
// BORDER_MAP[GRASS] = [];
// BORDER_MAP[WOODFLOOR] = [FLOOR, GRASS];
// BORDER_MAP[ASPHALT] = [GRASS];
// BORDER_MAP[ASPHALT_LINE] = BORDER_MAP[ASPHALT];
// BORDER_MAP[SHELVES] = [];

NATURAL_LIST = {};
NATURAL_LIST[FLOOR] = 25;
NATURAL_LIST[GRASS] = 50;
NATURAL_LIST[SIDEWALK] = 40;
TILE_SOUNDS = [null,1,null,4,4,5,1,1,null];

var TILE_LIST = [], TILE_MAP = {};
(function loadTiles(){
	Util.loadJSON("tiles/tiles.json", function(data){
		tileWidth = tileHeight = data.size;
		for (var i=0; i<data.tiles.length; i++) {
			TILE_LIST[i] = data.tiles[i];
			data.tiles[i].id = i;
			TILE_MAP[data.tiles[i].name] = TILE_LIST[i];
			BORDER_MAP[i] = data.tiles[i].border;
		}

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
				if (vals===undefined) continue;
				for (var j=0; j<vals.length; j++)
					BORDER_MATRIX[key][TILE_MAP[vals[j]].id] = 1;
			}
		}

		Editor.tilesReady();
	});
})();

Tile = function(id,x,y) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.solid = TILE_LIST[this.id].solid;
	this.depth = TILE_LIST[this.id].depth;
	this.sound = TILE_SOUNDS[this.id]===null?null:sndStep[TILE_SOUNDS[this.id]];
	//implement solid
};

tileImage = function(id) {
	return images[id];
};

tileAt = function(ex, ey) {
	var bx = Math.floor(ex/tileWidth);
	var by = Math.floor(ey/tileHeight);
	if (bx>0 && by>0 && bx<gameLevel.getWidth() && by<gameLevel.getHeight()) {
		return gameLevel.getTile(bx,by);
	}
	else {return null;}
};
