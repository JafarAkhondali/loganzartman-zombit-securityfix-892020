Inventory = klass(function(size,owner) {
	this.size = size;
	this.owner = makeEntityReference(owner);
	this.inv = new Array();
	this.selected = 0;
})
.methods({
	push: function(item) {
		if (item instanceof Item) {
			if (this.inv.length<this.size) {
				item.owner = this.owner;
				this.inv.push(item);
				return this.inv.length-1;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	},

	pop: function(index) {
		index = Math.floor(index);
		if (index>=0 && index<this.inv.length) {
			this.inv[index].user = null;
			if (index==this.inv.length-1 && this.selected>=this.inv.length-2) {this.selected = this.inv.length-2;}
			return this.inv.splice(index,1);
		}
		else {
			return false;
		}
	},

	set: function(index,item) {
		index = Math.floor(index);
		if (index>=0 && index<this.inv.length) {
			this.inv[index] = item;
		}
		else {
			return false;
		}
	},

	select: function(index) {
		if (index>=0 && index<this.inv.length) {
			this.selected = index;
			return index;
		}
		else {
			return false;
		}
	},

	get: function(index) {
		index = Math.floor(index);
		if (index>=0 && index<this.inv.length) {
			return this.inv[index];
		}
		else {
			return false;
		}
	},

	getSelected: function() {
		return this.inv[this.selected];
	},

	getArray: function() {
		return this.inv.pad(this.size, null);
	},

	serializable: function(output,depth) {
		if (depth>MAX_SER_DEPTH) {return;}
		//console.log(depth);
		if (!output) {output = {};}

		output.size = this.size;
		output.owner = makeEntityReference(this.owner);
		output.selected = this.selected;
		output.inv = [];

		for (var i=0; i<this.inv.length; i++) {
			output.inv[i] = this.inv[i].serializable({},depth+1);
		}

		//console.log(output);
		return output;
	},
	unserialize: function(src,dest) {
		console.log("THIS GOT CALLED");
		if (typeof dest === 'undefined') {dest = this;}
		for (var prop in src) {
			//console.log("    src["+prop+"] = "+src[prop]);
			if (typeof dest[prop] === 'undefined') {dest[prop] = {};}
			if (typeof src[prop] === 'object') {
				if (src[prop].type && src[prop].type>10000) {
					//if (!(dest[prop] instanceof Item)) {
						console.log("SOMETHING IS HAPPENING");

					//}
				}
				this.unserialize(src[prop],dest[prop]);
			}
			else {
				dest[prop] = src[prop];
			}
		}
	}
})
