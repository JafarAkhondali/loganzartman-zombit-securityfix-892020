Splatter = Particle.extend(function(x,y,xs,ys,zs){
	this.x = x;
	this.y = y;
	this.z = 0;
	this.xs = xs;
	this.ys = ys;
	this.zs = zs;
	this.life = 50;
	this.grav = 1;
	this.maxlife = this.life;
	try {this.image = imgSplatter[~~(Math.random()*imgSplatter.length)];}
	catch (e) {this.destroy();}

	this.depth = -1;

	this.type = BLOODSPLAT;
})
.methods ({
	step: function(dlt) {
		this.ys*=0.9;
		this.xs*=0.9;
		this.zs-=this.grav;
		this.z += this.zs;
		this.supr();
		if (this.z<-8) this.destroy();
	},
	render: function(x,y) {
		ctx.drawImage(this.image,x-this.image.width/2,y-this.image.height/2-this.z);
	},
	destroy: function() {
		this.supr();
		new BloodSplat(this.x, this.y, 0, 0);
	}
});
