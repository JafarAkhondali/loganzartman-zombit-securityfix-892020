MoonDust = Item.extend(function(){
	this.name = "MoonDust";
	this.value = Util.irandr(800,1200);
	if (typeof imgMoonDust !== "undefined") this.icon = imgMoonDust;
	this.type = ITEM;
    this.displayProperty = "value";
})
.methods({
});
