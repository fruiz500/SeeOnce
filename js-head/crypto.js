//functions that start a blinking message when the Lock button is pressed or a locked item is pasted
function lockItem(){
	var text = XSSfilter(mainBox.innerHTML);
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){
		sendMail();
		return
	}
	var firstChar = extractCipher(text).charAt(0);
	if(firstChar == '~' || firstChar == '!' || firstChar == '$' || firstChar == '@'|| firstChar == '%'){
		sendMail();
		return
	}
	if((text.trim() && theirLock) || firstInit){
		mainMsg.innerHTML = '<span class="blink" style="color:cyan">LOCKING</span>';
		setTimeout(function(){
			Encrypt();
			changeButtons()
		},20);
	} else if(!mainBox.innerHTML.trim()){
		mainMsg.innerHTML = 'Please write your message and then click <b>Lock</b>'	
	} else if(!theirLock){
		selectUser()
	}
}

function unlockItem(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">UNLOCKING</span>';
	setTimeout(function(){
		var text = XSSfilter(mainBox.innerHTML);
		if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){			//detect special characters
			fromLetters(text);
			Decrypt()
		}else{
			Decrypt()
		}
		changeButtons()
	},20);
}

//makes a locked invitation, which is not secure, by symmetric encryption with myLock
function makeInvite(){
	callKey = 'encrypt';
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = LZString.compressToBase64(mainBox.innerHTML);
  	var cipherstr = PLencrypt(text,nonce24,myLockbin);
	setTimeout(function(){mainMsg.innerHTML = "This invitation can be unlocked by anyone<br>It is <span class='blink'>NOT SECURE</span><br>Copy and send or click <strong>Email</strong>"},20);
	mainBox.innerHTML = "@" + myLock + noncestr + cipherstr;
	mainBox.innerHTML = "The gibberish below is my invitation to communicate securely using SeeOnce. Click on it to unlock it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.<br><br>https://SeeOnce.net#" + mainBox.innerHTML + "=<br><br>If the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.<br><br>Get SeeOnce at https://SeeOnce.net<br><br>Chrome app: https://chrome.google.com/webstore/detail/jbcllagadcpaafoeknfklbenimcopnfc";

	closeBox();
	replyBtn.innerHTML = 'Email';
	changeButtons();
	callKey = '';
	if(!isMobile) selectMain()
}

