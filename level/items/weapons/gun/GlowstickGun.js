GlowstickGun = Gun.extend(function() {
	this.name = "Glowstick Package";
	this.clipsize = 2;
	this.ammo = this.clipsize;
	this.delay = 20;
	this.spread = 4;
	this.spd = 12;
	this.friction = 0.07;
	this.snd = sndGun3;
	if (typeof glowstickIcon !== "undefined") this.icon = glowstickIcon;
	this.type = GLOWSTICKGUN;
})
.methods({
	bullet: function() {
		//vector converted to xspeed/yspeed
		var user = getEntityReference(this.owner);
		var dir = user.facing+Util.radians(Util.grand()*this.spread-this.spread*0.5);
		var xs = Math.cos(dir)*this.spd;
		var ys = Math.sin(dir)*this.spd;

		//create bullet and set speeds
		var blt = new Glowstick(user.x,user.y,user);
		blt.xs = xs;
		blt.ys = ys;
		blt.friction = this.friction*(0.8+Util.grand(0.4));
		blt.col1 = this.col1;
		blt.col2 = this.col2;
		return blt;
	}
});
