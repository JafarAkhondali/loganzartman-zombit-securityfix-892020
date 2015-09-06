T_SEARCH=-1;
var TOO_FAR = 1000;
Hostile = Entity.extend(function(x,y,vr){
	this.target = T_SEARCH;
	this.visionRadius = vr||50;
	this.spd = 2.5;
	this.facing = 0;
	this.inv = new Inventory(1,this);
	this.pointValue = 10;

	this.type = HOSTILE;
	this.pathfinder = null;

	if (typeof player !== "undefined") {
		var dx = player.x-this.x;
		var dy = player.y-this.y;
		if (dx<viewWidth/2||dy<viewHeight/2) {
			//this.destroy();
		}
	}
})
.methods({
	mpFrameUpdate: function() { //don't update automagically
	},
	step: function(dlt) {
		this.supr(dlt);

		//get nearby entities and see if any bullets have alerted the hostile
		var nearby = this.getNearby();
		for (var i=nearby.length-1; i>=0; i--) {
			if (nearby[i] instanceof Bullet) {
				this.target = player;
				break;
			}
		}

		//something I was doing for serialization
		if (this.target>=0) {this.target = getEntityReference(this.target);}

		//if the hostile is searching for a target, see if it can target the nearby player
		if (this.target===T_SEARCH) { //need to find a target (the player for now)
			var nearby = this.getNearby(2);
			if (nearby.indexOf(player) >= 0) {
				//todo: raycast for line of sight
				var dist = Util.pointDist(this.x, this.y, player.x, player.y);
				if (dist < this.visionRadius) {
					this.target = player;
				}
			}
		}
		//the hostile has a target, follow it
		else {
			var targ = getEntityReference(this.target);

			//sanity check
			if (targ === null) {
				this.target = T_SEARCH;
				return;
			}

			var targetDist = Util.pointDist(this.x,this.y,targ.x,targ.y);
			var targetDir = 0;

			//if the target is some distance away, get direction from the pathfinder
			if (targetDist > tileWidth*2 && this.pathfinder !== null) {
				var targetDx = this.pathfinder.getBestDirection(
					Math.floor(this.x/tileWidth),
					Math.floor(this.y/tileHeight)
				);
				if (targetDx[0] === 0 && targetDx[1] === 0) {
					this.target = T_SEARCH;
					return;
				}
				else {
					targetDir = Math.atan2(targetDx[1], targetDx[0]);
				}
			}
			//if the target is close by, move straight towards it
			else {
				targetDir = Util.pointDir(this.x,this.y,targ.x,targ.y);
			}

			this.facing = targetDir;

			if (targetDist>this.visionRadius*2) { //see if too far to follow
				targ = T_SEARCH; //reset target
			}
			else { //target is close enough to follow
				//calculate direction to target and move toward it at constant speed
				var pd = targetDir;
				this.txs = this.xs*0.8+0.2*Math.cos(pd)*this.spd;
				this.tys = this.ys*0.8+0.2*Math.sin(pd)*this.spd;
			}

			//use the hostile's weapon if possible
			var invSelected = this.inv.getSelected();
			if (invSelected instanceof Weapon) {
				if (targetDist<invSelected.range) {
					this.attack(targ);
					this.mpUpdate();
				}
			}
		}

		if (this.target!=T_SEARCH) {this.target = makeEntityReference(this.target);}


		//clean up zombies that are far from the player so more can be spawned
		if (Math.abs(this.x - player.x) >= TOO_FAR || Math.abs(this.y - player.y) >= TOO_FAR) {
			this.destroy();
		}
	},

	attack: function(entity) {
		this.inv.getSelected().fire();
		//can be overriden to provide custom attack behavior
	},

	die: function(killer) {
		this.supr(killer);
		if (mpMode != SERVER) {gameScore+=this.pointValue;}
		sndSplat.random().play(Util.pointDist(this.x,this.y,player.x,player.y));
	}
});
