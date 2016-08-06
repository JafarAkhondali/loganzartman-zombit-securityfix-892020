Bullet = Projectile.extend(function(x,y,damage,sender){
	this.damage = damage||20;
	this.xp=null;
	this.yp=null;
	this.image = null;
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

		if (this.xp !== null)
		// for (var i=0,j=3; i<j; i++) {
		// 	var rnd = Math.random(),
		// 		dx = (i/j+rnd)*this.xs,
		// 		dy = (i/j+rnd)*this.ys;
		// 	var spk = new Spark(this.x-dx, this.y-dy, Util.randr(-0.3,0.3), Util.randr(-0.3,0.3), this.col1, Util.irandr(1,4));
		// 	spk.gravity = 0;
		// }

		this.supr(dlt);
		if (Math.abs(this.xs)+Math.abs(this.ys)<3) {this.destroy();}
	},
	collide: function(thing) {
		var xEffect = 1, yEffect = 1;
		if (thing instanceof Entity) {
			thing.damage(this.damage, this);

			if (thing instanceof Hostile) {
				var dx = this.xs;
				var dy = this.ys;
				var ang = Math.atan2(dy, dx);

				thing.xs += dx*0.05;
				thing.ys += dy*0.05;

				for (var i=0; i<~~(this.damage/3)+1; i++) {
					var a = ang+Util.grandr(-0.8, 0.8);
					var spd = Util.grandr(0,6.5)*(Math.random()>0.5?-1:1);
					var xx = Math.cos(a)*spd;
					var yy = Math.sin(a)*spd;
					var spl = new Splatter(thing.x+Util.grandr(-8,8),thing.y+Util.grandr(-8,8),xx,yy,Util.grandr(0,4));
					if (yy<0) {spl.depth = 1;}
				}
			}
		}
		else if (thing instanceof Tile) {
			var dx = this.x - (thing.x+0.5) * tileWidth;
			var dy = this.y - (thing.y+0.5) * tileHeight;
			var xLarger = Math.abs(dx) > Math.abs(dy);
			xEffect = xLarger ? -0.5 : 1;
			yEffect = xLarger ? 1 : -0.5;
			sndBulletImpact.play(Util.pointDist(this.x,this.y,player.x,player.y));
		}
		var dir = Math.atan2(this.ys * yEffect, this.xs * xEffect);
		var spd = Math.sqrt(this.xs*this.xs + this.ys*this.ys);
		for (var i=0; i<8; i++) {
			var rdir = dir + Util.grandr(-0.5,0.5);
			var rspd = spd * Util.grandr(0.05,0.4);
			new Spark(this.x,this.y,Math.cos(rdir)*rspd,Math.sin(rdir)*rspd,this.col1,Util.grandr(7,20),3,0.1,4,Util.randr(-5,1));
		}
		var light = new StaticLight(this.x, this.y, "rgb("+this.col1+")", 160, 0.4, 8);
		light.destroyOnDie = true;
		registerLight(light);
		this.destroy();
	},
	renderSprite: function(context,x,y) {
		context.globalCompositeOperation = "lighter";
		var steps = Math.sqrt(this.xs*this.xs+this.ys*this.ys)/4, dx = this.xs, dy = this.ys;
		// context.globalAlpha = 1/steps;
		for (var i=0; i<steps; i++) {
			var ox = -dx/steps*i;
			var oy = -dy/steps*i;
			context.globalAlpha = 0.5-0.5/steps*i;
			context.drawImage(this.image,x-this.image.width/2+ox,y-this.image.height/2+oy);
		}
		context.globalCompositeOperation = "source-over";
		context.globalAlpha = 1.0;
	},
	render: function(x,y) {
		if (this.light === null) {
			this.light = new EntityLight(this,"rgba("+this.col2+",1)",120,0.33);
			registerLight(this.light);

			// this.light2 = new EntityLight(this,"rgba("+this.col2+",1)",240,0.33);
			// registerLight(this.light2);
		}
		if (this.image === null) {
			//draw rotated bullet sprite
			this.image = document.createElement("canvas");
			var size = Math.ceil(Math.max(imgBullet.width, imgBullet.height));
			this.image.width = size;
			this.image.height = size;
			var context = this.image.getContext("2d");
			context.save();
			context.fillStyle = "black";
			context.fillRect(0,0,this.image.width,this.image.height);
			context.translate(imgBullet.width/2,imgBullet.height/2);
			context.rotate(Math.atan2(this.ys,this.xs));
			context.drawImage(imgBullet,-imgBullet.width/2,-imgBullet.height/2);

			//colorize
			context.restore();
			context.globalCompositeOperation = "color";
			context.fillStyle = "rgb("+this.col1+")";
			context.fillRect(0,0,this.image.width,this.image.height);
		}

		if (this.xp !== null) {
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

			//TODO: optimize
			this.renderSprite(ctx,x,y);
			this.renderSprite(lictx,x,y);
			ctx.fillStyle = "lime";
			ctx.fillRect(x,y,1,1);
			lictx.fillStyle = "lime";
			lictx.fillRect(x,y,1,1);

			// ctx.lineCap = "butt";

			// ctx.lineWidth = 2.5;

			// var xs = this.xs * (1+timer*0.1),
			// 	ys = this.ys * (1+timer*0.1);

			// ctx.strokeStyle = grad1;
			// ctx.beginPath();
			// ctx.moveTo(x-xs, y-ys);
			// ctx.lineTo(x,y);
			// ctx.stroke();

			// ctx.lineWidth = 1;
			// ctx.strokeStyle = grad0;
			// ctx.beginPath();
			// ctx.moveTo(x-xs, y-ys);
			// ctx.lineTo(x+xs/20,y+ys/20);
			// ctx.stroke();
		}

	},
	destroy: function() {
		this.image = null;
		unregisterLight(this.light);
		unregisterLight(this.light2);
		this.supr();
	}
});
