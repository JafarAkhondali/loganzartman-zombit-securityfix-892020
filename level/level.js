Level = function(levelData) {
	this.data = levelData;
	cacheShadowPoints(this);
};
Level.prototype.getWidth = function(){return this.data.length;};
Level.prototype.getHeight = function(){return this.data[0].length;};
Level.prototype.getTile = function(x,y) {
	if (x < 0 || x > this.getWidth()-1 || y < 0 || y > this.getHeight()-1) {
		return 0;
	}
	return this.data[x][y];
};
Level.prototype.setTile = function(tile,x,y) {
	this.data[x][y] = tile;
};
Level.prototype.chunkSet = function(chunk) {
	for (var x=chunk.x; x<chunk.x+chunk.w; x++) {
		for (var y=chunk.y; y<chunk.y+chunk.h; y++) {
			this.setTile(chunk.tiles[x-chunk.x][y-chunk.y],x,y);
		}
	}
};
Level.prototype.getChunk = function(x,y,w,h) {
	var chunk = [];
	for (var i=0; i<w; i++) {
		chunk[i] = [];
		for (var j=0; j<h; j++) {
			chunk[i][j] = null;
		}
	}
	for (var xx=x; xx<x+w; xx++) {
		for (var yy=y; yy<y+h; yy++) {
			chunk[xx-x][yy-y] = this.getTile(xx,yy);
		}
	}
	return new Chunk(x,y,chunk);
};
Level.prototype.getTilesOfTypes = function(types) {
	var stack = [];
	for (var x=0; x<this.getWidth(); x++) {
		for (var y=0; y<this.getHeight(); y++) {
			var tile = this.getTile(x,y);
			if (tile instanceof Tile) {
				if (types.indexOf(tile.id) >= 0) stack.push(tile);
			}
		}
	}
	return stack;
};

include("level/LevelFactory.js");
include("level/Inventory.js");

//must be over 10000
ITEM = 10001;
WEAPON = 10002;
MELEE = 10003;
WOODENBAT = 10004;
ZOMBIEATTACK = 10005;
GUN = 10006;
PISTOL = 10007;
ASSAULTRIFLE = 10008;
TYPHOON = 10009;
GAUSS = 10010;
NYANGUN = 10011;
GLOWSTICKGUN = 10012;
ZOMBIEGUN = 10013;

itemIdMap = {};
onScriptsLoaded.push(function(){
	itemIdMap[ITEM] = Item;
	itemIdMap[WEAPON] = Weapon;
	itemIdMap[MELEE] = Melee;
	itemIdMap[WOODENBAT] = WoodenBat;
	itemIdMap[ZOMBIEATTACK] = ZombieAttack;
	itemIdMap[GUN] = Gun;
	itemIdMap[PISTOL] = Pistol;
	itemIdMap[ASSAULTRIFLE] = AssaultRifle;
	itemIdMap[TYPHOON] = Typhoon;
	itemIdMap[GAUSS] = Gauss;
	itemIdMap[NYANGUN] = NyanGun;
	itemIdMap[GLOWSTICKGUN] = GlowstickGun;
	itemIdMap[ZOMBIEGUN] = ZombieGun;
});

include("level/items/Item.js");
include("level/items/MoonDust.js");
include("level/items/weapons/Weapon.js");
include("level/items/weapons/gun/Gun.js");
include("level/items/weapons/gun/AssaultRifle.js");
include("level/items/weapons/gun/Gauss.js");
include("level/items/weapons/gun/GlowstickGun.js");
include("level/items/weapons/gun/Gun.js");
include("level/items/weapons/gun/AnyGun.js");
include("level/items/weapons/gun/NyanGun.js");
include("level/items/weapons/gun/Pistol.js");
include("level/items/weapons/gun/RandomGun.js");
include("level/items/weapons/gun/RandomGunTester.js");
include("level/items/weapons/gun/Typhoon.js");
include("level/items/weapons/melee/Melee.js");
include("level/items/weapons/melee/WoodenBat.js");
include("level/items/weapons/melee/ZombieAttack.js");
include("level/items/weapons/gun/ZombieGun.js");

constructItem = function(id) {
	try {return new itemIdMap[id]();}
	catch (e) {console.log("Bad item ID: "+id); return null;}
};
