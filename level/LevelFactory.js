var LevelFactory = {
	makeEmptyRoom: function(w,h) { //generates a level containing a floor with walls on the sides
		var lev = new Array(w);
		for (var x=0; x<w; x++) {
			lev[x]=new Array(h);
			for (var y=0; y<h; y++) {
				lev[x][y] = new Tile(x==0||x==w-1||y==0||y==h-1?WALL:FLOOR,x,y);
			}
		}
		return new Level(lev);
	},

	addRectRooms: function(level,n) {
	    var w = level.getWidth();
	    var h = level.getHeight();

	    var minX = 0;
	    var minY = 0;
	    var maxX = minX+w-1;
	    var maxY = minY+h-1;

	    //make some rooms
	    for (var i=0; i<n; i++)
	    {
	        var x1 = Util.irand(maxX-minX);
	        var y1 = Util.irand(maxY-minY);
	        var x2 = x1+Util.irand(maxX-minX-x1);
	        var y2 = x2+Util.irand(maxY-minY-y1);

	        if (x2>maxX-minX) {x2=maxX-minX;}
	        if (y2>maxY-minY) {y2=maxY-minY;}

	        level = LevelFactory.fillTileRect(level,x1,y1,x2,y2,[FLOOR,GRASS,WOODFLOOR].random());
	        level = LevelFactory.drawTileRect(level, x1, y1, x2, y2, WALL);
	    }

	    //knock out chunks
	    for (var i=0; i<10; i++)
	    {
	        var x1 = Util.irand(maxX-minX-(w/10));
	        var y1 = Util.irand(maxY-minY-(h/10));
	        var x2 = x1+Util.irand(w/5);
	        var y2 = x2+Util.irand(h/5);

	        if (x2>maxX-minX) {x2=maxX-minX;}
	        if (y2>maxY-minY) {y2=maxY-minY;}

	        level = LevelFactory.fillTileRect(level, x1, y1, x2, y2, FLOOR);
	    }

	    return level;
	},

	addBlockNoise: function(level,x,y,x2,y2,type,frequency) {
		for (var xx=x; xx<x2; xx++) {
			for (var yy=y; yy<y2; yy++) {
				if (Math.random()<frequency) {
					level.setTile(new Tile(type,xx,yy),xx,yy);
				}
			}
		}

		return level;
	},

	addDoorways: function(level, prob) {
		for (var x=1; x<level.getWidth()-1; x++) {
			for (var y=1; y<level.getHeight()-1; y++) {
				if (Math.random()<prob && level.getTile(x,y).id==WALL) {
					level.setTile(new Tile(FLOOR,x,y),x,y);
				}
			}
		}

		return level;
	},

	addPlants: function(level,prob) {
		for (var x=1; x<level.getWidth()-1; x++) {
			for (var y=1; y<level.getHeight()-1; y++) {
				var tl = level.getTile(x-1,y).id==WALL;
				var tr = level.getTile(x+1,y).id==WALL;
				var tu = level.getTile(x,y-1).id==WALL;
				var td = level.getTile(x,y+1).id==WALL;
				if (tl&&tu || tu&&tr || tr&&td || td&&tl) {
					if (Math.random()<prob) {
						//console.log("planted at "+x+","+y);
						level.setTile(new Tile(PLANT,x,y),x,y);
					}
				}
			}
		}
		return level;
	},

	fillTileRect: function(level, x1, y1, x2, y2, type)
	{
	    for (var x=x1; x<=x2; x++)
	    {
	        for (var y=y1; y<=y2; y++)
	        {
	            level.setTile(new Tile(type,x,y),x,y);
	        }
	    }

	    return level;
	},

	drawTileRect: function(level, x1, y1, x2, y2, type)
	{
	    for (var x=x1; x<=x2; x++)
	    {
	        level.setTile(new Tile(type,x,y1),x,y1);
	        level.setTile(new Tile(type,x,y2),x,y2);
	    }

	    for (var y=y1; y<=y2; y++)
	    {
	        level.setTile(new Tile(type,x1,y),x1,y);
	        level.setTile(new Tile(type,x2,y),x2,y);
	    }

	    return level;
	},

	fromFile: function(url, callback) {
	    Util.loadJSON(url, function(data){
			if (data) {
				var level = LevelFactory.parseLevel(data);
				callback(level);
			}
			else {
				Interface.showAlert("<span style=\"color: red\">Failed to load level!</span>"+
						  "<br>Level URL: "+url+"<br><br>Note to developers: make "+
						  "sure you're not running using file:// in Chrome.",function(){
					cleanupGame();
				},500,200);
			}
		});
	},

	parseLevel: function(parsedJson) {
		var w = parsedJson.width,
			h = parsedJson.height,
			data = parsedJson.data;
		var level = [];
		for (var x=0; x<w; x++) {
			level[x] = [];
			for (var y=0; y<h; y++) {
				var idx = (y*w)+x;
				level[x][y] = new Tile(data[idx],x,y);
			}
		}
		return new Level(level);
	}
};
