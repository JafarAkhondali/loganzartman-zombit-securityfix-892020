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
	        var x1 = irand(maxX-minX);
	        var y1 = irand(maxY-minY);
	        var x2 = x1+irand(maxX-minX-x1);
	        var y2 = x2+irand(maxY-minY-y1);

	        if (x2>maxX-minX) {x2=maxX-minX;}
	        if (y2>maxY-minY) {y2=maxY-minY;}

	        level = LevelFactory.fillTileRect(level,x1,y1,x2,y2,[FLOOR,GRASS,WOODFLOOR].random());
	        level = LevelFactory.drawTileRect(level, x1, y1, x2, y2, WALL);
	    }

	    //knock out chunks
	    for (var i=0; i<10; i++)
	    {
	        var x1 = irand(maxX-minX-(w/10));
	        var y1 = irand(maxY-minY-(h/10));
	        var x2 = x1+irand(w/5);
	        var y2 = x2+irand(h/5);

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
	    var req = new XMLHttpRequest();
	    req.onreadystatechange = function() {
	        if (req.readyState == 4 && req.status == 200) {
	            var level = JSON.parse(req.responseText);
	            callback(LevelFactory.parseLevel(level));
	        }
	    };
	    req.open("GET", url, true);
	    try {
	        if (url === "") callback(false);
	        req.send();
	    }
	    catch (error) {
	        callback(false);
	    }
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
