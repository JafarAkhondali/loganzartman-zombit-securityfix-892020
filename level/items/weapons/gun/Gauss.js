Gauss = Gun.extend(function(){
	this.name = "Gauss Rifle";
	this.clipsize = 8;
	this.ammo = this.clipsize;
	this.delay = 50;
	this.damage = 55;
	this.spread = 1;
	this.spd = 40;
	this.snd = sndGun2;
	if (typeof gaussIcon !== "undefined") this.icon = gaussIcon;
	this.type = GAUSS;
})
.methods({
});