//Encryption process: determines the kind of encryption by type. Chat output is a little different, hence the input flag
function Encrypt(isChat){
	callKey = 'encrypt';
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim();
	if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);		
	readKey();
	
	var lastKeyCipher = locDir[theirLock][0],			//retrieve stored data
		lastLockCipher = locDir[theirLock][1],
		turnstring = locDir[theirLock][2],
		name = locDir[theirLock][3];
		
	if (lastLockCipher) {								//if dummy exists, decrypt it first
		var lastLock = keyDecrypt(lastLockCipher)
	} else {											//use permanent public key if dummy doesn't exist
		var lastLock = theirLock;
		var firstMessage = true
	}
	
	var secdum = nacl.randomBytes(32),				//new dummy private key and its matching public key
		pubdumstr = makePubStr(secdum);
			
	if (turnstring == 'unlock' || turnstring == 'reset'){	//out of sync, so use PFS or reset mode, with new private and old public keys
		if(turnstring == 'reset'){var type = '%'}else{var type = '$'};
		var sharedKey = makeShared(lastLock,secdum),
			newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,myKey));
		
	}else{											//in sync, so use read-once mode, with old private and public keys
		var type = '!';
		var lastKeyCipher = locDir[theirLock][0];
		if (lastKeyCipher){
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
		} else {
			var lastKey = secdum;
			type = '$';
		}
		var sharedKey = makeShared(lastLock,lastKey);
		if(lastKeyCipher){
			var newLockCipher = PLencrypt(pubdumstr,nonce24,sharedKey);
		}else{
			var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,myKey));
		}		
	}
	
	locDir[theirLock][0] = keyEncrypt(nacl.util.encodeBase64(secdum));			//new Password is stored in the permanent database
	if(type == '%'){locDir[theirLock][2] = 'reset'}else{locDir[theirLock][2] = 'unlock'};		//and the turn string too
	storeData(theirLock);
	var cipherstr = PLencrypt(text,nonce24,sharedKey);
	mainBox.innerHTML = type + myLock + noncestr + newLockCipher + cipherstr;
		
	if(type == '%' || firstMessage){
		mainMsg.innerHTML = "This message for " + name + " will never become unlockable<br>Copy and send or click <strong>Email</strong>"	
	}else if(type == '$'){
		mainMsg.innerHTML = "This message for " + name + " will become unlockable after you get a reply<br>Copy and send or click <strong>Email</strong>"
	}else{
		mainMsg.innerHTML = "This message for " + name + " will become unlockable as soon as it is read<br>Copy and send or click <strong>Email</strong>"
	}
	
	if(isChat){
		mainMsg.innerHTML = 'Invitation to chat for ' + name + ' in the box.<br>Copy and send or click <strong>Email</strong>'
		mainBox.innerHTML = "The gibberish below is a locked invitation to a secure real-time chat with SeeOnce. Click on it to unlock it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.<br><br>https://SeeOnce.net#" + mainBox.innerHTML + "=<br><br>If the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.<br><br>Get SeeOnce at https://SeeOnce.net<br><br>Chrome app: https://chrome.google.com/webstore/detail/jbcllagadcpaafoeknfklbenimcopnfc";
		
	}else{
		mainBox.innerHTML = "The gibberish below is a secure message for you, which I have locked with SeeOnce. Click on it to unlock it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.<br><br>https://SeeOnce.net#" + mainBox.innerHTML + "=<br><br>If the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.<br><br>Get SeeOnce at https://SeeOnce.net<br><br>Chrome app: https://chrome.google.com/webstore/detail/jbcllagadcpaafoeknfklbenimcopnfc";	
	}

	replyBtn.innerHTML = 'Email';
	callKey = '';
	if(!isMobile) selectMain()
}

