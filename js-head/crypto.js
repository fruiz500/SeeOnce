//functions that start a blinking message when the Encrypt button is pressed or an encrypted item is pasted
function lockItem(){
	var text = mainBox.innerHTML;
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){
		sendMail();
		return
	}
	var firstChar = extractCipher(text).charAt(50);
	if(firstChar == '~' || firstChar == '!' || firstChar == '$' || firstChar == '@'|| firstChar == '%'){
		sendMail();
		return
	}
	if((text.trim() && theirName) || firstInit){
		mainMsg.innerHTML = '<span class="blink" style="color:cyan">ENCRYPTING</span>';
		setTimeout(function(){
			Encrypt();
			changeButtons()
		},20);
	} else if(!mainBox.innerHTML.trim()){
		mainMsg.innerText = 'Please write your message and then click Encrypt'
	} else if(!theirName){
		selectUser()
	}
}

function unlockItem(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">DECRYPTING</span>';
	setTimeout(function(){
		var text = removeHTMLtags(mainBox.innerHTML);
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
		text = mainBox.innerHTML.trim(),
  		cipherstr = PLencrypt(text,nonce24,myLockbin,true);
	setTimeout(function(){mainMsg.innerHTML = "This invitation can be decrypted by anyone<br>It is <span class='blink'>NOT SECURE</span><br>Copy and send or click <strong>Email</strong>"},20);
	mainBox.innerText = myezLock + "@" + noncestr + cipherstr;
	mainBox.innerHTML = "The gibberish below is my invitation to communicate securely using SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.<br><br>https://passlok.com/seeonce#==" + mainBox.innerHTML + "==<br><br>If the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.<br><br>Get SeeOnce at https://passlok.com/seeonce<br><br>Chrome app: https://chrome.google.com/webstore/detail/jbcllagadcpaafoeknfklbenimcopnfc";

	closeBox();
	replyBtn.innerText = 'Email';
	changeButtons();
	callKey = '';
	if(!isMobile){
		selectMain();
		mainMsg.innerText = 'Encryption successful and copied to clipboard. Click <strong>Email</strong> or paste into another app.';
	}else{
		mainMsg.innerText = 'Encryption successful. Click Email or copy and send.';
	}
}

locDirDecrypt = false;
//Encryption process: determines the kind of encryption by type. Chat output is a little different, hence the input flag
function Encrypt(isChat){
	callKey = 'encrypt';
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim(),
		type;
	readKey();

	var lastKeyCipher = locDir[theirLock][0],			//retrieve stored data
		lastLockCipher = locDir[theirLock][1],
		turnstring = locDir[theirLock][2],
		name = locDir[theirLock][3];
	var secdum = nacl.randomBytes(32);				//new dummy private key and its matching public key

	if (lastKeyCipher){
		var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher,true))
	} else {
		var lastKey = secdum
	}

	if (lastLockCipher) {								//if dummy exists, decrypt it first
		var lastLock = keyDecrypt(lastLockCipher,true)
	} else {											//use permanent public key if dummy doesn't exist
		var lastLock = convertPubStr(theirLock)
	}
	
	var sharedKey = makeShared(lastLock,lastKey);

	if(turnstring == 'reset'){type = ':'}else if(turnstring == 'unlock'){type = '*'}else if(turnstring == 'lock'){type = '$'}else{type = ':'};

	if (turnstring != 'lock'){								//if out of turn don't change the dummy Key, this includes reset
		if(lastLockCipher){
			var newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,makeShared(lastLock,KeyDH));
		}else{
			var newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,makeShared(convertPubStr(theirLock),KeyDH));
		}

	}else{														//normal Read-once algorithm
		var pubdumstr = makePubStr(secdum);
		if(lastLockCipher){
			if(lastKeyCipher){
				var newLockCipher = PLencrypt(pubdumstr,nonce24,sharedKey)
			}else{
				var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,KeyDH));
				type = '$'
			}
		}
	}

	if(turnstring == 'lock' || !lastKeyCipher){
		locDir[theirLock][0] = keyEncrypt(nacl.util.encodeBase64(secdum));			//new key is stored in the permanent database, but not if a repeat message
	}
	if(needRecrypt && lastLockCipher){
		locDir[theirLock][1] = keyEncrypt(lastLock);	
		needRecrypt = false
	}
	if(type == ':'){locDir[theirLock][2] = 'reset'}else{locDir[theirLock][2] = 'unlock'};		//and the turn string too
	storeData(theirLock);
	var cipherstr = PLencrypt(text,nonce24,sharedKey,true);										//this one uses compression
	mainBox.innerText = myezLock + type + noncestr + newLockCipher + cipherstr;

	if(type == ':'){
		mainMsg.innerText = "This message for " + name + " has no forward secrecy\nThe recipient will be advised to delete it after reading it\nCopy and send or click Email"
	}else if(type == '*'){
		mainMsg.innerText = "This message for " + name + " will become undecryptable after you get a reply\nCopy and send or click Email"
	}else{
		mainMsg.innerText = "This message for " + name + " will become undecryptable as soon as it is read\nCopy and send or click Email"
	}

	if(isChat){
		mainMsg.innerText = 'Invitation to chat for ' + name + ' in the box.\nCopy and send or click Email'
		mainBox.innerText = "The gibberish below is an encrypted invitation to a secure real-time chat with SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.\n\nhttps://passlok.com/seeonce#==" + mainBox.innerText + "==\n\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.\n\nGet SeeOnce at https://passlok.com/seeonce\n\nAlso available in the Chrome and Android app stores.";

	}else{
		mainBox.innerText = "The gibberish below is a secure message for you, which I have encrypted with SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.\n\nhttps://passlok.com/seeonce#==" + mainBox.innerText + "==\n\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.\n\nGet SeeOnce at https://passlok.com/seeonce\n\nAlso available in the Chrome and Android app stores.";
	}

	replyBtn.innerText = 'Email';
	callKey = '';
	oldPwd.value = '';
	if(!isMobile) selectMain()
}

