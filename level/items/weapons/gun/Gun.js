Gun = Weapon.extend(function(clipsize,ammo,delay,damage,spread,spd,user) {
	this.clipsize=clipsize||20;
	this.ammo=ammo||20;
	this.delay=delay||5;
	this.timer=0;

	this.damage = damage||10;
	this.spread = spread||3;
	this.spd = spd||17;
	this.friction = 0.001;
	this.shot = 1;

	this.owner = makeEntityReference((user||player));

	this.snd = sndGun4;
	this.type = GUN;

	this.col1 = "255,205,0";
	this.col2 = "220,170,0";
})
.methods({
	step: function() {
		this.supr();
		if (this.timer>0) {this.timer-=1;}
		else if (this.ammo=="R") {this.ammo=this.clipsize;}
	},

	fire: function() {
		if (this.timer==0) {
			if (this.ammo=="R") {this.ammo=this.clipsize;}

			if (this.ammo>0) {
				this.ammo-=1;
				if (typeof this.snd === 'object') {
					if (this.snd instanceof Array) {
						this.snd[~~(this.snd.length*Math.random())].play();
					}
					else {
						this.snd.play();
					}
				}

				for (var i=0; i<this.shot; i++) {
					this.bullet();
				}
				//console.log("Fired! Ammo: "+this.ammo);

				this.timer=this.delay;
			}
			else {
				//console.log("Reloading");
				this.reload();
			}
		}
	},

	reload: function() {
		if (this.ammo!="R") {
			this.ammo = "R";
			this.timer = 100;
		}
	},

	bullet: function() {
		//vector converted to xspeed/yspeed
		var user = getEntityReference(this.owner);
		var dir = user.facing+Util.radians(Util.grand()*this.spread-this.spread*0.5);
		var xs = Math.cos(dir)*this.spd+user.xs;
		var ys = Math.sin(dir)*this.spd+user.ys;

		//create bullet and set speeds
		var blt = new Bullet(user.x,user.y,this.damage,user);
		blt.xs = xs;
		blt.ys = ys;
		blt.friction = this.friction*(0.8+Util.grand(0.4));
		blt.col1 = this.col1;
		blt.col2 = this.col2;
		return blt;
	}
});
