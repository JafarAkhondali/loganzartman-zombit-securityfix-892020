Item = klass(function (name){
	this.name = name||"Unknown Item";
	this.arrIndex = items.push(this);
	this.snd = null;
	if (typeof genericIcon !== "undefined") this.icon = genericIcon;
	this.type = ITEM;
})
.statics({
	ITEM: 10001
})
.methods ({
	step: function() {

	},
	destroy: function() {
		delete items[this.arrIndex];
	},
	serializable: function(output,depth) {
		if (!output) {output = {};}
		if (depth>MAX_SER_DEPTH) {return;}
		//console.log(depth);
		//else {output = EntityReference.make(this);}
		
		for (var prop in this) {
			if (this[prop] != null && this[prop] != undefined) {
			//console.log("setting "+prop);
				if (typeof this[prop] === 'undefined') {
					output[prop] = undefined;
				}
				else if (typeof this[prop].serializable === 'function') {
					output[prop] = this[prop].serializable(output[prop],depth);
					//console.log("ser");//soutput = "SER";
				}
				else if (!(typeof this[prop] === 'function')) {			
					if (typeof this[prop] === 'object') {
						//needs a serializer
					}
					else {
						output[prop] = this[prop];
					}
				}
			}
		}
		
		console.log("Owner: ");
		console.dir(makeEntityReference(this.owner));
		output.owner = makeEntityReference(this.owner);
		//delete output.owner; //shhh it's okay
		
		return output;
	},
	unserialize: function(src,dest) {
		if (typeof dest === 'undefined') {dest = this;}
		for (var prop in src) {
			//console.log("    src["+prop+"] = "+src[prop]);
			if (typeof dest[prop] === 'undefined') {dest[prop] = {};}
			if (typeof src[prop] === 'object') {
				this.unserialize(src[prop],dest[prop]);
			}
			else {
				dest[prop] = src[prop];
			}
		}
	}
});
