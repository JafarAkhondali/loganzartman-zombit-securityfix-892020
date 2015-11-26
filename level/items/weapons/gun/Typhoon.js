Typhoon = Gun.extend(function(){
	this.name = "Typhoon";
	this.clipsize = 320;
	this.ammo = this.clipsize;
	this.delay = 2;
	this.delay0 = 15;
	this.delay1 = 1;
	this.spooling = 0.0;
	this.spoolup = 0.007;
	this.spooldown = 0.02;
	this.damage = 13;
	this.spread0 = 10;
	this.spread1 = 24;
	this.spd = 38;
	this.friction = 0.07;
	this.snd = sndGun3;
	if (typeof typhoonIcon !== "undefined") this.icon = typhoonIcon;
	this.type = TYPHOON;
})
.methods({
	step: function() {
		this.supr();
		this.delay = ~~(this.spooling*(this.delay1-this.delay0)+this.delay0);
		this.spread = ~~(this.spooling*(this.spread1-this.spread0)+this.spread0);
		if (mouseLeft) this.spooling = Math.min(1,this.spooling+this.spoolup);
		else this.spooling = Math.max(0,this.spooling-this.spooldown);
	},

	reload: function() {
		this.supr();
		this.spooling = 0;
	}
});
