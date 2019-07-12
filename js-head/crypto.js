//functions that start a blinking message when the Encrypt button is pressed or an encrypted item is pasted
function lockItem(){
	var text = mainBox.innerHTML;
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){		//recognize hidden text
		sendMail();
		return
	}
	var firstChar = extractCipher(text).charAt(56);									//after Lock and separator
	if(firstChar.match(/[kgopr]/)){
		sendMail();
		return
	}
	if((text.trim() && theirName) || firstInit){
		blinkMsg(mainMsg);
		setTimeout(function(){
			Encrypt();
			changeButtons()
		},20);
	} else if(!mainBox.innerHTML.trim()){
		mainMsg.textContent = 'Please write your message and then click Encrypt'
	} else if(!theirName){
		selectUser()
	}
}

function unlockItem(){
	blinkMsg(mainMsg);
	setTimeout(function(){
		var text = mainBox.innerHTML.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/">(.*?)\/a>$/,'').replace(/<br>/g,'');
		if(text.match('==')) text = text.split('==')[1];										//remove tags
		text = text.replace(/<(.*?)>/g,'');

		if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){			//recognize hidden text
			fromLetters(text);
			Decrypt()
		}else{
			Decrypt()
		}
		changeButtons()
	},20);
}

//makes a encrypted invitation, which is not secure, by symmetric encryption with myLock
function makeInvite(){
	callKey = 'encrypt';
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		text = mainBox.innerHTML.trim(),
  		cipher = PLencrypt(text,nonce24,myLock,true);
	setTimeout(function(){
		mainMsg.textContent = "Invitation created. Invitations are ";
		var blinker = document.createElement('span');
		blinker.className = "blink";
		blinker.textContent = "NOT SECURELY ENCRYPTED";
		mainMsg.appendChild(blinker);
	},20);

	var outStr = nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'');		//first character will be g
	mainBox.textContent = "The gibberish below is my invitation to communicate securely using SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.\r\n\r\nhttps://passlok.com/seeonce#==" + myezLock + "//////" + outStr + "==\r\n\r\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.\r\n\r\nGet SeeOnce at https://passlok.com/seeonce\r\n\r\nChrome app: https://chrome.google.com/webstore/detail/jbcllagadcpaafoeknfklbenimcopnfc";

	closeBox();
	replyBtn.textContent = 'Email';
	changeButtons();
	callKey = '';
	if(!isMobile){
		selectMain();
		mainMsg.textContent = 'Encryption successful and copied to clipboard. Click Email or paste into another app.';
	}else{
		mainMsg.textContent = 'Encryption successful. Click Email or copy and send.';
	}
}

//concatenates two uint8 arrays, normally used right before displaying the output
function concatUint8Arrays(array1,array2){
	var result = new Uint8Array(array1.length + array2.length);
	result.set(array1,0);
	result.set(array2,array1.length);
	return result
}

