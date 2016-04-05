Particle = klass(function(x,y,xs,ys,life) {
	this.x = x;
	this.y = y;
	this.xs = xs;
	this.ys = ys;
	this.maxlife = life;
	this.life = life;
	this.arrIndex = particles.push(this)-1;
	if (typeof imgBloodSplat !== "undefined") this.image = imgBloodSplat;

	this.depth = 1;
	this.gravity = 0;

	this.type = PARTICLE;
	entityManager.countEntity(this);
})
.methods({
	step: function(dlt) {
		this.x+=this.xs;
		this.y+=this.ys;
		this.ys+=this.gravity;

		this.life-=1;
		if (this.life<0) {this.destroy();}
	},
	render: function(x,y) {
		ctx.globalAlpha = this.life/this.maxlife;
		ctx.drawImage(this.image,x-this.image.width/2,y-this.image.height/2);
		ctx.globalAlpha = 1;
	},
	destroy: function() {
		particles.splice(this.arrIndex,1);
		//shift index of other items
		for (var i=this.arrIndex; i<particles.length; i++) {
			particles[i].arrIndex-=1;
		}
		if (this._counted) {
			entityManager.count[this.type]--;
		}
	},
});
