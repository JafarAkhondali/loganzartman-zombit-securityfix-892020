Gauss = Gun.extend(function(){
	this.name = "Gauss Rifle";
	this.clipsize = 16;
	this.ammo = this.clipsize;
	this.delay = 20;
	this.damage = 400;
	this.spread = 1;
	this.spd = 90;
	this.snd = sndGun2;
	if (typeof gaussIcon !== "undefined") this.icon = gaussIcon;
	this.type = GAUSS;
})
.methods({
});
