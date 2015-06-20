Entity = klass(function (x,y) {
	this.x = x||50;
	this.y = y||50;
	this.xs = 0;
	this.ys = 0;
	this.friction = 0;
	this.life = 100;
	this.maxlife = this.life;

	this.width = tileWidth;
	this.height = tileHeight;

	this.dropchance = 0.1;

	this.type = ENTITY;

	this.facing = null;

	try {this.image = imgEntityGeneric;}
	catch (e) {}
	this.width = tileWidth;
	this.height = tileHeight;

	//entity management code
	if (!mpActive || mpMode==SERVER) {
		var ind = entityManager.register(this);
		this.arrIndex = ind;
	}
})
.methods({
	emitConstruct: function() {
		if (!(typeof io === 'undefined') && mpMode==SERVER) {
			//console.log("EMITTING NEWENT");
			//console.dir([this.arrIndex,this.type,this.serializable()]);
			io.sockets.emit("newent",makeNewent(this));
			this.mpUpdate();
		}
		else {
			//nothing to see here, move along
			//console.log("Server not operational, cannot emit.");
		}
	},
	step: function(dlt) {
		var sx = Math.abs(dlt*this.xs);
		var sy = Math.abs(dlt*this.ys);

		//move for xspeed
		var xm = this.xs>0?1:-1;
		for (var xx=0; xx<Math.floor(sx); xx++) {
			var ctile = tileAt(this.x+xm+(xm*this.width*0.5),this.y);
			if (ctile!=null && !isSolid(ctile)) {
				this.x+=xm;
			}
			else {
				this.collide(ctile);
				this.xs=0;
				break;
			}
		}
		var curtile = tileAt(this.x+(this.xs%1)+(xm*this.width*0.5),this.y);
		if (curtile!=null && !isSolid(curtile)) {this.x+=(this.xs%1);}

		//move for yspeed
		var ym = this.ys>0?1:-1;
		for (var yy=0; yy<Math.floor(sy); yy++) {
			var ctile = tileAt(this.x,this.y+ym+(ym*this.height*0.5));
			if (ctile!=null && !isSolid(ctile)) {
				this.y+=ym;
			}
			else {
				this.collide(ctile);
				this.ys=0;
				break;
			}
		}
		curtile = tileAt(this.x,this.y+(this.ys%1)+(ym*this.height*0.5));
		if (curtile!=null && !isSolid(curtile)) {this.y+=(this.ys%1);}

		//apply friction
		this.xs*=1-(this.friction*dlt);
		this.ys*=1-(this.friction*dlt);

		//tell server to send updates
		this.mpFrameUpdate();

		//deprecated
		/*this.x+=d(this.xs);
		this.y+=d(this.ys);*/

		if (this.life<=0) {this.die();}

		if (mpMode == SERVER) {
		networkManager.addProperties(this,
				[
					"x",
					"y",
					"xs",
					"ys",
					"life",
					"facing",
				],this.owner||io.sockets.broadcast);
		}
	},
	damage: function(amount, damager) {
		this.life-=amount;
		if (particlesEnabled) {
			for (var i=0; i<Math.ceil((amount/(this.maxlife>0?this.maxlife:1))*6); i++) {
				new BloodSplat(this.x-this.width*0.5+irand(this.width),this.y-this.height*0.5+irand(this.height),0,0);
			}
		}
		if (this.life<=0) {this.die(damager);}
	},
	die: function(killer) {
		if (mpMode==CLIENT) {
			var dir = Math.atan2(killer.ys, killer.xs);
			var len = Math.sqrt(killer.xs*killer.xs + killer.ys*killer.ys);
			for (var i=0; i<14; i++) {
				var mDir = grandr(-0.5,0.5)+dir;
				var mDist = Math.random()*Math.random()*len*2;
				var dx = Math.cos(mDir)*mDist;
				var dy = Math.sin(mDir)*mDist;
				var bs = new BloodSplat(this.x+irandr(-this.width*0.25,this.width*0.25),this.y+irandr(-this.height*0.25,this.height*0.25),dx,dy);
				bs.life = bs.maxlife = irandr(2,7);
			}
		}

		if (Math.random()<this.dropchance) {
			this.doDrops();
		}

		this.destroy();
	},

	doDrops: function() {
		//drop items upon death
	},

	collide: function(tile) {
		//override with collision logic
	},

	getNearby: function(range) {
		return entityManager.getNearby(this, range);
	},

	render: function(x,y) {
		if (entityShadows) {
			ctx.globalAlpha = 0.4;
			ctx.drawImage(imgShadow,x-tileWidth/2,y+tileHeight/5,tileWidth,tileHeight/2);

			ctx.globalAlpha = 1;
		}
		ctx.drawImage(this.image,x-this.width/2,y-this.height/2,this.width,this.height);
	},
	destroy: function() {
		/*entities.splice(this.arrIndex,1);
		//shift index of other items
		for (var i=this.arrIndex; i<entities.length; i++) {
			entities[i].arrIndex-=1;
		}*/

		//delete entities[this.arrIndex];
		if (mpMode==SERVER) {
			io.sockets.emit("delent",{arrIndex: this.arrIndex});
		}

		entityManager.unregister(this.arrIndex);
	},
	mpUpdate: function() {
		if (mpMode==SERVER) {
			try {
				//io.sockets.emit("entity",CircularJSON.stringify(this, safeJSON));

				var ser = this.serializable();
				io.sockets.emit("entity",ser);
				//console.log(ser);
			}
			catch (e) {
				//console.log(this);
				console.log(e);
			}
		}
	},
	mpFrameUpdate: function() {
		this.mpUpdate();
	},
	serializable: function(output,depth) {
		if (!depth) {depth = 0;}
		if (depth>MAX_SER_DEPTH) {return;}
		//console.log(arguments.callee.caller.toString() + ": "+depth);
		if (!output) {output = {};}
		//else {output = EntityReference.make(this);}

		for (var prop in this) {
			if (this[prop] != null && this[prop] != undefined) {
			//console.log("setting "+prop);
				if (prop == "owner") {
					//this has to be here for some reason
				}
				else if (typeof this[prop] === 'undefined') {
					output[prop] = undefined;
				}
				else if (typeof this[prop].serializable === 'function') {
					output[prop] = this[prop].serializable(output[prop],depth+1);
					//console.log("ser");//soutput = "SER";
				}
				else if (!(typeof this[prop] === 'function')) {
					if (typeof this[prop] === 'object') {
						//needs a serializer
					}
					else {
						output[prop] = this[prop];
					}
				}
			}
		}

		delete output.owner; //shhh it's okay

		return output;
	},
	unserialize: function(src,dest,depth) {
		if (!depth) {depth = 0;}
		if (typeof dest === 'undefined') {dest = this;}
		for (var prop in src) {
			//console.log("    ".repeat(depth)+"src["+prop+"] = "+src[prop]);
			if (typeof dest[prop] === 'undefined' || dest[prop] == null) {dest[prop] = {};}
			/*console.log("Deserializing:");
			console.log(" dest[prop] = ");
			console.dir(dest[prop]);
			console.log(" src[prop] = ");
			console.dir(src[prop]);*/
			if (src[prop].type && src[prop].type>10000) {
				//console.log("hurp");
				if (dest[prop].type != src[prop].type) {dest[prop] = constructItem(src[prop].type);}
				dest[prop].unserialize(src[prop],dest[prop]);
			}
			else if (typeof src[prop] === 'object') {
				this.unserialize(src[prop],dest[prop],depth+1);
			}
			else {
				dest[prop] = src[prop];
			}
		}
	}
});
