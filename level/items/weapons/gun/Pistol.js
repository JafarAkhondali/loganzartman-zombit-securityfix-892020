Pistol = Gun.extend(function(){
	this.name = "Pistol";
	this.clipsize = 12;
	this.ammo = 12;
	this.delay = 12;
	this.damage = 40;
	this.spread = 9;
	this.spd=30;
	this.snd = sndGun2;
	try{this.icon = pistolIcon;}catch(e){}
	this.type = PISTOL;
})
.methods({

});
