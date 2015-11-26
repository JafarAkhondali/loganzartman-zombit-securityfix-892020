ZombieGun = Gun.extend(function(){
	this.name = "Z-GUN";
	this.clipsize = 69;
	this.ammo = 69;
	this.delay = 5;
	this.damage = 1;
	this.spread = 5;
	this.spd=20;
	this.snd = sndGun2;
	if (typeof pistolIcon !== "undefined") this.icon = pistolIcon;
	this.type = ZOMBIEGUN;
})
.methods({
	bullet: function() {
		var blt = this.supr();
		var zed = new Zombie(player.x, player.y, 80);
		entityManager.register(zed);
		zed.xs = blt.xs;
		zed.ys = blt.ys;
		blt.destroy();
	}
});
