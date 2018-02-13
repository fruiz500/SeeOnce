var callKey = '';
//global variables used for key box expiration
var keytimer = 0;
var keytime = new Date().getTime();

//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	var entropy = entropycalc(pwd);

if(display){
	if(entropy == 0){
		var msg = 'This is a known bad Key!';
		var colorName = 'magenta'
	}else if(entropy < 20){
		var msg = 'Terrible!';
		var colorName = 'magenta'
	}else if(entropy < 40){
		var msg = 'Weak!';
		var colorName = 'pink'
	}else if(entropy < 60){
		var msg = 'Medium';
		var colorName = 'orange'
	}else if(entropy < 90){
		var msg = 'Good!';
		var colorName = 'lime'
	}else if(entropy < 120){
		var msg = 'Great!';
		var colorName = 'white'
	}else{
		var msg = 'Overkill  !';
		var colorName = 'yellow'
	}
}

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

	var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds

if(display){																//display the appropriate message
	keyMsg.innerHTML = 'Password strength: ' + msg + '<br>Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process';
	keyMsg.style.color = colorName
}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	var pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//myKey is a 32-byte uint8 array private key deriving from the user's Password, no salt, for local saving. Sgn (Edwards curve) is 64-byte; DH (Motgomery curve, deriving from Sgn) is 32-byte. myLock is the public Key derived from myKeySgn. myezLock is the base36 version. Suffix "Str" means it is a base64 string.
var	myKey,
	KeySgn,
	KeyDH,
	myLock,
	myLockStr,
	myezLock;

