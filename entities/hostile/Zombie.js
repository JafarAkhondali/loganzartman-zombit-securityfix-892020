var ZOMBIEMAXLIFE = 100;
var ZOMBIE_MAX = 100;
Zombie = Hostile.extend(function(x,y,vr){
	if (typeof imgZombie !== "undefined") this.image = imgZombie;

	this.spd=Util.grandr(0.5,1.6);
	this.visionRadius = 80
	this.life = Util.irandr(25,ZOMBIEMAXLIFE);
	this.maxlife = this.life;
	this.pointValue = Math.round(0.5*this.life);
	this.inv.push(new ZombieAttack());

	this.dropchance = 0.035;
	this.width = 16;
	this.height = 16;

	this.txs = 0;
	this.tys = 0;

	if (typeof playerPathfinder !== "undefined")
		this.pathfinder = playerPathfinder;

	this.type = ZOMBIE;
	entityManager.countEntity(this);
	this.emitConstruct();
})
.methods({
	step: function(dlt) {
		this.supr(dlt);

		if (this.target !== player) {
			//randumbly wander if no target
			if (Math.random()<0.01) {
				this.txs = -1+Math.random()*2;
				this.tys = -1+Math.random()*2;
				this.mpUpdate();
			}
			this.xs = this.xs*0.8+0.2*this.txs;
			this.ys = this.ys*0.8+0.2*this.tys;
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
		this.supr();
	}
});
