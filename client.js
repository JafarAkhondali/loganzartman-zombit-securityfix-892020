mpServer="localhost";
mpPort=8001;
mpReady=false;
mpActive=false;
mpConnected=false;
mpNick="player";
mpChatOpen=false;
mpTypedChat="";
mpMessages=new Array();
mpLastMessageTime=new Date().getTime();
mpMessageFadeTime=5000;
mpSocket = null;
networkManager = null;

function mpStart(nick, server, port) {
	mpActive = true;
	if (!server) {server=mpServer;}
	if (!port) {port=mpPort;}
	if (!nick) {nick=mpNick;}
	
	entityManager.clearAll();

	networkManager = new NetworkManager();

	mpServer = server;
	mpPort = port;
	mpNick = nick;
	loadScript("http://"+server+":"+port+"/socket.io/socket.io.js",mpConnect);

	mpMessages = new Array();
}

function mpConnect() {
	mpSocket = io.connect("http://"+mpServer+":"+mpPort);
	
	mpSocket.on("connect", function(data) {
		mpConnected=true;
		mpSocket.emit("setnick", mpNick);
	});

	mpSocket.on("ready", function() {
		mpReady = true;
	});
	
	mpSocket.on("info", function(data) {
		console.log("INFO - "+data.content);
		if (data.display) {
			mpAddMessage("INFO - "+data.content);
		}
	});

	mpSocket.on("playerind", function(ind) {
		//store player id and set player to correct ent
		mpPlayer = ind;
		player = entityManager.get(ind);
	});
	
	mpSocket.on("chunk", function(chunk) {
		console.log(chunk);
		gameLevel.chunkSet(chunk);
	});

	mpSocket.on("newent", function(entity){
		var ent = null;
		//console.log("New entity of type "+entity[2].type+" at index "+entity[2].arrIndex+".");
		//console.log("New entity!");
		//console.dir(entity);
		//entity[2].type = entity[2].id;
		ent = constructEntity(entity.type);
		//console.log("created: ");
		//console.log(ent);
		entityManager.set(entity.arrIndex, ent);
		entityManager.get(entity.arrIndex).unserialize(entity.ser);
	});

	mpSocket.on("entity", function(entity){
		//console.log("Recv. ent:");
		//console.log(entity);
		var en = entityManager.get(entity.arrIndex);
		if (en == null || typeof en === 'undefined') {
			//console.log("HELP ME");
			entityManager.set(entity.arrIndex, constructEntity(entity.type));
		}
		
		entityManager.get(entity.arrIndex).unserialize(entity);
		//deserializeEntity(entity);
		//var deser = CircularJSON.parse(entity);
		//entities[deser.arrIndex] = deser;
	});
	
	mpSocket.on("delent", function(entity){
		var en = entityManager.get(entity.arrIndex);
		if (en instanceof Entity) {
			en.destroy();
		}
	});

	mpSocket.on("msg", function(message) {
		console.log(message.player+": "+message.content);
		mpAddMessage(message.player+": "+message.content);
	});

	mpSocket.on("function", function(func) {
		console.log("calling "+func.fn+" of "+func.entity+" with args "+func.args);
	});

	mpSocket.on("property", function(prop) {
		console.log("setting "+prop.pr+" of "+prop.entity+" to "+prop.val);
	});
	
	mpSocket.on("kick", function(data) {
		//TODO: Print to chat
		console.log("Kicked: "+data.reason);
		Interface.showAlert("Kicked: "+data.reason);
	});

	mpSocket.on("disconnect", function() {
		Interface.showAlert("Disconnected from server.");
		mpActive = false;
		mpReady = false;
		mpConnected = false;
	});
}

function mpAddMessage(text) {
	mpMessages.unshift(text);
	mpLastMessageTime = new Date().getTime();
	if (mpMessages.length>8) {
		mpMessages = mpMessages.slice(0,8);
	}
}

function mpSendChat() {
	if (mpReady) {
		mpSocket.emit("msg",{content: mpTypedChat});
	}
	mpAddMessage(mpNick+": "+mpTypedChat);
	mpTypedChat = "";
}

function loadScript(url, callback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}