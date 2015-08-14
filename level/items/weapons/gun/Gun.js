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

	this.flare = document.createElement("canvas");
	this.flare.width = imgFlare.width;
	this.flare.height = imgFlare.height;
	this.flare.cachedCol = null;

	this.mfLight = new EntityLight(player,"",200,1);
	this.mfLight = new SpecialLightContainer(this.mfLight);
	this.mfLight.timer = 0;
	this.mfLight.drawLight = function(dest,x,y,brightness,mode) {
		if (this.timer <= 0) return;
		if (dest !== ctx) {
			this.timer--;
			ctx.globalCompositeOperation = "lighten";
			this.mfLight.drawLight(ctx,x,y,brightness,mode);
			ctx.globalCompositeOperation = "source-over";
		}
		dest.save();
		dest.globalAlpha = 1;

		var sc = Util.randr(1.5,3);
		dest.translate(x,y);
		dest.rotate(player.facing);
		dest.translate(imgFlare.width/6,-imgFlare.height*sc/2);
		dest.scale(sc,sc);

		dest.drawImage(imgFlare,0,0);
		var temp = dest.globalCompositeOperation;
		dest.globalCompositeOperation = "hue";
		dest.fillStyle = "rgb("+this.col1+")";
		dest.fillRect(0,0,imgFlare.width,imgFlare.height);
		dest.globalCompositeOperation = temp;

		dest.restore();
	}
	registerLight(this.mfLight);
})
.methods({
	step: function() {
		this.supr();
		if (this.flare.cachedCol !== this.col1) {
			var fctx = this.flare.getContext("2d");
			fctx.fillStyle = "rgb("+this.col1+")";
		}
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
		var user = getEntityReference(this.owner);
		var dir = user.facing+Util.radians(Util.grand()*this.spread-this.spread*0.5);
		var xs = Math.cos(dir)*this.spd+user.xs;
		var ys = Math.sin(dir)*this.spd+user.ys;

		//create muzzle flash
		this.mfLight.timer = 2;

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
