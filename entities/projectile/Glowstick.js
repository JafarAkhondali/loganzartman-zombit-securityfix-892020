Glowstick = Projectile.extend(function(x,y,owner) {
	this.x = x;
	this.y = y;
	this.owner = makeEntityReference(owner);
	this.light = null;

	this.light = new EntityLight(this,"rgb("+this.col+")",255,0.8,1.0);
	registerLight(this.light);

	this.brightness = 255;
	this.col = Math.floor(this.brightness/3)+","+Math.floor(this.brightness)+","+Math.floor(this.brightness/3);

	if (typeof imgGlowstickIcon !== "undefined") this.image = imgGlowstickIcon;
})
.methods({
	step: function(dlt) {
		this.supr(dlt);
		if (this.light.size) {
			this.light.size-=0.1;
		}
		this.brightness-=0.1;
		this.col = Math.floor(this.brightness/3)+","+Math.floor(this.brightness)+","+Math.floor(this.brightness/3);
		if (this.light.size<0) {this.destroy();}
	},
	render: function(x,y) {
		ctx.drawImage(this.image,x-tileWidth/2,y-tileHeight/2,tileWidth,tileHeight);
	},
	destroy: function() {
		unregisterLight(this.light);
		this.supr();
	}
});
