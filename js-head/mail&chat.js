//sends to default email
function sendMail() {
    var link = "mailto:" + "?subject= " + "&body=" + encodeURIComponent(mainBox.innerHTML.trim().replace(/<br>/g,'\n').replace(/<(.*?)>/g,"")).replace(/\n/g,'%0D%0A');
	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

var fromChat = false;
//opens the Chat making dialog, or the chat itself if already started
function startChat(){
	if(document.getElementById('chatFrame').src.match('#')){			//chat already open, so open that screen
		chatScr.style.display = 'block';
		return
	}
	
	checkWebRTC();						//proceed only if supported
	if(!theirLock){						//make sure a Lock is loaded
		fromChat = true;
		selectUser()
	}else{
		chatDialog.style.display = 'block'
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
	mainBox.textContent = 'noDate                                     ' + type + chatRoom + password;
	blinkMsg(mainMsg);
	setTimeout(function(){
		Encrypt(true);										//special chat output
		changeButtons();
		main2chat(type + chatRoom + password);
		mainMsg.textContent = 'Here is the chat invitation. Send it to the other party'
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

//detects an decrypted chat invitation in the box and opens up a chat window
function detectChat(){
	var token = mainBox.textContent;
	if (token.length == 107 && !token.slice(-43).match(' ')){											//chat invite detected, so open chat
		mainBox.textContent = '';
		checkWebRTC();
//		window.open('chat/index.html#' + token.slice(43),'_blank');
		main2chat(token.slice(43));
		mainMsg.textContent = 'Chat session open'
	}
	return
}

//detects OS and prevents Chat if not supported
function checkWebRTC(){
	if(isSafari || isIE || isiOS){
		mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
		return
	}
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running SeeOnce as a native app.');
		if(!reply) return
	}
}