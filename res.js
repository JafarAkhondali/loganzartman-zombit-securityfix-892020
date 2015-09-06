//images

// icons
var pistolIcon = new Image();
pistolIcon.src = "res/icon/pistol.png";
var assaultIcon = new Image();
assaultIcon.src = "res/icon/assault.png";
var typhoonIcon = new Image();
typhoonIcon.src = "res/icon/typhoon.png";
var gaussIcon = new Image();
gaussIcon.src = "res/icon/gauss.png";
var batIcon = new Image();
batIcon.src = "res/icon/bat.png";
var glowstickIcon = new Image();
glowstickIcon.src = "res/icon/glowstick.png";
var genericIcon = new Image();
genericIcon.src = "res/icon/generic.png";

// Direction specific player images
var imgPlayer_W = new Image();
imgPlayer_W.src = "res/entity/player/player_w.png";
var imgPlayer_A = new Image();
imgPlayer_A.src = "res/entity/player/player_a.png";
var imgPlayer_S = new Image();
imgPlayer_S.src = "res/entity/player/player_s.png";
var imgPlayer_D = new Image();
imgPlayer_D.src = "res/entity/player/player_d.png";

// Entities
var imgZombie = new Image();
imgZombie.src = "res/entity/zombie.png";
var imgBullet = new Image();
imgBullet.src = "res/entity/bullet.png";
var imgCursor = new Image();
imgCursor.src = "res/entity/cursor.png";
var imgCursorInv = new Image();
imgCursorInv.src = "res/cursor_inv.png";
var imgBloodSplat1 = new Image();
imgBloodSplat1.src = "res/entity/bloodsplat2.png";
var imgBloodSplat2 = new Image();
imgBloodSplat2.src = "res/entity/bloodsplat3.png";
var imgBloodSplat3 = new Image();
imgBloodSplat3.src = "res/entity/bloodsplat4.png";
var imgShadow = new Image();
imgShadow.src = "res/entity/shadow.png";
var imgCar = new Image();
imgCar.src = "res/entity/car.png";

var images = [];
for (var i=0; i<NUM_TILES; i++) {
	images[i] = new Image();
	images[i].src = "tiles/"+i+".png";
}

var imgBorderLeft = new Image();
imgBorderLeft.src = "tiles/border-left.png";
var imgBorderTop = new Image();
imgBorderTop.src = "tiles/border-top.png";
var imgBorderRight = new Image();
imgBorderRight.src = "tiles/border-right.png";
var imgBorderBottom = new Image();
imgBorderBottom.src = "tiles/border-bottom.png";
var imgBlockShadow = new Image();
imgBlockShadow.src = "tiles/shadow.png";

var imgTitle = new Image();
imgTitle.src = "res/title.png";
var imgOverlay = new Image();
imgOverlay.src = "res/overlay.png";
var imgScreenBlood = new Image();
imgScreenBlood.src = "res/screenblood.png";
var imgGlare = new Image();
imgGlare.src = "res/glare5.png";
var imgFlashlightBeam = new Image();
imgFlashlightBeam.src = "res/flashlight.png";
var imgFlare = new Image();
imgFlare.src = "res/flare.png";

var imgLightRadialMask;
var imgLightRadial = new Image();
// imgLightRadial.onload = function() {
// 	var w = imgLightRadial.width,
// 	    h = imgLightRadial.height;
//
// 	imgLightRadialMask = document.createElement("canvas");
// 	imgLightRadialMask.width = w;
// 	imgLightRadialMask.height = h;
//
// 	var ct = imgLightRadialMask.getContext("2d");
// 	ct.drawImage(imgLightRadial,0,0);
// 	var imgdata = ct.getImageData(0,0,imgLightRadialMask.width,imgLightRadialMask.height);
// 	var data = imgdata.data;
//
// 	for (var i=0, j=w*h*4; i<j; i+=4) {
// 		data[i] = data[i+1] = data[i+2] = 0;
// 		data[i+3] = 255-data[i+3];
// 	}
//
// 	ct.putImageData(imgdata,0,0);
// }
imgLightRadial.src = "res/lightRadial.png";

var imgLightFlash = new Image();
imgLightFlash.src = "res/lightFlash.png";

var imgSplatter = [];
for (var i=0; i<5; i++) {
	imgSplatter[i] = new Image();
	imgSplatter[i].src = "res/splatter_"+i+".png";
}

//shim for future system
var Resources = {
	image: {
		zombie: imgZombie,
		bullet: imgBullet,
		cursor: imgCursor,
		bloodSplat1: imgBloodSplat1,
		bloodSplat2: imgBloodSplat2,
		bloodSplat3: imgBloodSplat3,
		player_W: imgPlayer_W,
		player_A: imgPlayer_A,
		player_S: imgPlayer_S,
		player_D: imgPlayer_D,
		borderTop: imgBorderTop,
		borderLeft: imgBorderLeft,
		borderRight: imgBorderRight,
		borderBottom: imgBorderBottom,
		blockShadow: imgBlockShadow,

		title: imgTitle,
		overlay: imgOverlay,
		screenBlood: imgScreenBlood,
		glare: imgGlare,
		flashlightBeam: imgFlashlightBeam,
		lightRadialMask: imgLightRadialMask,
		lightRadial: imgLightRadial,
		splatter: imgSplatter
	}
};