//decryption process: determines which kind of encryption by looking at first character after the initial tag
function Decrypt(){
	callKey = 'decrypt';
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	var cipherstr = extractCipher(mainBox.innerHTML);
	
	cipherstr = cipherstr.replace(/#/g,'');				//extra filtering for mailto and link artifacts
	
	var	type = cipherstr.slice(0,1);						//get encryption type. @=symmetric, $=PFS, !=Read-once, ~=Key-encrypted
	cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64
	if(type == '!' || type == '$' || type == '%' || type == '@'){
		theirLock = cipherstr.slice(0,43);					//retrieve sender's Lock from message
		cipherstr = cipherstr.slice(43);
		if(!locDir[theirLock]){								//make entry if needed
			locDir[theirLock] = [];
			var isNewLock = true,
				needsName = true;
		}else if(!locDir[theirLock][3]){					//to get missing name
			var needsName = true
		}else{
			var name = locDir[theirLock][3]
		}
		initSession()										//to get buttons re-enabled. Don't store new Lock until end
	}
		
	if(type == '$'|| type == '!' || type == '%'){
		readKey();

		if(type == '%' && !isNewLock){									//if reset, delete local data, except new
			locDir[theirLock][0] = locDir[theirLock][1] = null
		}
		
		var	keystr = theirLock,
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			newLockCipher = cipherstr.slice(12,91);
		cipherstr = cipherstr.slice(91);
		
		var lastKeyCipher = locDir[theirLock][0],									//retrieve dummy Key from storage
			turnstring = locDir[theirLock][2];									//this strings says whose turn it is to encrypt		
		if (lastKeyCipher) {
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
		} else {																//if a dummy Key doesn't exist, use permanent Key
			var lastKey = myKey;
		}		

		if(type == '$' || type == '%'){												//PFS mode
			if(lastKeyCipher){
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(theirLock,lastKey));
			}else{
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(theirLock,myKey));
			}
			var	sharedKey = makeShared(newLock,lastKey);
			
		}else{																			//Read-once mode																
			var lastLockCipher = locDir[theirLock][1];								//this mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(keyDecrypt(lastLockCipher),lastKey));
				}else{
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(theirLock,lastKey));
				}
			}else{
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(theirLock,myKey));
			}
			if (lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockCipher)
			} else {															//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			if(XSSfilter(plain).slice(0,9) != 'filename:') plain = LZString.decompressFromBase64(plain);
			mainBox.innerHTML = plain.trim();
		}catch(err){failedDecrypt()}
		locDir[theirLock][1] = keyEncrypt(newLock);							//store the new dummy Lock
		locDir[theirLock][2] = 'lock';
		if(isNewLock){
			mainMsg.innerHTML = '<span style="color:orange">This message was locked with a new Password</span><br>It <em>can</em> be unlocked again'
		}else if(type == '%'){
			mainMsg.innerHTML = 'The conversation has been reset<br>This message <em>can</em> be unlocked again'
		}else if(type == '!'){
			mainMsg.innerHTML = 'This message from ' + name + ' cannot be unlocked again'
		}else if(type == '$'){
			mainMsg.innerHTML = 'This message from ' + name + ' will become unlockable after your reply'
		}
		if(needsName) openNewLock();
		storeData(theirLock);
				
	}else if(type == '@'){												//it's an invitation; decrypt with theirLock as Key
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		try{
			var plain = PLdecrypt(cipherstr,nonce24,nacl.util.decodeBase64(theirLock));
			if(!plain) failedDecrypt();
			if(XSSfilter(plain).slice(0,9) != 'filename:') plain = LZString.decompressFromBase64(plain);
			mainBox.innerHTML = plain.trim() + "<br><br>SeeOnce is now ready to lock your reply so that only I can unlock it.<br><br>To do this, click <strong>Clear</strong>, type your message, and then click <strong>Lock</strong>. Then you can copy and paste it into your favorite communications program or click <strong>Email</strong> to send it with your default email.<br><br>If this is a computer, you can use rich formatting if you click the <strong>Rich</strong> button, or load a file with the button at the lower left.<br><br>It will be possible to unlock this reply again, but every message exchanged after that will be unlocked <em>only once</em>.";
		}catch(err){failedDecrypt()}
		if(isNewLock){
			mainMsg.innerHTML = '<span style="color:orange">This is a new invitation</span><br>It <em>can</em> be unlocked again'
		}else{
			mainMsg.innerHTML = 'Invitation message from ' + name + ' unlocked<br>It <em>can</em> be unlocked again, by <em>anyone</em>'
		}
		if(needsName) openNewLock();
		
	}else if(type == '~'){												//it's a data backup; decrypt with myKey and merge
		var newData = JSON.parse(keyDecrypt('~'+cipherstr));
		locDir = mergeObjects(locDir,newData);
		storeData();
		clearMain();
		mainMsg.innerHTML = 'Data from backup merged';
		
	}else{																//none of the known types
		mainMsg.innerHTML = 'Unrecognized message format';
	}

	resetBtn.disabled = false;
	callKey = '';
	detectChat()
}

//extracts locked item from a piece of text
function extractCipher(string){
	var cipherstr = XSSfilter(string.replace(/&[^;]+;/g,'').replace(/\s/g,''));
	if(cipherstr.match('[#=](.*)=')) cipherstr = cipherstr.match('#(.*)=')[1];		//remove URL and text around item
	var	firstChar = cipherstr.charAt(0);
	if(firstChar == '$'|| firstChar == '!' || firstChar == '@' || firstChar == '%' || firstChar == '~'){ return cipherstr }
	else {return ''}
}

//encrypts a string with the secret Password, 12 char nonce
function keyEncrypt(plainstr){
	plainstr = encodeURI(plainstr).replace(/%20/g,' ');
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce),
		cipherstr = PLencrypt(plainstr,nonce24,myKey).replace(/=+$/,'');
	return '~' + noncestr + cipherstr
}

//decrypts a string encrypted with the secret Password, 12 char nonce
function keyDecrypt(cipherstr){
	readKey();
	cipherstr = cipherstr.slice(1);							//take out the initial '~'
	var	noncestr = cipherstr.slice(0,12),
		nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
		cipherstr = cipherstr.slice(12);
	try{
		return decodeURI(PLdecrypt(cipherstr,nonce24,myKey).trim())
	}catch(err){failedDecrypt()}
}