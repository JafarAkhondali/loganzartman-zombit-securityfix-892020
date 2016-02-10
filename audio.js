var sndGun1,sndGun2,sndGun3,sndGun4;
var sndTrack1,sndTrack2,sndTrack3;
var sndCarStop;
var sndFootstep,sndReload;
var sndSplat = [];
var sndBulletImpact;
var sndStep = [];

var gunSounds = {
	ar: [],
	pistol: [],
	rifle: [],
	shotgun: []
};

var volumeMaster = 1;

var playlist;
var playlistIndex = 0;

function loadAudio() {
	sndDie = loadSoundFile("res/sound/die",2,0.5);
	sndHit = loadSoundFile("res/sound/hit",2,0.8);
	sndKill = loadSoundFile("res/sound/kill",4,0.7);
	sndGun1 = loadSoundFile("res/sound/gun1",4,0.4);
	sndGun2 = loadSoundFile("res/sound/gun2",4,0.4);
	sndGun3 = loadSoundFile("res/sound/gun3",4,0.4);
	//sndGun4 = loadSoundFile("res/sound/gun4",4,0.8);
	sndFootstep = loadSoundFile("res/sound/footstep",4,0.2);
	sndReload = loadSoundFile("res/sound/reload",4,0.7);
	sndCarStop = loadSoundFile("res/sound/carStop",1,1);
	sndCarDoor = loadSoundFile("res/sound/carDoor",1,1);

	sndStep[1] = loadSoundFile("res/sound/step_1",2,0.5);
	sndStep[4] = loadSoundFile("res/sound/step_4",2,0.5);
	sndStep[5] = loadSoundFile("res/sound/step_5",2,0.5);
	sndStep[6] = loadSoundFile("res/sound/step_6",2,0.5);

	gunSounds.ar.push([
		loadSoundFile("res/sound/AR_1_1",4,0.3),
		loadSoundFile("res/sound/AR_1_2",4,0.3)
	]);

	gunSounds.ar.push([
		loadSoundFile("res/sound/AR_2_1",4,0.5),
		loadSoundFile("res/sound/AR_2_2",4,0.5)
	]);

	for (var i=0; i<4; i++) {
		sndSplat[i] = loadSoundFileAdv("res/sound/splat_"+i,2,1);
	}

	sndBulletImpact = loadSoundFileAdv("res/sound/bulletimpact",4,0.05);

	sndTrack1 = loadSoundFile("res/sound/moves");
	sndTrack1.volume = 0.2;

	sndTrack2 = loadSoundFile("res/sound/untoldStory");
	sndTrack2.volume = 0.2;

	sndTrack3 = loadSoundFile("res/sound/citySounds");
	sndTrack3.volume = 0.2;

	playlist = [sndTrack1, sndTrack2, sndTrack3];
	for (var i=0; i<playlist.length; i++) {
		playlist[i].audio.addEventListener("ended",playlistNext,false);
	}
}

function loadSoundFileAdv(src, nchannels, vol) {
	var near = loadSoundFile(src, nchannels, vol);
	var far = loadSoundFile(src+"l", nchannels, vol);
	return new AdvSound(near.audio,far.audio,nchannels,vol);
}

function loadSoundFile(src,nchannels,vol) {
	//console.log("Loading sound: "+src);
	var au = new Audio();

	var source= document.createElement('source');
	if (au.canPlayType('audio/mpeg;')) {
	    source.type= 'audio/mpeg';
	    source.src= src+'.mp3';
	} else {
	    source.type= 'audio/ogg';
	    source.src= src+'.ogg';
	}
	au.appendChild(source);

	au.load();
	au.vol = vol;

	var temp = new Sound(au,nchannels,vol);
	document.body.appendChild(au);
	return temp;
}

function AdvSound(nearSound,farSound,channels,vol) {
	this.near = nearSound;
	this.far = farSound;
	this.nchannels = channels;
	this.nearchannels = [];
	this.farchannels = [];
	this.vol = vol;

	for( var i = 0; i < this.nchannels; i++ ) {
        this.nearchannels.push( this.near.cloneNode(true) );
        this.farchannels.push( this.far.cloneNode(true) );
    }

    this.cic = 0;
}
AdvSound.prototype.play = function(dist){
	if (this.nearchannels.length>0) {
		var bal = Math.min(1,dist/(400));
		var vol = 1-Math.max(Math.min(1,(dist-200)/400),0);

		this.nearchannels[this.cic].volume = ((1-bal)*this.vol*vol)*volumeMaster;
		this.farchannels[ this.cic].volume = (bal*this.vol*vol)*volumeMaster;

		this.nearchannels[this.cic].currentTime = 0;
		this.farchannels[ this.cic].currentTime = 0;

		this.nearchannels[this.cic].play();
		this.farchannels[ this.cic].play();

		this.cic = this.cic==this.nearchannels.length-1?0:this.cic+1;
	}
}
AdvSound.prototype.setVolume = function(vol) {
	this.vol = vol;
}

function Sound(audioObj,channels,vol) {
	this.audio = audioObj;
	this.nchannels = channels;
	this.channels = [];
	this.vol = vol;

	for( var i = 0; i < this.nchannels; i++ ) {
        this.channels.push( this.audio.cloneNode(true) );
    }

	this.cic = 0; //channel index counter
}
Sound.prototype.play = function(ignoreVolume){
	if (this.channels.length>0) {
		this.channels[this.cic].volume = this.vol*volumeMaster;
		this.channels[this.cic].currentTime=0;
		this.channels[this.cic].play();
		this.cic = this.cic==this.channels.length-1?0:this.cic+1; //inc ptr
	}
}
Sound.prototype.setVolume = function(vol) {
	this.audio.volume = vol;
}

function startPlaylist() {
	playlist[playlistIndex].currentTime = 0;
	playlist[playlistIndex].play();
}

function pausePlaylist() {
	playlist[playlistIndex].pause();
}

function playlistNext() {
	playlist[playlistIndex].pause();
	playlistIndex = playlistIndex==playlist.length-1?0:playlistIndex+1;

	playlist[playlistIndex].currentTime = 0;
	playlist[playlistIndex].play();
}
