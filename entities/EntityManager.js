MAX_SER_DEPTH = 5;

collisionLine2 = function(circleX,circleY,radius,lineX1,lineY1,lineX2,lineY2) {
	var d1 = Util.pointDist(lineX1,lineY1,circleX,circleY);
	var d2 = Util.pointDist(lineX2,lineY2,circleX,circleY);
	if (d1<=radius || d2<=radius) {
		return true;
	}

	var k1 = ((lineY2-lineY1)/(lineX2-lineX1));
	var k2 = lineY1;
	var k3 = -1/k1;
	var k4 = circleY;

	var xx = (k1*lineX1-k2-k3*circleX+k4)/(k1-k3);
	var yy = k1*(xx-lineX1)+lineY1;

	var onSegment = true;
	if (lineX2>lineX1) {
		if (xx>=lineX1 && xx<=lineX2) {}
		else {onSegment = false;}
	}
	else {
		if (xx>=lineX2 && xx<=lineX1) {}
		else {onSegment = false;}
	}

	if (lineY2>lineY1) {
		if (yy>=lineY1 && yy<=lineY2) {}
		else {onSegment = false;}
	}
	else {
		if (yy>=lineY2 && yy<=lineY1) {}
		else {onSegment = false;}
	}

	if (onSegment) {
		if (Util.pointDist(circleX,circleY,xx,yy)<radius) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
}

ENTITY = "Entity";
DROPPEDITEM = "DroppedItem";
PLAYER = "Player";
HOSTILE = "Hostile";
ZOMBIE = "Zombie";
PROJECTILE = "Projectile";
BULLET = "Bullet";
PARTICLE = "Particle";
BLOODSPLAT = "BloodSplat";

/**
 * Stores and manages all entities.
 */
EntityManager = function(level) {
	this.level = level;
	this.entities = []; //stores entities
	this.freespace = []; //records indexes that are available
	this.disposable = [];
	this.maxDisposables = 10;
	this.types = []; //types of entities
	this.grid = null;
	this.count = {};
	this.buildGrid();
};

EntityManager.GRID_CELL_SIZE = 16;
/**
 * Builds the localization grid.
 * This grid is used to access spatially-close entities more efficiently.
 */
EntityManager.prototype.buildGrid = function (level) {
	this.grid = [];
	level = level || this.level;
	var sizeWidth = Math.ceil(level.getWidth() / EntityManager.GRID_CELL_SIZE)+1,
		sizeHeight = Math.ceil(level.getHeight() / EntityManager.GRID_CELL_SIZE)+1;
	for (var x=0; x<sizeWidth; x++) {
		this.grid[x] = [];
		for (var y=0; y<sizeHeight; y++) {
			this.grid[x][y] = [];
		}
	}
};

/**
 * Gets the localization grid location of an entity.
 */
EntityManager.prototype.getGridLoc = function (entity) {
	var tx = Math.floor(entity.x / tileWidth),
		ty = Math.floor(entity.y / tileHeight);
	return {
		x: Math.floor(tx / EntityManager.GRID_CELL_SIZE),
		y: Math.floor(ty / EntityManager.GRID_CELL_SIZE)
	};
};

EntityManager.prototype.getNearby = function(entity, range) {
	range = range || 0;
	var pos = this.getGridLoc(entity);
	if (range === 0) return this.grid[pos.x][pos.y] || [];
	else {
		var list = [];
		for (var xo = -range; xo <= range; xo++) {
			for (var yo = -range; yo <= range; yo++) {
				if (pos.x+xo < this.grid.length && pos.x+xo >= 0 && pos.y+yo < this.grid[0].length && pos.y+yo >= 0)
					list.push.apply(list, this.grid[pos.x+xo][pos.y+yo]);
			}
		}
		return list;
	}
};

/**
 * Adds an entity to the localization grid (performed once per step)
 */
EntityManager.prototype.localize = function (entity) {
	var gridPos = this.getGridLoc(entity);
	this.grid[gridPos.x][gridPos.y].push(entity);
};

/**
 * Performs all necessary actions to complete a step.
 * Includes relocalization.
 */
EntityManager.prototype.step = function () {
	this.buildGrid();
	for (var i=this.entities.length-1; i>=0; i--) {
		var e = this.entities[i];
		if (e instanceof Entity) this.localize(e);
	}
};

/**
 * Register a new entity.  This should be performed upon the creation of a new entity
 * @param entity an entity to register
 */
EntityManager.prototype.register = function(entity) {
	if (this.entities.indexOf(entity)<0) {
		var ind;
		if (this.freespace.length>0) {
			ind = this.freespace.shift();
			this.entities[ind] = entity;
		}
		else {
			ind = this.entities.length;
			this.entities[ind] = entity;
		}

		this.localize(entity);
		return ind;
	}
};

EntityManager.prototype.countEntity = function(entity) {
	if (typeof entity.type !== "undefined") {
		if (typeof this.count[entity.type] !== "number")
			this.count[entity.type] = 0;
		this.count[entity.type]++;
		entity._counted = true;
	}
};

/**
 * Makes an entity diposable so that it can be disposed.
 * @param entity entity to make disposable
 */
EntityManager.prototype.makeDisposable = function(entity) {
	this.disposable.push(entity);
	this.cleanDisposable();
};

/**
 * Cleans up extra dropped items
 */
EntityManager.prototype.cleanDisposable = function () {
	// console.log(this.disposable.length);
	if (this.disposable.length > this.maxDisposables) {
		var nToDispose = this.disposable.length - this.maxDisposables;
		for (var i=0; i<nToDispose; i++) {
			var item = this.disposable.shift();
			if (item instanceof Entity && item.disposable) {
				item.destroy();
			}
		}
	}
};

/**
 * Remove an entity from the registry and free its id for future entities (mostly important in multiplayer)
 * @param entity an entity to unregister
 */
EntityManager.prototype.unregister = function(entity) {
	var typeofentity = typeof entity;
	var ind = typeofentity==="number" || typeofentity==="string"?entity:this.entities.indexOf(entity);
	if (ind>=0) {
		if (this.freespace.indexOf(ind)<0) {this.freespace.push(ind);}
		if (this.entities[ind] && typeof this.entities[ind].type !== "undefined" && this.entities[ind]._counted === true)
			this.count[this.entities[ind].type]--;
		this.entities[ind] = undefined;
	}
};

/**
 * Retrieve an entity from the registry.
 * @param thing an index number or an EntityReference wrapper
 */
EntityManager.prototype.get = function(thing) {
	var typeofthing = typeof thing;
	if (typeofthing === "number" || typeofthing === "string") { //entity index
		if (this.entities[thing] instanceof Entity) {
			return this.entities[thing];
		}
		return null;
	}
	else if (thing.arrIndex != null) { //entity reference (index in a wrapper)
		return this.entities[thing.arrIndex];
	}
	else {
		return null;
	}
};

/**
 * Set an entity in the registry
 * @param index index to set
 * @param entity the entity to store to it
 */
EntityManager.prototype.set = function(index, entity) {
	this.entities[index] = entity; //logan this is probably a bad idea do some input verification or something
};

/**
 * Swap the internal location of two entities
 */
EntityManager.prototype.swap = function (slot1, slot2) {
	throw new Error("EntityManager.swap does not work correctly!");
	//todo fix updating ID references
	var temp = this.entities[slot1];
	this.entities[slot1] = this.entities[slot2];
	this.entities[slot2] = temp;
	this.entities[slot1].arrIndex = slot1;
	this.entities[slot2].arrIndex = slot2;
};

EntityManager.prototype.getCount = function(type) {
	if (typeof this.count[type] !== "undefined") return this.count[type];
	else return 0;
};

EntityManager.prototype.length = function() {return this.entities.length;};

EntityManager.prototype.clearAll = function() {
	for (var i=this.entities.length-1; i>=0; i--)
		if (this.entities[i] && typeof this.entities[i].destroy === "function") this.entities[i].destroy();
	this.count = {};
	this.entities = [];
	this.freespace = [];
};

getEntityReference = function(erObj) { //works for literals and ER instances
	return erObj;
	if (erObj && erObj.arrIndex!=null) {
		return entityManager.get(erObj.arrIndex);
	}
	else {return null;}
};
makeEntityReference = function(x) { //works for indexes, entities, and serialized ERs
	return x;
	if (typeof x === 'number' || typeof x === 'string') {
		return {arrIndex: Number(x)};
	}
	else if (x!=null && !(typeof x === 'undefined') && !(typeof x.arrIndex === 'undefined')) {
		return {arrIndex: x.arrIndex};
	}
	else {
		return null;
	}
};

idMap = {};
onScriptsLoaded.push(function(){
	idMap[ENTITY] = Entity;
	idMap[DROPPEDITEM] = DroppedItem;
	idMap[PLAYER] = Player;
	idMap[HOSTILE] = Hostile;
	idMap[ZOMBIE] = Zombie;
	idMap[PROJECTILE] = Projectile;
	idMap[BULLET] = Bullet;
	idMap[PARTICLE] = Particle;
	idMap[BLOODSPLAT] = BloodSplat;
});

//include entities
include("entities/Entity.js");
include("entities/Player.js");
include("entities/LaserRenderer.js");
include("entities/Car.js");
include("entities/DroppedItem.js");
include("entities/hostile/Hostile.js");
include("entities/hostile/Zombie.js");
include("entities/particle/Particle.js");
include("entities/particle/BloodSplat.js");
include("entities/particle/Splatter.js");
include("entities/particle/Spark.js");
include("entities/particle/BulletSpark.js");
include("entities/particle/FloatingText.js");
include("entities/projectile/Projectile.js");
include("entities/projectile/Bullet.js");
include("entities/projectile/Glowstick.js");

makeNewent = function(ent) {
	return {ind: ent.arrIndex, type: ent.type, ser: ent.serializable()};
}

constructEntity = function(id) {
	return new idMap[id];
}
