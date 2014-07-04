T_SEARCH=-1;
Hostile = Entity.extend(function(x,y,vr){
	this.target = T_SEARCH;
	this.visionRadius = vr||50;
	this.spd = 1;
	this.facing = 0;
	this.inv = new Inventory(1,this);
	this.pointValue = 10;

	this.type = HOSTILE;

	var dx = player.x-this.x;
	var dy = player.y-this.y;
	if (dx<viewWidth/2||dy<viewHeight/2) {
		this.destroy();
	}
})
.methods({
	mpFrameUpdate: function() { //don't update automagically
	},
	step: function(dlt) {
		this.supr(dlt);

		if (this.target>=0) {this.target = getEntityReference(this.target);}

		if (this.target==T_SEARCH) { //need to find a target (the player for now)
			//find the nearest target
			var minDist=Infinity,targ=null;
			for (var i=0; i<entityManager.length(); i++) {
				var ent = entityManager.get(i);
				if (ent instanceof Player) {
					var dist = pDist(this.x,this.y,ent.x,ent.y);
					if (dist<minDist) {
						minDist = dist;
						targ = ent;
					}
				}
			}
			if (targ!=null) {
				if (pDist(this.x,this.y,targ.x,targ.y)<this.visionRadius) { //see if in range
					this.target = targ;
					this.mpUpdate();
				}
			}
		}
		else {
			var targ = getEntityReference(this.target);
			var targetDist = pDist(this.x,this.y,targ.x,targ.y);
			var targetDir = pDir(this.x,this.y,targ.x,targ.y);
			this.facing = targetDir;

			if (targetDist>this.visionRadius*2) { //see if too far to follow
				targ = T_SEARCH; //reset target
			}
			else { //target is close enough to follow
				//calculate direction to target and move toward it at constant speed
				var pd = targetDir;
				this.xs = lDirX(this.spd,pd);
				this.ys = lDirY(this.spd,pd);
			}

			var invSelected = this.inv.getSelected();
			if (invSelected instanceof Weapon) {
				if (targetDist<invSelected.range) {
					this.attack(targ);
					this.mpUpdate();
				}
			}
		}

		if (this.target!=T_SEARCH) {this.target = makeEntityReference(this.target);}
	},

	attack: function(entity) {
		this.inv.getSelected().fire();
		//can be overriden to provide custom attack behavior
	},

	die: function() {
		this.supr();
		if (mpMode != SERVER) {gameScore+=this.pointValue;}
		sndSplat.random().play(pDist(this.x,this.y,player.x,player.y));
	}
});
