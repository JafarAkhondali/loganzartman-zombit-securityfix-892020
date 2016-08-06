Spark = Particle.extend(function(x,y,xs,ys,col,life,size,friction,z,zs) {
	this.col = col;
	this.x = x;
	this.y = y;
	this.xs = xs;
	this.ys = ys;
	if (typeof life === "undefined") life = Util.grandr(2,5);
	this.maxlife = life;
	this.life = this.maxlife;
	if (typeof size === "undefined") size = 1;
	if (typeof friction === "undefined") friction = 0.4;
	if (typeof z === "undefined") z = 8;
	if (typeof zs === "undefined") zs = 0;

	this.friction = friction;
	this.gravity = 0;
	this.width = 0;
	this.height = 0;
	this.size = size;
	this.z = z;
	this.zs = zs;
	this.z0 = z;

	this.type = PARTICLE;
	entityManager.countEntity(this);
})
.methods({
	step: function() {
		this.supr();
		this.z += this.zs;
		this.zs -= 1;
		if (this.z < 0) {
			this.z = -this.z;
			this.zs = -this.zs*0.33;
		}
	},
	render: function(x,y) {
		y -= this.z-this.z0;
		ctx.globalCompositeOperation = "lighter";
		ctx.strokeStyle = "rgb("+this.col+")";
		ctx.lineWidth = 4*this.life/this.maxlife;
		ctx.beginPath();
		ctx.moveTo(x-this.xs,y-this.ys+this.zs);
		ctx.lineTo(x,y);
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.globalCompositeOperation = "source-over";
	}
});