locDirDecrypt = false;
//Encryption process: determines the kind of encryption by type. Chat output is a little different, hence the input flag
function Encrypt(isChat){
	callKey = 'encrypt';
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		text = mainBox.innerHTML.trim();
	if(!readKey()) return;	
	if(!theirLock) selectUser();

	var lastKeyCipher = locDir[theirLock][0],			//retrieve stored data
		lastLockCipher = locDir[theirLock][1],
		turnstring = locDir[theirLock][2],
		name = locDir[theirLock][3];
	var secdum = nacl.randomBytes(32);				//new dummy private key and its matching public key

	if (lastKeyCipher){
		var lastKey = keyDecrypt(lastKeyCipher,true)
	} else {
		var lastKey = secdum
	}

	if (lastLockCipher) {								//if dummy exists, decrypt it first
		var lastLock = keyDecrypt(lastLockCipher,true)
	} else {											//use permanent public key if dummy doesn't exist
		var lastLock = convertPubStr(theirLock)
	}
	
	var sharedKey = makeShared(lastLock,lastKey);

	if(turnstring == 'reset'){
		var typeByte = [172]						//will begin with 'r'
	}else if(turnstring == 'unlock'){
		var typeByte = [164]						//will begin with 'p'
	}else if(turnstring == 'lock'){
		var typeByte = [160]						//will begin with 'o'
	}else{
		var typeByte = [172]
	}

	if (turnstring != 'lock'){								//if out of turn don't change the dummy Key, this includes reset
		if(lastLockCipher){
			var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,makeShared(lastLock,KeyDH))
		}else{
			var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,makeShared(convertPubStr(theirLock),KeyDH))
		}

	}else{														//normal Read-once algorithm
		var pubdum = makePub(secdum);
		if(lastLockCipher){
			if(lastKeyCipher){
				var newLockCipher = nacl.secretbox(pubdum,nonce24,sharedKey)
			}else{
				var newLockCipher = nacl.secretbox(pubdum,nonce24,makeShared(lastLock,KeyDH));
				typeByte = [164]														//mark as repeat message
			}
		}
	}

	if(turnstring == 'lock' || !lastKeyCipher){
		locDir[theirLock][0] = keyEncrypt(secdum)						//new key is stored in the permanent database, but not if a repeat message
	}
	if(needRecrypt && lastLockCipher){
		locDir[theirLock][1] = keyEncrypt(lastLock);	
		needRecrypt = false
	}
	if(typeByte[0] == 172){locDir[theirLock][2] = 'reset'}else{locDir[theirLock][2] = 'unlock'};		//and the turn string too
	storeData(theirLock);
	var cipher = PLencrypt(text,nonce24,sharedKey,true);										//this one uses compression
	
	var outStr =  myezLock + '//////' + nacl.util.encodeBase64(concatUint8Arrays(typeByte,concatUint8Arrays(nonce,concatUint8Arrays(newLockCipher,cipher)))).replace(/=+$/,'');
	
	mainBox.textContent = '';
	if(fileMode.checked){
		var fileLink = document.createElement('a');
		if(textMode.checked){
			fileLink.download = "SO12msg.txt";
			fileLink.href = "data:," + outStr;
			fileLink.textContent = "SeeOnce 1.2 encrypted message (text file)"
		}else{
			fileLink.download = "SO12msg.plk";
			fileLink.href = "data:binary/octet-stream;base64," + outStr;
			fileLink.textContent = "SeeOnce 1.2 encrypted message (binary file)"
		}
		mainBox.appendChild(fileLink)
	}else{
		if(isChat){
			mainMsg.textContent = 'Invitation to chat for ' + name + ' in the box. Copy and send or click Email'
			mainBox.textContent = "The gibberish below is an encrypted invitation to a secure real-time chat with SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.\r\n\r\nhttps://passlok.com/seeonce#==" + outStr + "==\r\n\r\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.\r\n\r\nGet SeeOnce at https://passlok.com/seeonce\r\n\r\nAlso available in the Chrome and Android app stores.";

		}else{
			mainBox.textContent = "The gibberish below is a secure message for you, which I have encrypted with SeeOnce. Click on it to decrypt it. You will be asked to supply a Password or passphrase, which won't be sent or even stored, but you must remember it. You may be asked for my name as well.\r\n\r\nhttps://passlok.com/seeonce#==" + outStr + "==\r\n\r\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.\r\n\r\nGet SeeOnce at https://passlok.com/seeonce\r\n\r\nAlso available in the Chrome and Android app stores.";
		}
	}

	if(typeByte[0] == 172){
		mainMsg.textContent = "This message for " + name + " has no forward secrecy. The recipient will be advised to delete it after reading it. Copy and send or click Email. If a file, right-click and save locally."
	}else if(typeByte[0] == 164){
		mainMsg.textContent = "This message for " + name + " will become undecryptable after you get a reply. Copy and send or click Email. If a file, right-click and save locally."
	}else{
		mainMsg.textContent = "This message for " + name + " will become undecryptable as soon as it is read. Copy and send or click Email.  If a file, right-click and save locally."
	}

	replyBtn.textContent = 'Email';
	callKey = '';
	oldPwd.value = '';
	if(!isMobile) selectMain()
}

