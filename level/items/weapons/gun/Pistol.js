Pistol = Gun.extend(function(){
	this.name = "Pistol";
	this.clipsize = 12;
	this.ammo = 12;
	this.delay = 12;
	this.damage = 40;
	this.spread = 9;
	this.spd=30;
	this.snd = sndGun2;
	if (typeof pistolIcon !== "undefined") this.icon = pistolIcon;
	this.type = PISTOL;
})
.methods({

});
