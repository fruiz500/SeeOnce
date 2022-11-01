//start blinking message, for Msg elements
function blinkMsg(element){
	element.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	element.appendChild(blinker)
}

//this is for showing and hiding text in key box and other password input boxes
function showSec(){
	if(pwd.type=="password"){
		pwd.type="text";
		showKey.src = hideImg
	}else{
		pwd.type="password";
		showKey.src = eyeImg
	}
	keyStrength(pwd.value,true)
}

//same, for old Key box
function showOldSec(){
	if(oldPwd.type=="password"){
		oldPwd.type="text";
		showOldKey.src = hideImg
	}else{
		oldPwd.type="password";
		showOldKey.src = eyeImg
	}
	keyStrength(oldPwd.value,true)
}

//opens a chat page
function main2chat(token){
	if(token){
		window.open("https://passlok.com/chat/chat.html#" + token);
		mainMsg.textContent = 'Chat session open in a separate tab'
	}
}

//to close chat frame
function chat2main(){
	chatScr.style.display = 'none';
	chatMsg.textContent = ''
}

//reloads chat frame
function resetChat(){
	var frame = document.getElementById('chatFrame'),
		src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 10)
}

//for clearing the main box
function clearMain(){
	mainBox.textContent = '';
	if(theirName){mainMsg.textContent = 'Replying to ' + theirName}else{mainMsg.textContent = ''}
	changeButtons()
}

//for selecting the Main box contents and copying them to clipboard
function selectMain(){
  if(mainBox.textContent.trim() != ''){
    var range, selection;
    if(document.body.createTextRange){
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select()
    }else if (window.getSelection){
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy');
	mainMsg.textContent = "main Box copied to clipboard"
  }
}

//for showing.hiding password fields
var eyeImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAASFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACrhKybAAAAF3RSTlMA5Qyz9kEFh3rd1sjDoGsfHRKwQIp+Qzv02bEAAACJSURBVCjPvVBJEoQgDMwCAfeFmfH/P51KkFKL0qN9SXdDVngRy8joHPK4XGyJbtvhohz+3G0ndHPxp0b1mojSqqyZsk+tqphFVN6S8cH+g3wQgwCrGtT3VjhB0BB26QGgN0aAGhDIZP/wUHLrUrk5g4RT83rcbxn3WJA90Y/zgs8nqY94d/b38AeFUhCT+3yIqgAAAABJRU5ErkJggg==",
	hideImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAb1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt6r1GAAAAJHRSTlMAFNTiDPTNBvnaulFBAe/osrGBZCXSwIdnLhzIqKd7XFRLSjAYduwyAAAAuklEQVQoz62QRxbDIAwFhWkhwb07PeH+Z4wQPMjCS89KegP6AjiWSbF9oVzBQNyNlKZZ/s+wwpvLyXlkp7P5umiIcYDIwB0ZLWzrTb3GSQYbMsjDl3wj0fj6TDmpK7F60nnLeDCW2h6rgioBVZgmwlwUJoo6bkC7KRQ9iQ/MzuWtXyjKKcTpmVc8mht4Nu5NV+Y/UAKItaY7byHsOeSkp48uQSahO+kiISfD+ha/nbcLwxwFuzB1hUP5AR4JF1hy2DV7AAAAAElFTkSuQmCC";

//for opening the select User screen
function selectUser(){
	fillList(nameList);
	selectScr.style.display = 'block';
	shadow.style.display = 'block';
	if(nameList.length == 0){			//don't display box if there is nothing there
		nameListSpace.style.display = 'none';
		selectMsg.textContent = 'No stored users. Invite a new user with the lower button'
	}else{
		nameListSpace.style.display = 'block';
		selectMsg.textContent = 'Please select the recipient on the list below and click OK, or invite a new user with the lower button'
	}
}

//to change or disable buttons depending on main box contents
function changeButtons(){
	var text = mainBox.innerHTML.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/">(.*?)\/a>$/,'').replace(/<br>/g,'');
	if(text.match('==')) text = text.split('==')[1].replace(/<(.*?)>/g,'');		//remove tags
	var cipher = extractCipher(text),
		type = cipher.charAt(56);
	if(type.match(/[gopr]/) || cipher.charAt(0) == 'k'){			//regular output
		hideBtn.textContent = 'Hide';
		replyBtn.textContent = 'Email'
	}else if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){		//hidden output
		hideBtn.textContent = 'To...';
		replyBtn.textContent = 'Email'
	}else{
		hideBtn.textContent = 'To...';
		replyBtn.textContent = 'Encrypt'
	}
}

//reveals or hides file output options
function toggleFileOptions(){
	if(fileMode.checked){
		fileOptions.style.display = ''
	}else{
		fileOptions.style.display = 'none'
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
	chatDialog.style.display = "none";
	selectScr.style.display = "none";
	nameScr.style.display = "none";
	resetScr.style.display = "none"
}

function cancelOldKey(){
	closeBox();
	mainMsg.textContent = 'Old Password canceled';
	oldPwd.value = ''
}

function cancelChat(){
	lockForChat = false;
	closeBox();
	mainMsg.textContent = 'Chat canceled'
}

function cancelCover(){
	closeBox();
	mainMsg.textContent = 'Text hide canceled'
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
	mainMsg.textContent = 'Decryption canceled by user'
}

var fromSwitch = false;				//to keep track if the user change dialog was loaded by this action
function hideBtnAction(){
	if(hideBtn.textContent == 'Hide'){textStego();}			//nornmal hiding action
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
		nameMsg.textContent = 'Please type the name of the person who sent you this invitation into the box below, then click OK'
	}else{
		nameListSpace2.style.display = 'block';
		nameMsg.textContent = 'This message was encrypted with a new Password. Please select the sender on the list (old data will be overwritten) or type a new name in the box below, then click OK'
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
	else{return keyStrength(oldPwd.value,true);
	}
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
	keyMsg.textContent = 'Please enter your Password';
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
		niceEditBtn.textContent = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.textContent = 'Plain';
		niceEditor = true
	}
	textheight();
}

//for opening one item at a time in the Help screen, with animation
function openHelp(){
	var helpItems = document.getElementsByClassName('helpHeading');
	for(var i = 0; i < helpItems.length; i++){					//hide all help texts
		var panel = helpItems[i].nextElementSibling;
		panel.style.maxHeight = null;
	}
	helpItems = document.getElementsByClassName('helpHeading2');
	for(var i = 0; i < helpItems.length; i++){					//hide also secondary texts
		var panel = helpItems[i].nextElementSibling;
		panel.style.maxHeight = null;
	}
	var panel = this.nextElementSibling;							//except for the one clicked
	panel.style.maxHeight = panel.scrollHeight + "px"	     
}

//for secondary help items
function openHelp2(){
	var panel = this.nextElementSibling,
		parent = this.parentElement;
	panel.style.maxHeight = panel.scrollHeight + "px";
	setTimeout(function(){parent.style.maxHeight = parent.scrollHeight + "px"},301)
}

//narrower buttons for phones
function narrowButtons(){
	var buttons = document.getElementsByClassName('cssbutton');
	for(var i = 0; i < buttons.length; i++){
		buttons[i].style.paddingLeft = '10px';
		buttons[i].style.paddingRight = '10px'
	}
}