//decryption process: determines which kind of encryption by looking at first character after the initial tag
function Decrypt(){
	callKey = 'decrypt';
	keyMsg.textContent = "";
	mainMsg.textContent = "";
	var cipherStr = extractCipher(mainBox.innerHTML.trim());

	cipherStr = cipherStr.replace(/#/g,'');				//extra filtering for mailto and link artifacts

	var	type = cipherStr.charAt(56),					//get encryption type. g=symmetric, p=PFS, o=Read-once, r=reset, k=Key-encrypted
		type2 = cipherStr.charAt(0);					//key-encrypted items don't carry the Lock
	cipherStr = cipherStr.replace(/[^a-zA-Z0-9+\/]+/g, '');					//remove anything that is not base64

	if(type.match(/[gopr]/ || type2 == 'k')){
		theirezLock = cipherStr.slice(0,50);					//retrieve sender's Lock from message
		var fullArray = nacl.util.decodeBase64(cipherStr.slice(56));		//remove Lock, and skip the separator
		theirLock = changeBase(theirezLock, base36, base64, true);			//this is a global variable
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

	if(type.match(/[opr]/)){
		if(!readKey()) return;	
	
		if(type == 'r' && !isNewLock){									//if reset, delete local data except new, after confirmation
			if(!resetOK){
				resetScr.style.display = 'block';
				shadow.style.display = 'block';
				return
			}
			resetOK = false;
			locDir[theirLock][0] = locDir[theirLock][1] = null
		}

		var	keystr = theirLock,
			nonce = fullArray.slice(1,10),									//skip type byte
			nonce24 = makeNonce24(nonce),
			newLockCipher = fullArray.slice(10,58);
			cipher = fullArray.slice(58);

		var lastKeyCipher = locDir[theirLock][0],									//retrieve dummy Key from storage
			turnstring = locDir[theirLock][2];									//this strings says whose turn it is to encrypt
		if (lastKeyCipher) {
			var lastKey = keyDecrypt(lastKeyCipher,true)
		} else {																//if a dummy Key doesn't exist, use permanent Key
			var lastKey = KeyDH
		}

		if(type == 'p' || type == 'r'){												//PFS mode
			if(lastKeyCipher){
				var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),lastKey));
				if(!newLock) failedDecrypt()
			}else{
				var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),KeyDH));
				if(!newLock) failedDecrypt()
			}
			var	sharedKey = makeShared(newLock,lastKey);

		}else{																			//Read-once mode
			var lastLockCipher = locDir[theirLock][1];								//this mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var lastLock = keyDecrypt(lastLockCipher,true),
						newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(lastLock,lastKey));
					if(!newLock) failedDecrypt()
				}else{
					var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),lastKey));
					if(!newLock) failedDecrypt()
				}
			}else{
				var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPubStr(theirLock),KeyDH));
				if(!newLock) failedDecrypt()
			}
			if (lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				if(!lastLock) var lastLock = keyDecrypt(lastLockCipher,true)
			} else {															//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var plain = PLdecrypt(cipher,nonce24,sharedKey,true);			//this one is compressed

		mainBox.innerHTML = decryptSanitizer(plain.trim());
		if(needRecrypt && lastKeyCipher){
			locDir[theirLock][0] = keyEncrypt(lastKey);
			needRecrypt = false
		}
		locDir[theirLock][1] = keyEncrypt(newLock);							//store the new dummy Lock
		locDir[theirLock][2] = 'lock';
		if(isNewLock){
			mainMsg.textContent = 'This is the first message from ' + name + 'It can be decrypted again'
		}else if(type == ':'){
			mainMsg.textContent = 'You have just decrypted the first message or one that resets a conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
		}else if(type == '$'){
			mainMsg.textContent = 'This message from ' + name + ' cannot be decrypted again'
		}else if(type == '*'){
			mainMsg.textContent = 'This message from ' + name + ' will become undecryptable after your reply'
		}
		storeData(theirLock);
		tempLock = tempEphKey = tempEphLock = tempFlag = '';		//success, so remove backup ephemeral data
		resetBtn.disabled = false;

	}else if(type == 'g'){												//it's an invitation; decrypt with theirLock as Key
		if(needsName){														//make new entry if it is new
			isInvite = true;
			openNewLock()
		}

		var nonce = fullArray.slice(1,10),
			nonce24 = makeNonce24(nonce),
			cipher = fullArray.slice(10);

		var plain = PLdecrypt(cipher,nonce24,nacl.util.decodeBase64(theirLock),true);
		if(!plain) failedDecrypt();

		var prefaceMsg = document.createElement('div'),
			plainMsg = document.createTextNode(plain),
			epilogueMsg = document.createElement('div');
		prefaceMsg.textContent = "This is my message to you:\r\n----------\r\n";
		epilogueMsg.textContent = "----------\r\nSeeOnce is now ready to encrypt your reply so that only I can decrypt it.\r\n\r\nTo do this, click *Clear*, type your message, and then click *Encrypt*. Then you can copy and paste it into your favorite communications program or click *Email* to send it with your default email.\r\n\r\nIf this is a computer, you can use rich formatting if you click the *Rich* button.";
		mainBox.textContent = "";
		mainBox.appendChild(prefaceMsg);
		mainBox.appendChild(plainMsg);
		mainBox.appendChild(epilogueMsg)
		if(isNewLock){
			mainMsg.textContent = 'This is a new invitation\r\nIt *can* be decrypted again'
		}else{
			mainMsg.textContent = 'Invitation message from ' + name + ' decrypted\r\nIt *can* be decrypted again, by anyone'
		}

	}else if(type2 == 'k'){												//it's a data backup; decrypt with myKey and merge
		var newData = JSON.parse(keyDecrypt(cipherStr),false);				//false flag since not a locDir decryption
		locDir = mergeObjects(locDir,newData);
		storeData();
		clearMain();
		mainMsg.textContent = 'Data from backup merged';

	}else{																//none of the known types
		mainMsg.textContent = 'Unrecognized message format';
	}

	callKey = '';
	detectChat()
}

//extracts encrypted item from a piece of text
function extractCipher(string){
	var cipherStr = string.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/"(.*?)\/a>/,'').replace(/<(.*?)>/g,'');
	if(!string.match(/<a(.*?).plk" href="data:(.*?),/)){
		if(cipherStr.match('==')) cipherStr = cipherStr.split('==')[1]		//remove URL and text around item, but not for binary files
	}
	var	firstChar = cipherStr.charAt(56);
	if(firstChar.match(/[gopr]/) || cipherStr.charAt(0) == 'k'){ return cipherStr }
	else {return ''}
}