//If the timer has run out, the Password is deleted from box, and the stretched binary secret key is deleted from memory
function readKey(){
	clearTimeout(keytimer);
	var period = 300000;

	//start timer to reset Password box
	keytimer = setTimeout(function() {
		pwd.value = '';
		oldPwd.value = '';
		myKey = '';
		KeySgn = '';
		KeyDH = ''
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		pwd.value = '';
		oldPwd.value = '';
		myKey = '';
		KeySgn = '';
		KeyDH = ''
	}
    keytime = new Date().getTime();

	var key = pwd.value.trim();
	if (key == ""){
		any2key();
		if(callKey == 'initkey'){
			keyMsg.innerHTML = '<strong>Welcome to SeeOnce</strong><br>Please enter your secret Password'
		}else{
			keyMsg.textContent = 'Please enter your secret Password';
			shadow.style.display = 'block'
		}
		throw ('Password needed')
	}
}

//converts user Password into binary format, resumes operation
function acceptKey(){
	var key = pwd.value.trim();
	if(key == ''){
		keyMsg.textContent = 'Please enter your Password';
		throw("no Password")
	}
	if(key.length < 4){
		keyMsg.textContent = 'This Password is too short';
		throw("short Password")
	}
	if(firstInit){
		mainMsg.innerHTML = '<span class="blink">LOADING...</span> for best speed, use at least a Medium Password'
	}
	key2any();

	setTimeout(function(){									//execute after a delay so the key entry dialog can go away
		myKey = wiseHash(key,'');									//no salt used in SeeOnce
		KeySgn = nacl.sign.keyPair.fromSeed(myKey).secretKey;		//make the Edwards curve secret key first
		KeyDH = ed2curve.convertSecretKey(KeySgn);
		if(!myLock){
			myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;		//from the signing key
			myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');
			myezLock = changeBase(myLockStr, base64, base36, true);
			mainMsg.textContent = "Now paste into the box the message you got, including all the gibberish. Or write a new message and click Encrypt"
		}
		if(firstInit) {
			initSession();
			if(mainBox.textContent != '') unlockItem();
			firstInit = false
		}
		if (callKey == 'encrypt'){					//now complete whatever was being done when the Password was found missing
			Encrypt()
		}else if(callKey == 'decrypt'){
			Decrypt()
		}else if(callKey == 'decryptitem'){
			decryptItem()
		} else if(callKey == 'movedb'){
			moveDB()
		}
		focusBox()
	},30);
}

//these store the contents of the local directory. locDir is an object where each key is a correspondent's base64 public key, and the field is an array. lockNames is an array containing the public keys themselves, to expedite searching.
var locDir = {},
	firstInit = true;

//gets public key from hash and figures out buttons to be enabled and other initialization things
function initSession(){
	if(!localStorage['locDir']){
		localStorage['locDir'] = '{}';
		moveBtn.disabled = true
	}else{
		locDir = JSON.parse(localStorage['locDir']);		//retrieve whatever is stored
	}

	if(theirLock == ''){
		resetBtn.disabled = true

	}else if(theirLock.length != 43){				//public key is malformed, bail out and display message
		keyMsg.textContent = "The link is corrupted. Please check it and try again";
		throw('malformed link')

	}else if(!locDir[theirLock]){					//new public key, store it
		var newEntry = JSON.parse('{"' + theirLock + '":[]}');
		locDir = mergeObjects(locDir,newEntry);
		storeData(theirLock)

	}else{											//key already known, prepare to reply, reset if ordered to do so
		if(locDir[theirLock][0] || locDir[theirLock][1]){
			resetBtn.disabled = false
		}
		theirName = locDir[theirLock][3]
	}
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Password
function wiseHash(pwd,salt){
	var iter = keyStrength(pwd,false),
		secArray = new Uint8Array(32),
		keyBytes;
	if(salt.length == 43) iter = 1;								//random salt: no extra stretching needed
	scrypt(pwd,salt,iter,8,32,0,function(x){keyBytes=x;});
	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}

//returns milliseconds for 10 scrypt runs at iter=10 so the user can know how long wiseHash will take; called at the end of body script
function hashTime10(){
	var before = Date.now();
	for (var i=0; i<10; i++){
		scrypt('hello','world',10,8,32,0,function(){});
	}
	return Date.now() - before
}

//makes the DH public key byte array of a DH secret key byte array. Returns a byte array
function makePub(sec){
	return nacl.box.keyPair.fromSecretKey(sec).publicKey
}

//Diffie-Hellman combination of a DH public key byte array and a DH secret key byte array. Returns Uint8 byte array
function makeShared(pub,sec){
	return nacl.box.before(pub,sec)
}


//makes the DH public key (Montgomery) from a published Lock (string), which is a Signing public key (Edwards)
function convertPubStr(pubStr){
	return ed2curve.convertPublicKey(nacl.util.decodeBase64(pubStr))
}

//stretches nonce to 24 bytes by adding zeros
function makeNonce24(nonce){
	var	result = new Uint8Array(24);
	for(i=0;i<nonce.length;i++){result[i] = nonce[i]};
	return result
}

//encrypt string with a shared Key, returns a uint8 array
function PLencrypt(plainstr,nonce24,sharedKey,isCompressed){
	if(!isCompressed || plainstr.match('="data:')){						//no compression if it includes a file
		var plain = nacl.util.decodeUTF8(plainstr)
	}else{
		var plain = LZString.compressToUint8Array(plainstr)
	}
	return nacl.secretbox(plain,nonce24,sharedKey)
}

var needRecrypt = false;
//decrypt string (or uint8 array) with a shared Key. Var 'label' is to display messages
function PLdecrypt(cipherStr,nonce24,sharedKey,isCompressed){
	if(typeof cipherStr == 'string'){
		var cipher = nacl.util.decodeBase64(cipherStr)
	}else{
		var cipher = cipherStr
	}
	var	plain = nacl.secretbox.open(cipher,nonce24,sharedKey);					//decryption instruction
	if(!plain){													//failed, try old password
		if(oldPwd.value.trim()){
			plain = nacl.secretbox.open(cipher,nonce24,wiseHash(oldPwd.value.trim(),''));
			if(!plain){
				failedDecrypt()
			}else{
				needRecrypt = true							//record the fact that a new Password is being used
			}
		}else{
			failedDecrypt()
		}
	}
	if(!isCompressed || plain.join().match(",61,34,100,97,116,97,58,")){		//this is '="data:' after encoding
		return nacl.util.encodeUTF8(plain)
	}else{
		return LZString.decompressFromUint8Array(plain)
	}
}

//encrypts a string or uint8 array with the secret Key, 12 char nonce, padding so length for ASCII input is the same no matter what. The input can also be binary, and then it won't be padded
function keyEncrypt(plainstr){
	readKey();																		//make sure the Key is still alive
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce);
	if(typeof plainstr == 'string'){
		plainstr = encodeURI(plainstr).replace(/%20/g,' ');
		while (plainstr.length < 43) plainstr = plainstr + ' ';
		var cipher = PLencrypt(plainstr,nonce24,myKey,false)
	}else{
		var cipher = nacl.secretbox(plainstr,nonce24,myKey)
	}
	return nacl.util.encodeBase64(concatUint8Arrays([144],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'')		//1st character should be k
}

//decrypts a string encrypted with the secret Key, 12 char nonce. Returns original if not encrypted. If isArray set, return uint8 array
function keyDecrypt(cipherStr,isArray){
	var cipher = nacl.util.decodeBase64(cipherStr);
	if (cipher[0] == 144){
		readKey();																	//make sure the Key is still alive
		var	nonce = cipher.slice(1,10),												//ignore the marker byte
			nonce24 = makeNonce24(nonce),
			cipher2 = cipher.slice(10);
		if(isArray){
			var plain = nacl.secretbox.open(cipher2,nonce24,myKey);
			if(!plain){	locDirDecrypt = 'true'; failedDecrypt()}
			return plain
		}else{
			return decodeURI(PLdecrypt(cipher2,nonce24,myKey,false).trim())
		}
	}else{
		return cipherStr
	}
}

//this one escapes dangerous characters, preserving non-breaking spaces
function escapeHTML(str){
	escapeHTML.replacements = { "&": "&amp;", '"': "&quot;", "'": "&#039;", "<": "&lt;", ">": "&gt;" };
	str = str.replace(/&nbsp;/gi,'non-breaking-space')
	str = str.replace(/[&"'<>]/g, function (m){
		return escapeHTML.replacements[m];
	});
	return str.replace(/non-breaking-space/g,'&nbsp;')
}

//mess up all tags except those whitelisted: formatting, images, and links containing a web reference or a file
function safeHTML(string){
	//first mess up attributes with values not properly enclosed within quotes, because Chrome likes to complete those; extra replaces needed to preserve encrypted material
	string = string.replace(/==/g,'double-equal').replace(/<(.*?)=[^"'](.*?)>/g,'').replace(/double-equal/g,'==');
	//now escape every dangerous character; we'll recover tags and attributes on the whitelist later on
	string = escapeHTML(string);
	//make regular expressions containing whitelisted tags, attributes, and origins; sometimes two versions to account for single quotes
	var allowedTags = '(b|i|strong|em|u|strike|sub|sup|blockquote|ul|ol|li|pre|div|span|a|h1|h2|h3|h4|h5|h6|p|pre|table|tbody|tr|td|img|br|wbr|hr|font)',
		tagReg = new RegExp('&lt;(\/?)' + allowedTags + '(.*?)&gt;','gi'),
		allowedAttribs = '(download|style|src|target|name|id|class|color|size|cellpadding|tabindex|type|start|align)',
		attribReg1 = new RegExp(allowedAttribs + '=\&quot;(.*?)\&quot;','gi'),
		attribReg2 = new RegExp(allowedAttribs + '=\&#039;(.*?)\&#039;','gi'),
		allowedOrigins = '(http:\/\/|https:\/\/|mailto:\/\/|#)',
		origReg1 = new RegExp('href=\&quot;' + allowedOrigins + '(.*?)\&quot;','gi'),
		origReg2 = new RegExp('href=\&#039;' + allowedOrigins + '(.*?)\&#039;','gi');
	//recover allowed tags
	string = string.replace(tagReg,'<$1$2$3>');
	//recover allowed attributes
	string = string.replace(attribReg1,'$1="$2"').replace(attribReg2,"$1='$2'");
	//recover file-containing links
	string = string.replace(/href=\&quot;data:(.*?),(.*?)\&quot;/gi,'href="data:$1,$2"').replace(/href=\&#039;data:(.*?),(.*?)\&#039;/gi,"href='data:$1,$2'");
	//recover web links and local anchors
	string = string.replace(origReg1,'href="$1$2"').replace(origReg2,"href='$1$2'");
	return string
}

//detects the presence of data URI scheme and offers to use the safeHTML filter rather than DOMPurify, which removes that content
function decryptSanitizer(string){
	if(string.indexOf('href="data:') == -1){		//check the absence of a link containing data
		var result = DOMPurify.sanitize(string)
	}else{											//otherwise ask the user what to do
		if(confirm('The decrypted material seems to contain binary data, which might lead to unsafe execution in Firefox. If you click OK, it will be preserved, otherwise it will be removed.')){
			var result = safeHTML(string)
		}else{
			var result = DOMPurify.sanitize(string)
		}		
	}
	return result
}

//takes appropriate UI action if decryption fails
function failedDecrypt(){
	if((callKey == 'encrypt' || callKey == 'decrypt') && locDirDecrypt){
		oldKeyScr.style.display = 'block';
		shadow.style.display = 'block';
		locDirDecrypt = false
	}else if(!locDir[theirLock]){
		restoreTempLock();
		mainMsg.textContent = 'Decryption has Failed. Selected sender may be wrong';
		callKey = ''		
	}else if(locDir[theirLock][2] == 'lock'){
		restoreTempLock();
		mainMsg.textContent = 'Messages can be decrypted <em>only once</em>';
		callKey = ''
	}else if(mainBox.textContent.charAt(0) == 'k'){
		mainMsg.textContent = 'The backup has failed to decrypt. Please check your Password';
		callKey = ''
	}else{
		restoreTempLock();
		mainMsg.textContent = 'Decryption has Failed. Try resetting the exchange';
		callKey = ''
	}
	throw('decryption failed')
}

//restores the original data if decrypting from a new Lock fails
function restoreTempLock(){
	if(tempLock){
		locDir[tempLock] = [];
		locDir[tempLock][0] = tempEphKey;
		locDir[tempLock][1] = tempEphLock;
		locDir[tempLock][2] = tempFlag;
		locDir[tempLock][3] = theirName;
		delete locDir[theirLock];
		tempLock = tempEphKey = tempEphLock = tempFlag = '';
		storeData()
	}
}

var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	base36 = "0123456789abcdefghijkLmnopqrstuvwxyz";	//L is capital
//changes the base of a number. inAlpha and outAlpha are strings containing the base code for the original and target bases, as in '0123456789' for decimal
//adapted from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha, isLock) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }

	//add leading zeroes in Locks
	if(isLock){
		if(targetBase == 64){
			while(result.length < 43) result = 'A'+ result;
		} else if (targetBase == 36){
			while(result.length < 50) result = '0'+ result;
		}
	}
    return result;
}