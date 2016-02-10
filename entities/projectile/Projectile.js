Projectile = Entity.extend(function(x,y,sender){
	this.sender = makeEntityReference(sender)||null;
	this.width = 1;
	this.height = 1;
	this.friction = 0;

	this.type = PROJECTILE;

})
.methods({
	step: function(dlt) {
		this.supr(dlt);

		//check for entity collisions
		var x1=this.x-this.xs;
		var y1=this.y-this.ys;
		var x2=this.x;
		var y2=this.y;

		var senderObj = getEntityReference(this.sender);
		var nearby = this.getNearby();
    	for (var ec = 0; ec<nearby.length; ec++) {
	    	ent = nearby[ec];
			if (ent instanceof Entity && !(ent instanceof Item)) {
				if (ent!=senderObj && ent!=this && !(ent instanceof Projectile) && !(ent instanceof DroppedItem)) {
					if (collisionLine2(ent.x,ent.y,ent.width,x1,y1,x2,y2,false)) {
						this.collide(ent);
					}
				}
			}
		}
	}
});
