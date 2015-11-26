WoodenBat = Melee.extend(function(){
	this.range = 40;
	this.width = 40;
	this.delay = 5;
	this.damage = 55;

	this.name = "Wooden Bat";
	if (typeof batIcon !== "undefined") this.icon = batIcon;
	this.type = WOODENBAT;
})
.methods({

});