AssaultRifle = Gun.extend(function(){
	this.name = "Assault Rifle";
	this.clipsize = 50;
	this.ammo = this.clipsize;
	this.delay = 6;
	this.damage = 35;
	this.spread = 10;
	this.spd = 30;
	this.snd = gunSounds.ar[1][0];
	try{this.icon = assaultIcon;}catch(e){}
	this.type = ASSAULTRIFLE;
})
.methods({
});
