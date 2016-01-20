Bullet = Projectile.extend(function(x,y,damage,sender){
	this.damage = damage||20;
	this.xp=null;
	this.yp=null;
	if (typeof imgBullet !== "undefined") this.image = imgBullet;
	this.sender = makeEntityReference(sender);

	this.col1 = "255,205,0";
	this.col2 = "220,170,0";

	this.light = null;
	this.light2 = null;

	this.type = BULLET;
	this.time = 0;

	this.emitConstruct();
})
.methods({
	step: function(dlt) {
		this.time+=dlt;
		this.xp=this.x;
		this.yp=this.y;
		this.supr(dlt);
		if (Math.abs(this.xs)+Math.abs(this.ys)<3) {this.destroy();}
	},
	collide: function(thing) {
		if (thing instanceof Entity) {
			thing.damage(this.damage, this);

			if (thing instanceof Hostile) {
				var dx = this.xs;
				var dy = this.ys;
				var ang = Math.atan2(dy, dx);

				thing.xs += dx*0.05;
				thing.ys += dy*0.05;

				for (var i=0; i<~~(this.damage/10)+1; i++) {
					var a = ang+Util.grandr(-0.8, 0.8);
					var spd = Util.grandr(0,6.5);
					var xx = Math.cos(a)*spd;
					var yy = Math.sin(a)*spd;
					var spl = new Splatter(thing.x+Util.grandr(-8,8),thing.y+Util.grandr(-8,8),xx,yy,Util.grandr(0,4));
					if (yy<0) {spl.depth = 1;}
				}
			}
		}
		else if (thing instanceof Tile) {
			for (var i=0; i<8; i++) {
				new Spark(this.x,this.y,Util.grandr(-8,8),Util.grandr(-8,8),this.col1);
			}

			sndBulletImpact.play(Util.pointDist(this.x,this.y,player.x,player.y));
		}
		this.destroy();
	},
	render: function(x,y) {
		if (this.light==null) {
			this.light = new EntityLight(this,"rgba("+this.col1+",1)",40,1.0);
			registerLight(this.light);

			this.light2 = new EntityLight(this,"rgba("+this.col2+",1)",120,0.6);
			registerLight(this.light2);
		}

		if (this.xp!=null) {
			var timer = Math.max(0,6-this.time)/6;

			/*var grad= ctx.createLinearGradient(x, y, this.xp, this.yp);
			grad.addColorStop(0, "rgba(255,255,255,1)");
			grad.addColorStop(1, "rgba(255,255,255,0.5)");*/

			var grad0= ctx.createLinearGradient(x, y, this.xp-viewX, this.yp-viewY);
			grad0.addColorStop(0, "rgba(255,255,255,1)");
			grad0.addColorStop(1, "rgba(255,255,255,0.6)");

			var grad1= ctx.createLinearGradient(x, y, this.xp-viewX, this.yp-viewY);
			grad1.addColorStop(0, "rgba("+this.col1+",1)");
			grad1.addColorStop(0.6, "rgba("+this.col2+",0.2)");

			ctx.lineCap = "butt";

			ctx.lineWidth = 4.5+5*timer*timer;

			var xs = this.xs * (1+timer*0.1),
				ys = this.ys * (1+timer*0.1);

			ctx.strokeStyle = grad1;
			ctx.beginPath();
			ctx.moveTo(x-xs, y-ys);
			ctx.lineTo(x,y);
			ctx.stroke();

			ctx.lineWidth = 1+1*timer*timer;
			ctx.strokeStyle = grad0;
			ctx.beginPath();
			ctx.moveTo(x-xs, y-ys);
			ctx.lineTo(x+xs/20,y+ys/20);
			ctx.stroke();
		}

	},
	destroy: function() {
		unregisterLight(this.light);
		unregisterLight(this.light2);
		this.supr();
	}
});
