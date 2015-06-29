Player = Entity.extend(function(x,y,name,owner){
	this.name = name;
	this.owner = owner||window;
	try {this.image = imgPlayer_W;}
	catch (e) {}
	this.spdInc = 0.5;
	this.inv = new Inventory(7,this);
	this.friction = 0.2;
	this.facing = 0;
	this.maxSpd = 5;
	this.tracer = new LaserRenderer(lictx, "red");

	this.healCooldown = 200, this.healTimer = 0, this.healRate = 0.025;

	this.type = PLAYER;

	this.emitConstruct();

	this.footstepInterval = 40;
	this.footstepTimer = 0;
})
.methods({
	step: function(dlt) {
		this.control(dlt);
		this.supr(dlt);

		if (Math.abs(this.xs)<0.1) {this.xs = 0;}
		if (Math.abs(this.ys)<0.1) {this.ys = 0;}

		//clip speed
		if (this.xs>this.maxSpd) {this.xs=this.maxSpd;}
		if (this.xs<-this.maxSpd) {this.xs=-this.maxSpd;}
		if (this.ys>this.maxSpd) {this.ys=this.maxSpd;}
		if (this.ys<-this.maxSpd) {this.ys=-this.maxSpd;}

		//move view to player
		if (mpMode==CLIENT) {
			var mOffsetX = (mouseX-viewWidth/2)*viewRange;
			var mOffsetY = (mouseY-viewHeight/2)*viewRange;
			viewX = (viewX*3+(~~(this.x-viewWidth/2+mOffsetX)))/4;
			viewY = (viewY*3+(~~(this.y-viewHeight/2+mOffsetY)))/4;

			//clip view pos

			if (viewX<0) {viewX=0;}
			if (viewX>gameLevel.getWidth()*tileWidth-viewWidth) {viewX = gameLevel.getWidth()*tileWidth-viewWidth;}
			if (viewY<0) {viewY=0;}
			if (viewY>gameLevel.getHeight()*tileHeight-viewHeight) {viewY = gameLevel.getHeight()*tileHeight-viewHeight;}
		}

		//heal player
		if (this.healTimer == 0) {
            this.life = Math.min(this.maxlife,this.life+this.healRate);
		}
		else {
            this.healTimer -= 1;
		}

		//point player toward mouse
		//player position corrected for view
		if (mpMode==CLIENT && !(typeof player === 'undefined')) {
			var pcx = this.x-viewX;
			var pcy = this.y-viewY;
			//console.log(pcx+","+pcy)

			//direction from corrected position to mouse
			var dir = pDir(pcx,pcy,mouseX,mouseY);
			player.facing = dir;
		}

		if (this.footstepTimer >= this.footstepInterval) {
			this.footstepTimer = 0;
			var tile = gameLevel.getTile(~~(this.x/tileWidth),~~(this.y/tileWidth));
			if (tile.sound!=null) {
				tile.sound.audio.volume = (grandr(0,1));
				tile.sound.play();
			}
		}
		this.footstepTimer+=Math.sqrt(this.xs*this.xs+this.ys*this.ys);
	},
	render: function(x,y) {
		this.supr(x,y);
		//if (this != player) {
			ctx.font = '8px "volter"';
			ctx.textAlign = 'center';
			var tw = ctx.measureText(this.name).width;

			ctx.fillStyle = "rgba(0,0,0,0.25)";
			ctx.fillRect(x-tw/2-2,y-this.image.height/2-13,tw+4,12);

			ctx.fillStyle = "rgba(255,255,255,0.5)";
			ctx.fillText(this.name, x, y-12);

			ctx.textAlign = 'left';
		//}
		this.tracer.tracePath(this);
	},
	damage: function(amount) {
		var ht = new FloatingText("-"+Math.round(amount),"255,55,55",this.x,this.y,100);
		ht.ys=-1;
		ht.xs=Math.random()*0.5-0.25;
		this.supr(amount);
		sndHit.play();
		this.healTimer = this.healCooldown;
	},
	die: function() {
		endGame();
	},

	/*
	* Change the player's image to face the
	* direction its moving.
	*/
	control: function() {
		//accept keyboard input
		if (this.owner.keys[VK_A]) {this.image=imgPlayer_A;this.xs-=d(this.spdInc*dlt);}
		if (this.owner.keys[VK_D]) {this.image=imgPlayer_D;this.xs+=d(this.spdInc*dlt);}
		if (this.owner.keys[VK_W]) {this.image=imgPlayer_W;this.ys-=d(this.spdInc*dlt);}
		if (this.owner.keys[VK_S]) {this.image=imgPlayer_S;this.ys+=d(this.spdInc*dlt);}

		//inv selection keys
		for (var nk=49; nk<58; nk++) {
			if (this.owner.keys[nk]) {this.inv.select(nk-49);}
		}

		//reload
		if (this.inv && this.inv.getSelected()) {
			var rel = this.inv.getSelected().reload;
			if (this.owner.keys[VK_R] && typeof rel === 'function') {this.inv.getSelected().reload();}
		}

		//drop items
		if (this.inv && this.inv.getSelected() && this.inv.inv.length>1) {
			if (this.owner.keys[VK_Q]) {
				this.owner.keys[VK_Q] = false;
				var dr = new DroppedItem(this.x,this.y,this.inv.pop(this.inv.selected)[0]);
				dr.xs = lDirX(5,this.facing);
				dr.ys = lDirY(5,this.facing);
			}
		}

		//process mouse input
		if (this.owner.mouseLeft) {
			var item = this.inv.getSelected();
			if (item instanceof Weapon) {
				item.fire();
			}
		}

		if (this.owner.scrolltotal!=0) {
			var invpos = (this.inv.selected+this.owner.scrolltotal)%this.inv.size;
			this.inv.select(invpos<0?this.inv.size+invpos:invpos);
			this.owner.scrolltotal = 0;
		}
	}
});
