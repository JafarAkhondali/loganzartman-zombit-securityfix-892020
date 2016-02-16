BloodSplat = Particle.extend(function(x,y,xs,ys,scale){
	this.x = x;
	this.y = y;
	this.xs = xs;
	this.ys = ys;
	this.life = 1;
	this.maxlife = this.life;
	if (typeof scale === "undefined") scale = 1.0;
	this.scale = scale;
	try {this.image = [imgBloodSplat1,imgBloodSplat2,imgBloodSplat3][Math.floor(Math.random()*3)];}
	catch (e) {}

	this.type = BLOODSPLAT;
})
.methods ({
	render: function() {

	},
	step: function() {
		var scale = (this.life / this.maxlife)*0.7+0.3;
		var size = scale*this.image.width*this.scale;
		fxctx.drawImage(this.image, this.x-viewX, this.y-viewY, size, size);
		this.xs *= 0.8;
		this.ys *= 0.8;
		this.supr();
	},
	die: function() {
		this.destroy();
	}
});
