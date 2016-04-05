Spark = Particle.extend(function(x,y,xs,ys,col,life) {
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
.methods({
	render: function(x,y) {
		ctx.globalCompositeOperation = "lighter";
		ctx.strokeStyle = "rgb("+this.col+")";
		ctx.beginPath();
		ctx.moveTo(x-this.xs,y-this.ys);
		ctx.lineTo(x,y);
		ctx.stroke();
		ctx.globalCompositeOperation = "source-over";
	}
});
