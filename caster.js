//http://tavianator.com/fast-branchless-raybounding-box-intersections/
fmax = function(a,b) {return a<b?b:a;}
fmin = function(a,b) {return a<b?a:b;}
function rayBoxIntersect(ray, box) {
	var tx1 = (box.x1 - ray.x)/ray.vx;
  var tx2 = (box.x2 - ray.x)/ray.vx;

  var tmin = fmin(tx1, tx2);
  var tmax = fmax(tx1, tx2);

  var ty1 = (box.y1 - ray.y)/ray.vy;
  var ty2 = (box.y2 - ray.y)/ray.vy;

  tmin = fmax(tmin, fmin(ty1, ty2));
  tmax = fmin(tmax, fmax(ty1, ty2));

  if (tmax >= 0 && tmax >= tmin) {
		return {
			x: ray.x + ray.vx*tmin,
			y: ray.y + ray.vy*tmin,
			t: tmin
		};
	}
	return false;
}

function cacheShadowPoints(level) {
	var gt = function(x,y) {
		if (x<0 || y<0 || x>=level.getWidth() || y>=level.getHeight()) return {solid: false};
		return level.getTile(x,y);
	}

	level.shadowBoxes = [];
	level.shadowPoints = [];

	var consumed = [];
	for (var x=0; x<level.getWidth(); x++) {
		for (var y=0; y<level.getWidth(); y++) {
			var tile = level.getTile(x,y);
			if (!tile.solid) continue;
			var dx=0, dy=0;

			if (gt(x-1, y).solid) dx = -1;
			else if (gt(x+1, y).solid) dx = 1;
			else if (gt(x, y-1).solid) dy = -1;
			else if (gt(x, y+1).solid) dy = 1;
			else tile = {solid: false};

			var tx = x, ty = y;
			while (tx>=0 && y>=0 && tx<level.getWidth() && y<level.getHeight() && tile.solid && consumed.indexOf(tile) < 0) {
				consumed.push(tile);
				tx += dx;
				ty += dy;
				tile = level.getTile(tx, ty);
			}

			var x1 = x*tileWidth,
					y1 = y*tileHeight,
					x2 = tx*tileWidth+tileWidth,
					y2 = ty*tileWidth+tileHeight;

			level.shadowBoxes.push({
				x1: x1,
				y1: y1,
				x2: x2,
				y2: y2
			});
			level.shadowPoints.push({x: x1, y: y1});
			level.shadowPoints.push({x: x2, y: y1});
			level.shadowPoints.push({x: x1, y: y2});
			level.shadowPoints.push({x: x2, y: y2});
		}
	}
}

function renderCastShadows() {
	var pang = function(point) {
		if (point === null) return Infinity;
		var dx = point.x - player.x,
				dy = point.y - player.y;
		return Math.atan2(dy,dx);
	};

	var boxes = [
		{x1: viewX, y1: viewY, x2: viewX+viewWidth, y2: viewY},
		{x1: viewX, y1: viewY, x2: viewX, y2: viewY+viewHeight},
		{x1: viewX+viewWidth, y1: viewY, x2: viewX+viewWidth, y2: viewY+viewHeight},
		{x1: viewX, y1: viewY+viewHeight, x2: viewX+viewWidth, y2: viewY+viewHeight}
	], points = [
		{x: viewX, y: viewY},
		{x: viewX+viewWidth, y: viewY},
		{x: viewX, y: viewY+viewHeight},
		{x: viewX+viewWidth, y: viewY+viewHeight}
	];
	boxes.push.apply(boxes, gameLevel.shadowBoxes.filter(function(box){
		return true;
		return Util.inView(box.x1, box.y1) ||
					 Util.inView(box.x2, box.y1) ||
					 Util.inView(box.x1, box.y2) ||
					 Util.inView(box.x2, box.y2);
	}));
	points.push.apply(boxes, gameLevel.shadowPoints.filter(function(point){
		return true;
		return Util.inView(point.x, point.y);
	}));

	// for (var i=0; i<solidRenderedBlocks.length; i++) {
	// 	var tile = solidRenderedBlocks[i];
	// 	var tilex = tile.x * tileWidth,
	// 			tiley = tile.y * tileHeight;
	//
	// 	boxes.push({
	// 		x1: tilex,
	// 		y1: tiley,
	// 		x2: tilex+tileWidth,
	// 		y2: tiley+tileHeight
	// 	});
	// 	points.push({x: tilex, y: tiley});
	// 	points.push({x: tilex+tileWidth, y: tiley});
	// 	points.push({x: tilex, y: tiley+tileHeight});
	// 	points.push({x: tilex+tileWidth, y: tiley+tileHeight});
	// }

	points.sort(function(a,b){return pang(a)-pang(b)});

	grctx.globalCompositeOperation = "source-over";
	grctx.beginPath();
	grctx.fillStyle = "white";

	var started = false, moved = 0;

	for (var i=0; i<points.length; i++) {
		var p = points[i];

		for (var k=-1; k<=1; k++) {
			var dx = p.x - player.x,
					dy = p.y - player.y;
			var dir = Math.atan2(dy,dx)+k*0.0001;
			var vx = Math.cos(dir),
					vy = Math.sin(dir);

			var min = {t: Infinity};
			for (var j=0; j<boxes.length; j++) {
				var isect = rayBoxIntersect({
					x: player.x,
					y: player.y,
					vx: vx,
					vy: vy
				}, boxes[j]);
				if (isect && isect.t < min.t) {
					min = isect;
				}
			}

			if (!started) {
				started = true;
				grctx.moveTo(min.x - viewX, min.y - viewY);
			}
			else grctx.lineTo(min.x - viewX, min.y - viewY);
		}
	}

	grctx.fill();
};
