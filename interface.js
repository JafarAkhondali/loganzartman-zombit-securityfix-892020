//dear readers: this is retrofitted legacy code; I apologize.

var Interface = {
	init: function() {
		document.addEventListener("keydown",Interface.kd,false);
		document.addEventListener("keyup",Interface.ku,false);
		document.addEventListener("mousemove",Interface.mm,false);
		document.addEventListener("mouseup",Interface.mu,false);
		document.addEventListener("mousedown",Interface.md,false);
		document.addEventListener("mousewheel",Interface.mw,false);
		document.addEventListener("scroll",Interface.mw,false);
	}
};

var keys = [];
Interface.kd = function(e) { //keydown
	if (Interface.modalsOpen<=0) {
		if (!e) {e=event;}

		if (e.keyCode==VK_ESCAPE) {
			gamePaused = !gamePaused;
		}

		if (e.keyCode==VK_X && gamePaused && dmode===GAME) {
			endGame();
		}

		if (e.keyCode==VK_F11) {
			if (!window.screenTop && !window.screenLeft) {
				fullscreen(true);
			}
			else {
				fullscreen(false);
			}
		}
		if (e.keyCode==VK_F10) {
			showPrompt("Enter nickname: ", function(serv){
				serv = serv!=""?serv:mpServer;

				showPrompt("Enter server IP or domain: ", function(port){
					port = port!=""?port:mpPort;

					showPrompt("Enter server port: ", function(nick) {
						nick = nick!=""?nick:mpNick;
						mpStart(nick,serv,port);
					})
				})
			});
		}
		if (e.keyCode==VK_ENTER && !mpChatOpen) {
			mpChatOpen = true;
			mpChatInput = document.createElement("input");
			mpChatInput.type = "text";
			mpChatInput.style.position = "absolute";
			mpChatInput.style.left = "-100px";
			mpChatInput.style.top = "-100px";
			document.body.appendChild(mpChatInput);
			mpChatInput.addEventListener("input",function() {
				mpTypedChat = mpChatInput.value;
				Editor.updateInput(mpTypedChat);
			},false);
			/*mpChatInput.addEventListener("blur",function(){
				mpChatOpen = false;
				document.body.removeChild(mpChatInput);
			},false);*/
			mpChatInput.focus();
			e.preventDefault();
		}
		else if (e.keyCode==VK_ESCAPE && mpChatOpen) {
			try {
				mpChatOpen = false;
				document.body.removeChild(mpChatInput);
			} catch (e) {}
		}
		else if (e.keyCode==VK_ENTER && mpChatOpen) {
			Editor.acceptInput(mpTypedChat);
			try {
				mpChatOpen = false;
				document.body.removeChild(mpChatInput);
			} catch (e) {}
		}
		if (!mpChatOpen) {
			keys[e.keyCode] = true;

			//send input to server
			if (mpReady) {mpSocket.emit("input",{type: INPUT_KB, code: e.keyCode, val: true});}
		}
	}
};

Interface.ku = function(e) { //keyup
	if (Interface.modalsOpen<=0) {
	if (!e) {e=event;}
	keys[e.keyCode] = false;

	if (mpActive) {mpSocket.emit("input",{type: INPUT_KB, code: e.keyCode, val: false});}
	}
};

var mouseX = 0, mouseY = 0, mouseLeft = false;
var scrolltotal=0;
Interface.mm = function(e) {
	if (Interface.modalsOpen > 0) return true;
	if (!e) {e=event;}
	Interface.mp(e);
	if (mouseLeft) Editor.handleDrag(e);
};
Interface.md = function(e) {
	if (Interface.modalsOpen > 0) return true;
	if (!e) {e=event;}
	if (e.target === canvas) {
		// e.preventDefault();
		canvas.focus();
	}
	Interface.mp(e);
	mouseLeft = e.which === 1;
	mouseRight = e.which === 3;

	if (mpChatOpen) {
		mpChatOpen = false;
		document.body.removeChild(mpChatInput);
	}

	if (dmode === MENU) {
		if (uiPlayState === UI_HOVER && mouseY>120 && mouseY<140 && mouseX>viewWidth/2-40 && mouseX<viewWidth/2+40) {
			uiPlayState = UI_UP;
			requestAnimFrame(function(){
				drawLoadingScreen(0.001);
				setTimeout(restartGame,50);
			});
		}
		if (uiHelpState === UI_HOVER && mouseY>150 && mouseY<170 && mouseX>viewWidth/2-40 && mouseX<viewWidth/2+40) {
			uiHelpState = UI_UP;
			showGameHelp();
		}
	}

	Editor.handleClick(e);

	if (mpReady) {mpSocket.emit("input",{type: INPUT_MOUSE, btn: 1, state: true});}
};
Interface.mu = function(e) {
	if (Interface.modalsOpen > 0) return true;
	if (!e) {e=event;}
	e.preventDefault();
	Interface.mp(e);

	Editor.handleUp(e);

	if (e.which === 1) mouseLeft = false;
	if (e.which === 3) mouseRight = false;

	if (mpReady) {mpSocket.emit("input",{type: INPUT_MOUSE, btn: 1, state: false});}
};
Interface.mp = function(e) {
	if (Interface.modalsOpen > 0) return true;
	var el = e.target;

	posx = e.pageX;
	posy = e.pageY;
	if (devicePixelRatio) {
		posx *= devicePixelRatio;
		posy *= devicePixelRatio;
	}

	var mcx = posx*(viewWidth/screenWidth);
	var mcy = posy*(viewHeight/screenHeight);
	mouseX = mcx;
	mouseY = mcy;

	if (dmode === MENU) {
		uiPlayState = (mouseY>120 && mouseY<140 && mouseX>viewWidth/2-40 && mouseX<viewWidth/2+40)?UI_HOVER:UI_UP;
		uiHelpState = (mouseY>150 && mouseY<170 && mouseX>viewWidth/2-40 && mouseX<viewWidth/2+40)?UI_HOVER:UI_UP;
	}

	//if (mpReady) {mpSocket.emit("input",{type: INPUT_MOUSE, x: mouseX, y: mouseY});}
	if (mpReady) {mpSocket.emit("input",{type: INPUT_MOUSE, facing: player.facing});}
};
Interface.mw = function(e) {
	scrolltotal+=Util.wheelDistance(e);
};

