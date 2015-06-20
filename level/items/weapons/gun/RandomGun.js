RandomGun = Gun.extend(function(awesomeness){
	this.awesomeness = awesomeness<0?0:awesomeness>1?1:awesomeness;
	this.makeRandomProperties(awesomeness);
})
.methods({
	makeRandomProperties: function(awesomeness) {
		//crappy random gun generation that pretty much only makes assault rifles
		switch (Math.floor(Math.random()*2)) {
			case 0:
				this.clipsize = Math.ceil(irandr(xexp(150,awesomeness),xexp(150,awesomeness)));
				this.ammo = this.clipsize;
				this.delay = ~~grandr((1-awesomeness)*10+2,(1-awesomeness)*20+2);
				this.damage = grandr(20*awesomeness,(80*awesomeness)-((this.clipsize/250)*50*awesomeness));
				this.spread = grandr(1,30-xexp(15,awesomeness));
				this.spd = grandr(awesomeness*12+8,awesomeness*20+8);

				if (Math.random()<0.15) {
					var sn = Math.round(irandr(2,4));
					this.shot = sn;
					this.delay *= Math.floor(sn/2);
				}
				else {
					this.shot = 1;
				}
			break;

			case 1:
				this.clipsize = Math.ceil(irandr(xexp(80,awesomeness),xexp(80,awesomeness)));
				this.ammo = this.clipsize;
				this.delay = ~~grandr((1-awesomeness)*20+5,(1-awesomeness)*40+5);
				this.damage = grandr(20*awesomeness,(80*awesomeness)-((this.clipsize/250)*50*awesomeness));
				this.spread = grandr(10,60-xexp(20,awesomeness));
				this.spd = grandr(awesomeness*12+8,awesomeness*20+8);
				this.friction = 0.05 - grandr(awesomeness*0.03,awesomeness*0.04);
				this.shot = ~~grandr(awesomeness*10+3,awesomeness*15+3);
			break;
		}

		this.col1 = rcol(115,205,115,205,115,205);
		this.col2 = rcol(0,155,0,155,0,155);
		this.snd = gunSounds.ar.random();
		try{this.icon = assaultIcon;}catch(e){}
		this.type = ASSAULTRIFLE;
		this.name = this.makeName();
	},

	makeName: function() {
		function w(a,i,r) {var rp = ((typeof i === 'undefined')?irandr(0,a.length):i+irandr(-r,r)); return a[rp<0?0:rp>a.length-1?a.length-1:rp];}
		var adjectives = ["terrible","scrap","salvaged","value","average","decent","quality","refined","perfected","god-tier"];
		var words = ["photo","proto","fire","light","death","aero","gravi","power","flux","wind","wave","bolt","knife","blade","quasi","quantum","earth","dark","hell","sun","gyro","techno","electro","multi","super","dragon","plasma","ice","magma"];
		var suffixes = ["shaker","slasher","blaster","whip","thrower","prong","spiker","booster","chopper","driller","belcher","seeker","ejector","repeater","wand","beam","ray","phaser","saber","launcher","slinger","razer","cutter","burner","storm","fury"];
		return (w(adjectives,~~(this.awesomeness*adjectives.length),0)+" "+w(words)+w(suffixes)).toProperCase();
	}
});
