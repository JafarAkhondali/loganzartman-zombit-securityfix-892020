Melee = Weapon.extend(function (range,width,delay,damage,user){
	this.range = range||5;
	this.width = width||10;
	this.delay = delay||10;
	this.damage = damage||5;
	this.owner = makeEntityReference((user||player));
	this.timer = 0;
	this.type = MELEE;
})
.methods({
	step: function() {
		this.supr();
		if (this.timer>0) {this.timer-=1;}
	},
	fire: function() {
		if (this.timer==0) {
			if (this.snd) {this.snd.play();}

			//find all entities within range
			for (var ec = 0; ec<entityManager.length(); ec++) {
		    	var ent = entityManager.get(ec);
				if (ent instanceof Entity) {
					var user = getEntityReference(this.owner);
					var dst = Util.pointDist(user.x,user.y,ent.x,ent.y);
					var dr = Math.abs(Util.pointDir(user.x,user.y,ent.x,ent.y)-user.facing);
					//console.log("dist: "+dst+", dir: "+dr);
					if (dst<=this.range && ent!=user && dr<=Util.radians(this.width)) {
						this.hit(ent);
						//console.log("hit! "+ent);
					}
				}
			}

			this.timer = this.delay;
		}
	},
	hit: function(entity) {
		//can override to perform custom effect
		if (entity instanceof Entity) {
			if (typeof entity.damage === 'function') {
				entity.damage(this.damage, this);
			}
		}
	}
});