//decryption process: determines which kind of encryption by looking at first character after the initial tag
function Decrypt(){
	callKey = 'decrypt';
	keyMsg.innerText = "";
	mainMsg.innerText = "";
	var cipherstr = extractCipher(mainBox.innerText);

	cipherstr = cipherstr.replace(/#/g,'');				//extra filtering for mailto and link artifacts

	var	type = cipherstr.charAt(50),					//get encryption type. @=symmetric, $=PFS, !=Read-once, ~=Key-encrypted
		type2 = cipherstr.charAt(0);					//key-encrypted items don't carry the Lock
	cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64
	if(type == '$' || type == '*' || type == ':' || type == '@'){
		theirezLock = cipherstr.slice(0,50);					//retrieve sender's Lock from message
		cipherstr = cipherstr.slice(50);						//and remove it
		theirLock = changeBase(theirezLock, base36, base64, true);
		if(!locDir[theirLock]){								//make entry if needed
			locDir[theirLock] = [];
			var isNewLock = true,
				needsName = true,
				name = theirName;
		}else if(!locDir[theirLock][3]){					//to get missing name
			var needsName = true,
				name = theirName
		}else{
			var name = locDir[theirLock][3]
		}
		if(needsName) openNewLock();										//new or changed Lock. Stop to get new name or assign data to an existing one
		initSession()										//to get buttons re-enabled. Don't store new Lock until end
	}

	if(type == '$'|| type == '*' || type == ':'){
		readKey();
	
		if(type == ':' && !isNewLock){									//if reset, delete local data except new, after confirmation
			if(!resetOK){
				resetScr.style.display = 'block';
				shadow.style.display = 'block';
				throw('stopped for user confirmation');
			}
			resetOK = false;
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
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher,true))
		} else {																//if a dummy Key doesn't exist, use permanent Key
			var lastKey = KeyDH
		}

		if(type == '*' || type == ':'){												//PFS mode
			if(lastKeyCipher){
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),lastKey))
			}else{
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),KeyDH))
			}
			var	sharedKey = makeShared(newLock,lastKey);

		}else{																			//Read-once mode
			var lastLockCipher = locDir[theirLock][1];								//this mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var lastLock = keyDecrypt(lastLockCipher,true);
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(lastLock,lastKey))
				}else{
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),lastKey))
				}
			}else{
				var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),KeyDH))
			}
			if (lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				if(!lastLock) var lastLock = keyDecrypt(lastLockCipher,true)
			} else {															//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,true);			//this one is compressed
		mainBox.innerHTML = safeHTML(plain.trim());
		if(needRecrypt && lastKeyCipher){
			locDir[theirLock][0] = keyEncrypt(nacl.util.encodeBase64(lastKey));
			needRecrypt = false
		}
		locDir[theirLock][1] = keyEncrypt(newLock);							//store the new dummy Lock
		locDir[theirLock][2] = 'lock';
		if(isNewLock){
			mainMsg.innerText = 'This is the first message from ' + name + '\nIt can be decrypted again'
		}else if(type == ':'){
			mainMsg.innerText = 'You have just decrypted the first message or one that resets a conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
		}else if(type == '$'){
			mainMsg.innerText = 'This message from ' + name + ' cannot be decrypted again'
		}else if(type == '*'){
			mainMsg.innerText = 'This message from ' + name + ' will become undecryptable after your reply'
		}
		storeData(theirLock);
		tempLock = tempEphKey = tempEphLock = tempFlag = '';		//success, so remove backup ephemeral data
		resetBtn.disabled = false;

	}else if(type == '@'){												//it's an invitation; decrypt with theirLock as Key
	if(needsName){														//make new entry if it is new
		isInvite = true;
		openNewLock()
	}
	
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);

		var plain = PLdecrypt(cipherstr,nonce24,nacl.util.decodeBase64(theirLock),true);
		if(!plain) failedDecrypt();
		mainBox.innerHTML = "This is my message to you:<blockquote><em>" + safeHTML(plain.trim()) + "</em></blockquote><br>SeeOnce is now ready to encrypt your reply so that only I can decrypt it.<br><br>To do this, click <strong>Clear</strong>, type your message, and then click <strong>Encrypt</strong>. Then you can copy and paste it into your favorite communications program or click <strong>Email</strong> to send it with your default email.<br><br>If this is a computer, you can use rich formatting if you click the <strong>Rich</strong> button, or load a file with the button at the lower right.<br><br>It will be possible to decrypt this reply again, but every message exchanged after that will be decrypted <em>only once</em>.";
		if(isNewLock){
			mainMsg.innerHTML = '<span style="color:orange">This is a new invitation</span><br>It <em>can</em> be decrypted again'
		}else{
			mainMsg.innerHTML = 'Invitation message from ' + name + ' decrypted<br>It <em>can</em> be decrypted again, by <em>anyone</em>'
		}

	}else if(type2 == '~'){												//it's a data backup; decrypt with myKey and merge
		var newData = JSON.parse(keyDecrypt('~'+cipherstr),false);	//false flag since not a locDir decryption
		locDir = mergeObjects(locDir,newData);
		storeData();
		clearMain();
		mainMsg.innerText = 'Data from backup merged';

	}else{																//none of the known types
		mainMsg.innerText = 'Unrecognized message format';
	}

	callKey = '';
	detectChat()
}

//extracts locked item from a piece of text
function extractCipher(string){
	var cipherstr = removeHTMLtags(string.replace(/&[^;]+;/g,'').replace(/\s/g,''));
	if(cipherstr.match('==')) cipherstr = cipherstr.split('==')[1].replace(/<(.*?)>/gi,"");		//remove URL and text around item
	var	firstChar = cipherstr.charAt(50);
	if(firstChar == '$'|| firstChar == '*' || firstChar == ':' || firstChar == '@' || cipherstr.charAt(0) == '~'){ return cipherstr }
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
function keyDecrypt(cipherstr,isLocDir){
	readKey();
	var cipherstrOld = cipherstr;
	cipherstr = cipherstr.slice(1);							//take out the initial '~'
	var	noncestr = cipherstr.slice(0,12),
		nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
		cipherstr = cipherstr.slice(12);
	if(isLocDir) locDirDecrypt = true;						//set flag for error handling
	var plain = PLdecrypt(cipherstr,nonce24,myKey).trim();		//errors caught in PLdecrypt
	locDirDecrypt = false;
	return decodeURI(plain)
}