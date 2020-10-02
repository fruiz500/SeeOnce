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
//opens the Chat making dialog
function startChat(){
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
	if(dataChat.checked){					//A to C for Muaz Khan's WebRTC chat, D for Jitsi
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else if (videoChat.checked){
		var type = 'C'
	}else{
		var type = 'D'
	}
	var date = chatDate.value.slice(0,43);						//can't do encodeURI here because this will be decrypted by decryptList, which doesn't expect it
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),
		chatRoom = makeChatRoom();
	mainBox.textContent = date + type + chatRoom + '?' + password;
	blinkMsg(mainMsg);
	setTimeout(function(){
		Encrypt(true);										//special chat output
		changeButtons();
		main2chat(type + chatRoom + '?' + password);
		mainMsg.textContent = 'Here is the chat invitation for the other party. The chat is open on a separate tab.'
	},20);
}

//makes a mostly anonymous chatRoom name from four words in the wordlist
function makeChatRoom(){
	var wordlist = wordListExp.toString().slice(1,-2).split('|'),
		name = '';
	for(var i = 0; i < 4; i++){
		name += capitalizeFirstLetter(replaceVariants(wordlist[randomIndex()]))
	}
	return name
}

//capitalizes first letter, the better to blend into Jitsi
function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

//returns a random index for wordlist
function randomIndex(){
	return Math.floor(Math.random()*wordLength)
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//detects a decrypted chat invitation in the box and opens up a chat window
function detectChat(){
	var typetoken = mainBox.textContent.trim();
	if (typetoken.slice(-44,-43) == '?' && !typetoken.slice(43).match(/[^A-Za-z0-9+\/?]/)){			//chat data detected, so open chat
		mainBox.textContent = '';
		var date = typetoken.slice(0,43).trim(),									//the first 43 characters are for the date and time etc.
			chatToken = decodeURI(typetoken.slice(43));
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n " + date + " \n\n"
		}else{
			var msgStart = ""
		}
		var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location. If you cancel, a link for the chat will be made, which you can save and use later.");
		if(!reply){
			var chatLink = document.createElement('a');
			chatLink.href = 'https://passlok.com/chat/chat.html#' + chatToken;
			chatLink.textContent = 'Right-click to open the chat';
			mainBox.textContent = '';
			mainBox.appendChild(chatLink);
			return
		}
		if(isSafari || isIE || isiOS){
			mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
			return
		}
		main2chat(chatToken);
		mainMsg.textContent = 'Chat session open'
	}
	return
}