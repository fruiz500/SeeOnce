//this is for showing and hiding text in key box and other password input boxes
function showSec(){
	if(showKey.checked){
		pwd.type="TEXT";
	}else{
		pwd.type="PASSWORD";
	}
};

//same, for old Key box
function showOldSec(){
	if(showOldKey.checked){
		oldPwd.type="TEXT";
	}else{
		oldPwd.type="PASSWORD";
	}
};

//for clearing the main box
function clearMain(){
	mainBox.innerHTML = '';
	if(theirName){mainMsg.innerHTML = 'Replying to ' + theirName}else{mainMsg.innerHTML = ''}
	changeButtons()
}

//for selecting the Main box contents
function selectMain(){
    var range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range);
    }
	document.execCommand('copy')
}

//for opening the select User screen
function selectUser(){
	fillList(nameList);
	selectScr.style.display = 'block';
	shadow.style.display = 'block';
	if(nameList.length == 0){			//don't display box if there is nothing there
		nameListSpace.style.display = 'none';
		selectMsg.innerHTML = 'No stored users. Invite a new user with the lower button'
	}else{
		nameListSpace.style.display = 'block';
		selectMsg.innerHTML = 'Please select the recipient on the list below and click <strong>OK</strong>, or invite a new user with the lower button'
	}
}

//to change or disable buttons depending on main box contents
function changeButtons(){
	var text = mainBox.innerHTML.trim(),
		type = extractCipher(text).charAt(50);
	if(type == '$' || type == '*' || type == ':' || type == '@' || extractCipher(text).charAt(0) == '~'){			//regular output
		hideBtn.innerHTML = 'Hide';
		replyBtn.innerHTML = 'Email'
	}else if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){		//hidden output
		hideBtn.innerHTML = 'To...';
		replyBtn.innerHTML = 'Email'
	}else{
		hideBtn.innerHTML = 'To...';
		replyBtn.innerHTML = 'Encrypt'
	}
}

//accepts old Password and restarts interrupted process
function acceptOldKey(){
	closeBox();
	if(callKey == 'encrypt'){
		lockItem()
	}else if(callKey == 'decrypt'){
		Decrypt()
	}
}

//these close input dialogs
function closeBox() {
	shadow.style.display = "none";
	keyScr.style.display = "none";
	oldKeyScr.style.display = "none";
	coverScr.style.display = "none";
	chatScr.style.display = "none";
	selectScr.style.display = "none";
	nameScr.style.display = "none";
	resetScr.style.display = "none"
}

function cancelOldKey(){
	closeBox();
	mainMsg.innerHTML = 'Old Password canceled';
}

function cancelChat(){
	lockForChat = false;
	closeBox();
	mainMsg.innerHTML = 'Chat canceled';
}

function cancelCover(){
	closeBox();
	mainMsg.innerHTML = 'Text hide canceled';
}

function acceptSelect(){
	acceptSelectBtn.disabled = true;
	closeBox();
	if(fromChat){ startChat(); fromChat = false }else if(!fromSwitch){ lockItem() }else{ fromSwitch = false }
}

function cancelSelect(){
	acceptSelectBtn.disabled = true;
	fromSwitch = false;
	closeBox()
}

var resetOK = false;
function acceptReset(){
	closeBox();
	resetOK = true;
	Decrypt()
}

function cancelReset(){
	closeBox();
	mainMsg.innerHTML = 'Decryption canceled by user'
}

var fromSwitch = false;				//to keep track if the user change dialog was loaded by this action
function hideBtnAction(){
	if(hideBtn.innerHTML == 'Hide'){textStego();}			//nornmal hiding action
	else {
		fromSwitch = true;									//display dialog to change recipient
		selectUser()
	}
}

