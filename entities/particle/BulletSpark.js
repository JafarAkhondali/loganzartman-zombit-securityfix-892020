BulletSpark = Particle.extend(function(x,y,xs,ys,col,life) {
	this.col = col;
	this.x = x;
	this.y = y;
	this.xs = xs;
	this.ys = ys;
	if (typeof life === "undefined") life = Util.grandr(2,5);
	this.maxlife = life;
	this.life = this.maxlife;

	this.friction = 0.4;
	this.gravity = 0.5;
	this.width = 0;
	this.height = 0;

	this.type = PARTICLE;
})
.statics({
	img: (function(){
		var canv = document.createElement("canvas");
		canv.width = 2;
		canv.height = 2;
		var ct = canv.getContext("2d");
		ct.fillStyle = "rgba(127,127,127,0.5)";
		ct.fillRect(0,0,canv.width,canv.height);
		return canv;
	})()
})
.methods({
	render: function(x,y) {
		ctx.drawImage(BulletSpark.img, x - BulletSpark.img.width/2, y - BulletSpark.img.height/2);
	}
});
