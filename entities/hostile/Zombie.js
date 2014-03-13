var ZOMBIEMAXLIFE = 100;
Zombie = Hostile.extend(function(x,y,vr){
	try {this.image = imgZombie;}
	catch (e) {}

	Zombie.count++;

	this.spd=0.8;
	this.visionRadius = 160
	this.life = irandr(25,ZOMBIEMAXLIFE);
	this.maxlife = this.life;
	this.pointValue = Math.round(0.5*this.life);
	this.inv.push(new ZombieAttack());

	this.type = ZOMBIE;
	this.emitConstruct();
})
.statics({
	count: 0
})
.methods({
	step: function(dlt) {
		this.supr(dlt);

		if (this.target==T_SEARCH) {
			//randumbly wander if no target
			if (Math.random()<0.01) {
				this.xs = -1+Math.random()*2;
				this.ys = -1+Math.random()*2;
				this.mpUpdate();
			}
		}
	},

	doDrops: function() {
		var gun = new RandomGun((this.maxlife/ZOMBIEMAXLIFE)*0.7);
		new DroppedItem(this.x,this.y,gun);
		
	},

	die: function() {
		this.supr();
	},

	destroy: function() {
		Zombie.count--;
		this.supr();
	}
});