Interface.modalsOpen = 0;
Interface.makeModal = function(content,okcallback,width,height) {
	var modal = document.createElement("div");
	modal.className = "modal";
	modal.innerHTML = content;
	// modal.style.width = ~~(width||500)+"px";
	// modal.style.height = ~~(height||200)+"px";
	// modal.style.marginLeft = ~~(-width/2||-250)+"px";
	// modal.style.marginTop = ~~(-height/2||-100)+"px";

	var okBtn = document.createElement("div");
	okBtn.className = "modalButton";
	okBtn.innerHTML = "OK";
	okBtn.onclick = okcallback;

	modal.appendChild(okBtn);
	document.body.appendChild(modal);
	modal.destroy = function(){document.body.removeChild(this); Interface.modalsOpen-=1;};

	Interface.modalsOpen+=1;

	return modal;
};

Interface.showAlert = function(text,callback,width,height) {
	var modal = Interface.makeModal(text, function(){
		callback(true);
		modal.destroy();
	},width,height);
};

Interface.showPrompt = function(text,callback,width,height) {
	var inpt = document.createElement("input");
	inpt.className = "modalInput";
	inpt.type = "text";

	var modal = Interface.makeModal(text+"<br>", function() {
		callback(inpt.value);
		modal.destroy();
	},width,height);
	modal.appendChild(inpt);

	inpt.focus();
};

/**
 * Creates the DatGUI
 * @returns {undefined}
 */
Interface.createGUI = function() {
    //show the gui
	gui = new dat.GUI({autoPlace: false});
	gui.close();

	var customContainer = document.getElementById('datgui-container');
	customContainer.appendChild(gui.domElement);
	customContainer.addEventListener("mousedown", function(event){
		event.stopPropagation();
	}, false);

	gui.remember(window);
	gui.remember(player);

	var display = gui.addFolder("Display");
	var viewport = display.addFolder("Viewport");
	viewport.add(window, "viewWidth").min(0);
	viewport.add(window, "viewHeight").min(0);
	viewport.add(window, "screenWidth").min(0);
	viewport.add(window, "screenHeight").min(0);
	viewport.add(Interface, "chooseFPS");

	var renderset = display.addFolder("Render Settings");
	renderset.add(window, "drawParticles");
	renderset.add(window, "drawOverlay");
	renderset.add(window, "tileShadows");
	renderset.add(window, "entityShadows");
	renderset.add(window, "enableLightRendering");
	renderset.add(window, "enableShadowCasting");
	renderset.add(window, "enableSoftShadows");
	renderset.add(window, "frameBlend").min(0).max(1).listen();
	renderset.add(window, "minFrameBlend").min(0).max(1);
	renderset.add(window, "defaultFrameBlend").min(0).max(1);
	renderset.add(window, "globalBrightness").min(0).max(2).step(0.1);

	var debuginfo = display.addFolder("Debug Displays");
	debuginfo.add(window, "showDebug");
	debuginfo.add(window, "enableShadowDebug");
	debuginfo.add(window, "enablePathDebug");
	debuginfo.add(window, "enableZombieDebug");

	var playr = gui.addFolder("Player");
	playr.add(player, "life").min(1).max(player.maxlife).step(1).listen();
	playr.add(player, "spdInc").step(0.01);
	playr.add(player, "maxSpd").step(0.01);
	playr.add(player, "friction").step(0.01);
	playr.add(window, "spawnEnabled");

	var cheats = playr.addFolder("Cheats");
	cheats.add(window, "godMode");
	cheats.add(window, "randomGun");
	cheats.add(window, "giveNyanGun");
	cheats.add(window, "giveZedGun");

	// var mpm = gui.addFolder("Multiplayer (Broken, do not use)");
	// mpm.add(window, "mpServer");
	// mpm.add(window, "mpPort");
	// mpm.add(window, "mpNick");
	// mpm.add(window, "mpStart");
	// mpm.add(window, "mpConnect");

	var audm = gui.addFolder("Audio");
	audm.add(window, "volumeMaster").min(0).max(1).step(0.05);

	var edit = gui.addFolder("Editor");
	Editor.createControls(edit);
};

Interface.chooseFPS = function() {
	Interface.showPrompt("Choose target framerate (FPS):", function(text){
		try {
			var fps = parseInt(text);
			targetFramerate = fps;
			if (timer) {
				clearInterval(timer);
				timer = setInterval(step, 1000/targetFramerate);
			}
		}
		catch (e) {}
	}, 500, 300);
};
