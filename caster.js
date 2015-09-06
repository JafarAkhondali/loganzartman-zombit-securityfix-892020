var enableShadowDebug = false;
var enableShadowCasting = true;
var enableSoftShadows = true;

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

/**
 * Generates shadow bounding boxes and assigns them to the level.
 * Rather than render "shadows" (non-visible area) from each wall tile in a
 * level, rectangles are fitted to adjacent tiles to create "shadow boxes".
 * This significantly decreases the number of vertices that must be rendered.
 * @param level the Level to generate boxes for
 */
function cacheShadowPoints(level) {
	//returns tile at (x,y) with fail-soft bounds checking
	var gt = function(x,y) {
		if (x<0 || y<0 || x>=level.getWidth() || y>=level.getHeight()) return {solid: false};
		return level.getTile(x,y);
	}

	level.shadowBoxes = [];

	var consumed = []; //tiles that have already been used
	for (var x=0; x<level.getWidth(); x++) {
		for (var y=0; y<level.getHeight(); y++) {
			var tile = level.getTile(x,y);
			if (!tile.solid || consumed.indexOf(tile) >= 0) continue;
			var dx=0, dy=0;

			//try to find a line by inspecting neighboring tiles
			if (gt(x+1, y).solid) dx = 1;
			else if (gt(x, y+1).solid) dy = 1;
			else if (gt(x-1, y).solid) dx = -1;
			else if (gt(x, y-1).solid) dy = -1;
			else tile = {solid: false};

			//follow the line
			var tx = x, ty = y;
			while (tx>=0 && y>=0 && tx<level.getWidth() && y<level.getHeight() && tile.solid && consumed.indexOf(tile) < 0) {
				consumed.push(tile);
				tx += dx;
				ty += dy;
				tile = level.getTile(tx, ty);
			}

			//move back due to overshoot by line follower
			if (tx !== x) tx--;
			if (ty !== y) ty--;

			//add multi-tile box (line)
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
		}
	}
}

/**
 * Renders vision polygon.
 * Make sure to use cacheShadowPoints first!
 */
function renderCastShadows() {
	var pang = function(point) {
		if (point === null) return Infinity;
		var dx = point.x - player.x,
				dy = point.y - player.y;
		return Math.atan2(dy,dx);
	};

	//generate points for view bounds
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

	//add all points and boxes that are visible
	var sb = gameLevel.shadowBoxes;
	for (var i=sb.length-1; i>=0; i--) {
		var box = sb[i];
		if (Util.rectInView(box)) {
			boxes.push(box);
			points.push({x: box.x1, y: box.y1});
			points.push({x: box.x2, y: box.y1});
			points.push({x: box.x1, y: box.y2});
			points.push({x: box.x2, y: box.y2});

			var edgePoints = Util.rectViewEdgePoints(box);
			if (edgePoints) {
				points.push.apply(points, edgePoints);
			}
		}
	}

	//sort points by angle so polygon can be drawn
	points.sort(function(a,b){return pang(a)-pang(b)});

	grctx.globalCompositeOperation = "source-over";
	grctx.beginPath();
	grctx.fillStyle = "white";

	var started = false, moved = 0;

	//cast to all points
	for (var i=0; i<points.length; i++) {
		var p = points[i];

		for (var k=-1; k<=1; k+=2) {
			//determine casting direction
			var dx = p.x - player.x,
				dy = p.y - player.y;
			var dir = Math.atan2(dy,dx)+k*0.0001;
			var vx = Math.cos(dir),
				vy = Math.sin(dir);

			//find closest intersection
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

			//bounds check
			if (min.x < viewX) min.x = viewX;
			if (min.y < viewY) min.y = viewY;
			if (min.x > viewX+viewWidth) min.x = viewX+viewWidth;
			if (min.y > viewY+viewHeight) min.y = viewY+viewHeight;

			//draw segment
			if (!started) {
				started = true;
				grctx.moveTo(min.x - viewX, min.y - viewY);
			}
			else grctx.lineTo(min.x - viewX, min.y - viewY);
		}
	}

	grctx.fill();

	//draw debug lines if requested
	if (enableShadowDebug) {
		for (var j=0; j<boxes.length; j++) {
			var box = boxes[j];
			grctx.strokeStyle = Util.rectInView(box)?"aqua":"red";
			grctx.lineWidth = 2;
			grctx.strokeRect(box.x1-viewX, box.y1-viewY, (box.x2-viewX)-(box.x1-viewX), (box.y2-viewY)-(box.y1-viewY));
		}
		for (var j=0; j<points.length; j++) {
			grctx.strokeStyle = "red";
			grctx.lineWidth = 1;
			grctx.beginPath();
			grctx.moveTo(player.x-viewX, player.y-viewY);
			grctx.lineTo(points[j].x-viewX, points[j].y-viewY);
			grctx.stroke();
		}
	}
};
