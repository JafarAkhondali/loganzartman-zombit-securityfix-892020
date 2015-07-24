var LaserRenderer = function(context, color) {
    this.ctx = context;
    this.color = color || "red";
};
LaserRenderer.PathTracer = function(x,y,xs,ys) {
    this.x = x;
    this.y = y;
    this.xs = xs;
    this.ys = ys;
    this.friction = 0;
    this.life = 1;
    this.width = 1;
    this.height = 1;
    this.collidesOther = false;
    this.collided = false;
    this.collide = function(){
        this.xs=0;
        this.ys=0;
        this.collided=true;
    };
    this.onScreen = Entity.prototype.onScreen;
};
LaserRenderer.PathTracer.prototype.step = function(dlt) {
    Entity.prototype.step.call(this, dlt);
    var nearby = Entity.prototype.getNearby.call(this);
    for (var i=nearby.length-1; i>=0; i--) {
        if (nearby[i] instanceof Hostile) {
            var dist = Util.pointDist(this.x, this.y, nearby[i].x, nearby[i].y);
            if (dist < 4) this.collide();
        }
    }
};
LaserRenderer.prototype.tracePath = function(entity) {
    if (typeof entity.inv === "undefined") return false; //sanity check

    //construct a PathTracer to trace out a laser path
    var weapon = entity.inv.getSelected();
    var tracer = new LaserRenderer.PathTracer(
        entity.x+Math.cos(entity.facing)*entity.width*0.5,
        entity.y+Math.sin(entity.facing)*entity.height*0.5,
        Math.cos(entity.facing)*5,//*weapon.spd*0.5,
        Math.sin(entity.facing)*5//*weapon.spd*0.5
    );

    //set up to draw laser line on a canvas
    this.ctx.globalCompositeOperation = "lighten";
    this.ctx.strokeStyle = this.color;
    this.ctx.globalAlpha = 1.0;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    //trace path and draw line until we hit something
    var x0 = tracer.x-viewX,
        y0 = tracer.y-viewY;
    this.ctx.moveTo(x0, y0);
    while (!tracer.collided) {
        var x1 = tracer.x-viewX,
            y1 = tracer.y-viewY;
        this.ctx.lineTo(x1, y1);
        tracer.step(1);
    }

    //finish line and draw glowing thing
    this.ctx.stroke();
    this.ctx.drawImage(imgCursor,x1-imgCursor.width*0.5,y1-imgCursor.height*0.5);
    this.ctx.globalCompositeOperation = "source-over";

    // tracer.destroy();
};