//opens screen to store new Lock obtained through a message
function openNewLock(){
	nameScr.style.display = 'block';
	shadow.style.display = 'block';
	fillList(nameList2);
	nameBox.value = '';
	if(nameList2.length == 0){
		nameListSpace2.style.display = 'none';
		nameMsg.innerHTML = 'Please type the name of the person who sent you this invitation into the box below, then click <strong>OK</strong>'
	}else{
		nameListSpace2.style.display = 'block';
		nameMsg.innerHTML = 'This message was encrypted with a new Password. Please select the sender on the list (old data will be overwritten) or type a new name in the box below, then click <strong>OK</strong>'
	}
}

//displays Password strength and resets timer
function pwdKeyup(evt){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {pwd.value = ''; oldPwd.value = '';}, 300000);
	keytime = new Date().getTime();
	if(pwd.value.trim() == ''){acceptKeyBtn.disabled = true;}else{acceptKeyBtn.disabled = false;}
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptKey()}
	else if(pwd.value.trim() == ''){return}
	else{return keyStrength(pwd.value,true);
	}
}

//enter old password from keyboard
function oldPwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptOldKey()}
	else if(oldPwd.value.trim() == ''){return}
}

//stores new name from box or disables OK button
function nameKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){storeNewLock()};
	if(nameBox.value.trim() == ''){acceptNameBtn.disabled = true;}else{acceptNameBtn.disabled = false;}
}

//called when the Password box is empty
function any2key(){
	closeBox();
	cancelIntroGreeting();
	shadow.style.display = 'block';
	keyScr.style.display = 'block';
	keyMsg.innerHTML = 'Please enter your Password';
	if(!isMobile) pwd.focus()
}

//close screens and reset Password timer when leaving the Password box. Restarts whatever was being done when the Password was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {pwd.value = ''; oldPwd.value = ''}, 300000)	//reset timer for 5 minutes, then delete Password
	keytime = new Date().getTime();
	keyScr.style.display = 'none';
	shadow.style.display = 'none';
}

//writes five random dictionary words in the Password box
function suggestKey(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwd.type="TEXT";
	pwd.value = output.trim();
	showKey.checked = true
}

//enables OK button if a sufficiently long cover text is loaded
function enableCover(){
	setTimeout(function(){
		var text = coverBox.value.trim();
		if(text.length > 1400){
			acceptCoverBtn.disabled = false
		}else{
			coverMsg.innerHTML = 'The cover text must be at least 1400 characters long'
		}
	},20)
}
//for opening the help screen and back
function main2help(){
	if(mainScr.style.display == 'block'){
		mainScr.style.display = 'none';
		helpScr.style.display = 'block'
	}else{
		mainScr.style.display = 'block';
		helpScr.style.display = 'none'
	}
}

//put cursor in the box. Handy when using keyboard shortcuts
function focusBox(){
	if (!isMobile){															//on mobile, don't focus
		if(keyScr.style.display == 'block'){
			pwd.focus()
		} else {
			mainBox.focus()
		}
	}
}

//simple XSS filter for use in innerHTML-editing statements. Removes stuff between angle brackets
function XSSfilter(string){
	return string.replace(/<(.*?)>/gi, "")
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); mainBox.focus();
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		mainBox.style.borderTopLeftRadius = '15px';
		mainBox.style.borderTopRightRadius = '15px';
		niceEditBtn.innerHTML = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}

//to open and close items
function openClose(theID) {
	if (document.getElementById(theID).style.display == "block") {
		document.getElementById(theID).style.display = "none"
	} else {
		document.getElementById(theID).style.display = "block"
	}
}

//as above, but closes everything else in help
function openHelp(theID){
	var helpItems = document.getElementsByClassName('helptext');
	for(var i=0; i < helpItems.length; i++){
		helpItems[i].style.display = 'none'
	}
	document.getElementById(theID).style.display = "block";
	if(isMobile){									//scroll to the item
		location.href = '#';
		location.href = '#a' + theID
	}
}

//narrower buttons for phones
function narrowButtons(){
	var buttons = document.getElementsByClassName('cssbutton');
	for(var i = 0; i < buttons.length; i++){
		buttons[i].style.paddingLeft = '10px';
		buttons[i].style.paddingRight = '10px'
	}
}