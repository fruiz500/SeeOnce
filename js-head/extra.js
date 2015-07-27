//sends to default email
function sendMail() {
    var link = ("mailto:" + "?subject=" + "&body=" + encodeURIComponent(mainBox.innerHTML)).replace(/%3Cbr%3E/g,'%0D%0A');	
	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

var fromChat = false;
//opens the Chat making dialog
function startChat(){
	checkWebRTC();						//proceed only if supported
	if(!theirLock){						//make sure a Lock is loaded
		fromChat = true;
		fillList(nameList);
		selectScr.style.display = 'block'
	}else{
		chatScr.style.display = 'block'
	}
	shadow.style.display = 'block'
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	fromChat = false;
	closeBox();
	if(dataChat.checked){
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else{
		var type = 'C'
	}
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,'');
	var chatRoom = makeChatRoom();
	mainBox.innerHTML = type + chatRoom + password;
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">LOCKING</span>';
	setTimeout(function(){
		Encrypt(true);										//special chat output
		changeButtons();
		window.open('https://www.seeonce.net/chat/index.html#' + type + chatRoom + password,'_blank')
	},20);
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var blacklist = blackListExp.toString().slice(1,-2).split('|'),
		name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
	if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	while(name.length < 20) name += ' ';
	return name
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = Math.floor(Math.random()*blackLength);
	}
	return index
}

//detects an unlocked chat invitation in the box and opens up a chat window
function detectChat(){
	var token = mainBox.innerHTML;
	if (token.length == 64){											//chat invite detected, so open chat
		mainBox.innerHTML = '';
		checkWebRTC();
		window.open('https://www.seeonce.net/chat/index.html#' + token,'_blank');
		mainMsg.innerHTML = 'Chat session open on a separate tab'
	}			
	return
}

//detects OS and prevents Chat if not supported
function checkWebRTC(){
	if(isSafari || isIE || isiOS){
		mainMsg.innerHTML = 'Sorry, but chat is not yet supported by your browser or OS';
		throw('browser does not support webRTC')
	}
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running SeeOnce as a native app.');
		if(!reply) throw('chat canceled by user');
	}	
}