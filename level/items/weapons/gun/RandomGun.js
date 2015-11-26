RandomGun = Gun.extend(function(quality){
	this.quality = quality<0?0:quality>1?1:quality;
	this.makeRandomProperties(quality);
})
.methods({
	makeRandomProperties: function(quality) {
		//crappy random gun generation that pretty much only makes assault rifles
		switch (Math.floor(Math.random()*2)) {
			case 0:
				this.clipsize = Math.ceil(Util.irandr(Util.xexp(150,quality),Util.xexp(150,quality)));
				this.ammo = this.clipsize;
				this.delay = ~~Util.grandr((1-quality)*10+2,(1-quality)*20+2);
				this.damage = Util.grandr(20*quality,(80*quality)-((this.clipsize/250)*50*quality));
				this.spread = Util.grandr(1,30-Util.xexp(15,quality));
				this.spd = Util.grandr(quality*12+8,quality*20+8);

				if (Math.random()<0.15) {
					var sn = Math.round(Util.irandr(2,4));
					this.shot = sn;
					this.delay *= Math.floor(sn/2);
				}
				else {
					this.shot = 1;
				}
			break;

			case 1:
				this.clipsize = Math.ceil(Util.irandr(Util.xexp(40,quality),Util.xexp(60,quality)));
				this.ammo = this.clipsize;
				this.delay = ~~Util.grandr((1-quality)*20+5,(1-quality)*40+5);
				this.damage = Util.grandr(20*quality,(80*quality)-((this.clipsize/250)*50*quality));
				this.spread = Util.grandr(10,80-Util.xexp(20,quality));
				this.spd = Util.grandr(quality*20+15,quality*30+15);
				this.friction = 0.1 - Util.grandr(quality*0.035,quality*0.07);
				this.shot = ~~Util.grandr(quality*3+3,quality*5+3);
			break;
		}

		this.col1 = Util.rhue(0.0,1.0,0.2,0.8,0.6,0.8);
		this.col2 = Util.rhue(0.0,1.0,0.6,1.0,0.2,0.3);
		this.snd = gunSounds.ar.random();
		if (typeof assaultIcon !== "undefined") this.icon = assaultIcon;
		this.type = ASSAULTRIFLE;
		this.name = this.makeName();
	},

	makeName: function() {
		function w(a,i,r) {var rp = ((typeof i === 'undefined')?Util.irandr(0,a.length):i+Util.irandr(-r,r)); return a[rp<0?0:rp>a.length-1?a.length-1:rp];}
		var adjectives = ["terrible","scrap","salvaged","value","average","decent","quality","refined","ultimate","god-like"];
		var words = ["photo","proto","fire","flash","death","aero","gravi","power","flux","wind","wave","bolt","knife","blade","robo","quantum","ultra","dark","hell","sun","gyro","techno","electro","multi","super","dragon","plasma","ice","magma","fart","lazer","space","qwop","cop","time"];
		var suffixes = ["shaker","slasher","blaster","whip","thrower","prong","spiker","booster","chopper","driller","belcher","seeker","ejector","repeater","wand","beam","ray","phaser","saber","launcher","slinger","razer","cutter","burner","storm","fury","hero","porker","loop","-array","zero","net","zator"];
		return (w(adjectives,~~(this.quality*adjectives.length),0)+" "+w(words)+w(suffixes)).toProperCase();
	}
});
