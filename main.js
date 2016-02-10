//Portion of initialization code shared between client and server

spawnInterval = null;
var playerPathfinder = null;
startGame = function(skipGenerate, callback) {
	if (!skipGenerate) {
		//generate gameLevel
		gameLevel = LevelFactory.makeEmptyRoom(180,180);
		gameLevel = LevelFactory.addRectRooms(gameLevel,16);
		gameLevel = LevelFactory.addPlants(gameLevel,0.1);
		gameLevel = LevelFactory.addDoorways(gameLevel,0.1);

		//create an area for the player to start
		gameLevel = LevelFactory.fillTileRect(gameLevel,
			~~(gameLevel.getWidth()/2)-10,
			~~(gameLevel.getHeight()/2)-10,
			~~(gameLevel.getWidth()/2)+10,
			~~(gameLevel.getHeight()/2)+10,
		FLOOR);
		gameLevel = LevelFactory.drawTileRect(gameLevel,
			~~(gameLevel.getWidth()/2)-10,
			~~(gameLevel.getHeight()/2)-10,
			~~(gameLevel.getWidth()/2)+10,
			~~(gameLevel.getHeight()/2)+10,
		WALL);
		gameLevel = LevelFactory.addBlockNoise(gameLevel,
			~~(gameLevel.getWidth()/2)-10,
			~~(gameLevel.getHeight()/2)-10,
			~~(gameLevel.getWidth()/2)+10,
			~~(gameLevel.getHeight()/2)+10,
		FLOOR,0.2);
	}

	gameLevel.cache = new LevelCache(gameLevel, 8, function(p){
		drawLoadingScreen(p*0.95+0.05);
	}, function() {
		//populate the level with light fixtures
		// if (mpMode==CLIENT) {addLightsToLevel(gameLevel,196,"rgb(175,151,122)",512,0.4,0.3,1);}

		entityManager = new EntityManager(gameLevel);

		if (mpMode === CLIENT) {
			//car

			player = new Player(~~(gameLevel.getWidth()*tileWidth*0.5),~~(gameLevel.getHeight()*tileWidth*0.5),"Player");
			player.inv.push(new Pistol());
			player.inv.push(new AssaultRifle());
			player.inv.push(new WoodenBat());
			var zzz = new Car(gameLevel.getWidth()*tileWidth*0.1, gameLevel.getHeight()*tileHeight*0.5);
		}

		playerPathfinder = new Pathfinder(gameLevel, player);

		//tell zombies to spawn continuously
		spawnInterval = setInterval(function(){
			if (entityManager.getCount(ZOMBIE)<ZOMBIE_MAX && gameTime >= 60*20 && spawnEnabled) {
			for (var i=0; i<1; i++) {
				var dir = Math.random()*Math.PI*2,
					dist = viewWidth*0.5 + Math.random()*100;
				var pxx = player.x + Math.cos(dir)*dist,
					pxy = player.y + Math.sin(dir)*dist;
				var tx = Math.round(pxx / tileWidth);
				var ty = Math.round(pxy / tileHeight);
				var ta = tileAt(tx,ty);
				if (ta!=null && !ta.solid) {
					var zed = new Zombie(tx*tileWidth+tileWidth/2, ty*tileHeight+tileHeight/2, 80);
					zed.pathfinder = playerPathfinder;
				}
			}}
		},120);

		//spawn some loot
		var loots = [new AssaultRifle(), new AssaultRifle(), new Gauss(), new Typhoon(), new GlowstickGun(), new GlowstickGun(), new RandomGun(0.7), new RandomGun(0.7), new RandomGun(0.7), new RandomGun(0.9)];
		var spots = gameLevel.getTilesOfTypes([FLOOR, WOODFLOOR]).shuffle();
		while (loots.length>0 && spots.length>0) {
			var item = loots.pop();
			var spot = spots.pop();
			var tx = spot.x,
				ty = spot.y;
			item.disposable = true;
			var it = new DroppedItem(tx*tileWidth+tileWidth/2, ty*tileHeight+tileHeight/2,item);
		}
		for (var i=0; i<10 && spots.length>0; i++) {
			var item = new MoonDust();
			var spot = spots.pop();
			var tx = spot.x,
				ty = spot.y;
			item.disposable = false;
			var it = new DroppedItem(tx*tileWidth+tileWidth/2, ty*tileHeight+tileHeight/2,item);
		}

		callback();
	});
}

processStep = function(tdelta) {
	if (!gamePaused) {
		playerPathfinder.recalculate();

		//process entities
		for (var ec in entityManager.entities) {
			var ent = entityManager.get(ec);
			if (ent instanceof Entity) {ent.step(tdelta);}
		}

		//process particles
		if (mpMode==CLIENT) {
			for (var ec = 0; ec<particles.length; ec++) {
		    	var prt = particles[ec];
				if (prt instanceof Particle) {prt.step(tdelta);}
			}
		}

		//process items (gun timers, etc)
		for (var ic = 0; ic<items.length; ic++) {
	    	ite = items[ic];
			if (ite instanceof Item) {ite.step(tdelta);}
		}
	}
}
