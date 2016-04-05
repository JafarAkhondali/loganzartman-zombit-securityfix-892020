AnyGun = Gun.extend(function(func){
	this.name = "Any Item Gun";
	this.func = func;
	this.clipsize = Infinity;
	this.ammo = this.clipsize;
	this.delay = 1;
	this.damage = 1;
	this.spread = 19;
	this.spd = 30;
	this.friction = 0.12;
	this.snd = sndGun3;

	this.colIndex = 0;
	this.type = GUN;
})
.methods({
	bullet: function() {
		var user = getEntityReference(this.owner);
		var dir = user.facing+Util.radians(Util.grand()*this.spread-this.spread*0.5);
		var xs = Math.cos(dir)*this.spd+user.xs;
		var ys = Math.sin(dir)*this.spd+user.ys;

		//create muzzle flash
		this.mfLight.timer = 2;

		//create bullet and set speeds
		var blt = this.func(user.x, user.y, xs, ys);
		return blt;
	}
});
