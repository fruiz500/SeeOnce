// initialize things
window.onload = function() {

	if(isMobile){
		niceEditBtn.style.display = 'none';		//no rich text editing on mobile
		fileBtn.style.display = 'none';
		selectBtn.style.display = 'none';
	}
	if(isiPhone || isAndroidPhone){				//screen is narrow, so use smaller type and buttons
		keyMsg.style.fontSize = 'medium';
		mainMsg.style.fontSize = 'medium';
		mainMsg.style.height = '40px';
		logo.style.height = '70px';
		narrowButtons()
	}
	if(isiOS || isSafari || isIE) makeChatBtn.style.display = 'none';		//webRTC not supported in these

  //event listeners for buttons etc.
	window.addEventListener('resize',textheight);

   	showKey.addEventListener('click', showSec);

	showOldKey.addEventListener('click', showOldSec);

	acceptKeyBtn.addEventListener('click', acceptKey);

	acceptOldKeyBtn.addEventListener('click', acceptOldKey);

	cancelOldKeyBtn.addEventListener('click', cancelOldKey);

	mainBox.addEventListener('paste', pasteItem);
	function pasteItem() {setTimeout(function(){unlockItem();}, 0);}

	mainBox.addEventListener('keyup', changeButtons);

    fileBtn.addEventListener('change', loadFileAsURL);

	selectBtn.addEventListener('click', selectMain);

   	clearBtn.addEventListener('click', clearMain);

	helpBtn.addEventListener('click', main2help);

	help2mainBtnTop.addEventListener('click', main2help);

	help2mainBtnBottom.addEventListener('click', main2help);

   	replyBtn.addEventListener('click', lockItem);

   	niceEditBtn.addEventListener('click', toggleRichText);

	inviteBtn.addEventListener('click', makeInvite);

	hideBtn.addEventListener('click', hideBtnAction);

	resetBtn.addEventListener('click', resetPFS);

	moveBtn.addEventListener('click', moveDB);

   	makeChatBtn.addEventListener('click', startChat);

	submitChatBtn.addEventListener('click', makeChat);

   	cancelChatBtn.addEventListener('click', cancelChat);

	suggestKeyBtn.addEventListener('click', suggestKey);

	coverBox.addEventListener('paste', enableCover);

	cancelCoverBtn.addEventListener('click', cancelCover);

	acceptCoverBtn.addEventListener('click', textStego);

	nameList.addEventListener('change', loadLock);

	nameList2.addEventListener('change', loadName);

	cancelSelectBtn.addEventListener('click', cancelSelect);

	acceptSelectBtn.addEventListener('click', acceptSelect);

	acceptNameBtn.addEventListener('click', storeNewLock);

	cancelResetBtn.addEventListener('click', cancelReset);

	acceptResetBtn.addEventListener('click', acceptReset);

//Firefox requires the keyup code to be inline if it refers to the event
//but this must be removed for the Chrome app and replaced with those commented below

//	pwd.addEventListener('keyup', function() {pwdKeyup(event)}, false);
//	oldPwd.addEventListener('keyup', function() {oldPwdKeyup(event)}, false);
//	nameBox.addEventListener('keyup', function() {nameKeyup(event)}, false);

//for the rich text editor boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

	document.images[1].addEventListener("click", function() {formatDoc('bold')});
	document.images[2].addEventListener("click", function() {formatDoc('italic')});
	document.images[3].addEventListener("click", function() {formatDoc('underline')});
	document.images[4].addEventListener("click", function() {formatDoc('strikethrough')});
	document.images[5].addEventListener("click", function() {formatDoc('subscript')});
	document.images[6].addEventListener("click", function() {formatDoc('superscript')});
	document.images[7].addEventListener("click", function() {formatDoc('justifyleft')});
	document.images[8].addEventListener("click", function() {formatDoc('justifycenter')});
	document.images[9].addEventListener("click", function() {ormatDoc('justifyright')});
	document.images[10].addEventListener("click", function() {formatDoc('justifyfull')});
	document.images[11].addEventListener("click", function() {formatDoc('insertorderedlist')});
	document.images[12].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	document.images[13].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	document.images[14].addEventListener("click", function() {formatDoc('outdent')});
	document.images[15].addEventListener("click", function() {formatDoc('indent')});
	document.images[16].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	document.images[17].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	document.images[18].addEventListener("click", function() {formatDoc('unlink')});
	document.images[19].addEventListener("click", function() {formatDoc('removeFormat')});
	document.images[20].addEventListener("click", function() {formatDoc('undo')});
	document.images[21].addEventListener("click", function() {formatDoc('redo')});

//for the collapsible help items
	aa1.addEventListener('click', function() {openHelp('a1')});
	aa2.addEventListener('click', function() {openHelp('a2')});
	aa3.addEventListener('click', function() {openHelp('a3')});
	aa4.addEventListener('click', function() {openHelp('a4')});
	aa5.addEventListener('click', function() {openHelp('a5')});
	aa6.addEventListener('click', function() {openHelp('a6')});
	aa7.addEventListener('click', function() {openHelp('a7')});
	aa8.addEventListener('click', function() {openHelp('a8')});
	aa9.addEventListener('click', function() {openHelp('a9')});
	aa10.addEventListener('click', function() {openHelp('a10')});
	aa11.addEventListener('click', function() {openHelp('a11')});

	bb8.addEventListener('click', function() {openClose('b8')});
	bb9.addEventListener('click', function() {openClose('b9')});

};

var time10 = hashTime10();											//get milliseconds for 10 wiseHash at iter = 10

mainBox.innerHTML = window.location.hash.slice(1);			//correspondent's message from address bar

var theirezLock = mainBox.innerHTML.slice(0,50),
	theirLock = changeBase(theirezLock, base36, base64, true),
	theirName = '';

//this one is for mobile only. Remove for the Chrome app
window.addEventListener('load', function() {
	FastClick.attach(document.body);
}, false);


//end of body script.