var Car = Entity.extend(function(x,y){
	this.type = -1;
	this.friction = 0.1;
	this.image = imgCar;
	this.width = this.image.width*0.8;
	this.height = this.image.height*0.6;
	this.life = 88;
	this.collidesOther = false;
	this.otherCollides = true;
})
.methods({
	render: function(x,y) {
		this.supr(x,y);
	},

	damage: function() {

	}
});
