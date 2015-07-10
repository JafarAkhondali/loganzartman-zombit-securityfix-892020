var ZOMBIEMAXLIFE = 100;
Zombie = Hostile.extend(function(x,y,vr){
	try {this.image = imgZombie;}
	catch (e) {}

	Zombie.count++;

	this.spd=Util.grandr(0.5,1.6);
	this.visionRadius = 80
	this.life = Util.irandr(25,ZOMBIEMAXLIFE);
	this.maxlife = this.life;
	this.pointValue = Math.round(0.5*this.life);
	this.inv.push(new ZombieAttack());

	this.dropchance = 0.02;
	this.width = 16;
	this.height = 16;

	if (typeof playerPathfinder !== "undefined")
		this.pathfinder = playerPathfinder;

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
		var gun = new RandomGun((this.maxlife/ZOMBIEMAXLIFE)*0.8);
		new DroppedItem(this.x,this.y,gun);

	},

	die: function(killer) {
		this.supr(killer);
	},

	destroy: function() {
		Zombie.count--;
		this.supr();
	}
});
