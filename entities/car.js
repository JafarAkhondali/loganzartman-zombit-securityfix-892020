var Car = Entity.extend(function(x,y){
	this.type = -1;
	this.friction = 0.0;
	this.image = imgCar;
	this.width = this.image.width*0.8;
	this.height = this.image.height*0.7;
	this.life = 88;
	this.collidesOther = false;
	this.otherCollides = true;
	this.moved = false;
	this.stopped = false;
	this.stopping = false;
	this.y0 = this.y;
})
.methods({
	step: function(delta) {
		this.supr(delta);
		if (gameTime < SCREEN_BLACK_TIME) this.xs = 0;
		else if (!this.moved) {
			this.moved = true;
			this.xs = 8;
		}
		if (!this.stopped && !this.stopping) {
			this.y = this.y0 + Math.sin(gameTime/10)*3 + Util.grandr(-1,1);
		}
		if (!this.stopping && gameTime > SCREEN_BLACK_TIME + 84) {
			this.friction = 0.07;
			this.stopping = true;
		}
		if (!this.stopped && this.moved) {
			player.x = this.x;
			player.y = this.y;
			frameBlend = 0.5;
			Shake.shake(0.01);
			player.viewControl = 0.0;
			player.mOffsetX = 0;
			player.mOffsetY = 0;
			if (Math.abs(this.xs) < 0.1) {
				this.stopped = true;
				this.stopping = false;
				sndCarDoor.play();
				player.active = true;
				player.y += 5;
			}
		}
	},

	render: function(x,y) {
		this.supr(x,y);
		if (this.stopping) {
			fxctx.lineWidth = 4;
			fxctx.strokeStyle = "rgba(0,0,0,0.5)";
			for (var i=-1; i<=1; i+=2) {
				fxctx.beginPath();
				var dx = 4,
					dy = 6 + Math.random();
				fxctx.globalAlpha = Math.min(1, (gameTime - (SCREEN_BLACK_TIME + 84)) / 7);
				fxctx.moveTo(this.x - this.width*0.5 + dx - viewX, this.y + i*this.height*0.30 + dy - viewY);
				fxctx.lineTo(this.x - this.width*0.5 + dx - this.xs - viewX, this.y + i*this.height*0.30 + dy - viewY);
				fxctx.stroke();
			}
			fxctx.lineWidth = 0;
			fxctx.globalAlpha = 1.0;
		}
	},

	damage: function() {

	}
});
