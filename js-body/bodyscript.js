//this is the part of the javascript code that must be within the body

//detect browser and device
	var isMobile = (typeof window.orientation != 'undefined'),
		isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
		isFirefox = typeof InstallTrigger !== 'undefined',   						// Firefox 1.0+
		isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,       // At least Safari 3+: "[object HTMLElementConstructor]"
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,								// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		isIE = /*@cc_on!@*/false || !!document.documentMode,						 // At least IE6
		isiPad = (navigator.userAgent.match(/iPad/i) != null),
		isiPhone = (navigator.userAgent.match(/iPhone|iPod/i) != null),
		isiOS = (isiPhone || isiPad),
		isAndroid = (isMobile && !isiOS),
		isAndroidTablet = (navigator.userAgent.match(/mobile/i) == null && isAndroid),
		isAndroidPhone = (navigator.userAgent.match(/mobile/i) != null && isAndroid),
		isFile = (window.location.protocol == 'file:');
	textheight();

//  Clear out "sorry, no JavaScript" warning and display the type of source
	showGreeting();

//set global variable indicating if there is a Chrome sync data area. Works for Chrome apps and extension
var ChromeSyncOn = false;
if(isChrome){
	if(chrome.storage){
		if(chrome.storage.sync){
			ChromeSyncOn = true;
			retrieveAllSync();
		}
	}
}

//clears the no JavaScript warning and displays an initial message depending on the type of source
function showGreeting(){
	var protocol = window.location.protocol,
		msgStart = "<span style='color:lime;font-size:xx-large;'><strong>Welcome to SeeOnce</strong></span><br />",
		msgEnd = "<br>Enter your Password and click OK";
	if(protocol == 'file:'){
		keyMsg.innerHTML = msgStart + 'running from a local file' + msgEnd
	}else if(protocol == 'https:'){
		keyMsg.innerHTML = msgStart + 'downloaded from a secure server' + msgEnd
	}else if(protocol == 'chrome-extension:'){
		keyMsg.innerHTML = msgStart + 'running as a Chrome app' + msgEnd
	}else{
		mainScr.style.backgroundColor = '#ffd0ff';
		keyMsg.innerHTML = msgStart + '<span style="color:orange">WARNING: running from an insecure source!</span>' + msgEnd
	}

	//display special greeting the first time the program runs. The Chrome app does this differently
	if(!ChromeSyncOn){if(!localStorage){introGreeting();}else if(!localStorage['locDir']){introGreeting();}}
}

//special instructions the first time it runs
function introGreeting(){
	firstTimeKey.style.display = 'block';
	keyMsg.innerHTML = 'The strength will appear here<br>Enter the Password and click <strong>OK</strong>';
	if(isiPhone || isAndroidPhone){
		keyScr.style.width = '100%';			//more space needed for phones
		keyScr.style.height = '100%';
		keyScr.style.top = 0;
		keyScr.style.left = 0;
		firstTimeKey.style.fontSize = 'large'	//smaller font
	}else if(isMobile){
		firstTimeKey.style.fontSize = 'large'
	}
}
function cancelIntroGreeting(){
	keyScr.style.width = '';
	keyScr.style.height = '';
	keyScr.style.top = '';
	keyScr.style.left = '';
	firstTimeKey.style.display = 'none'
}

//resizes text boxes so they fit within the window
function textheight(){
	var	fullheight = document.documentElement.clientHeight,
		offsetheight = 400,
		toolbarheight = 50;
	if(isiPhone) offsetheight = offsetheight - 70;
	coverBox.style.height = fullheight - offsetheight + 50 + 'px';
	if(niceEditor){
		mainBox.style.height = fullheight - offsetheight - toolbarheight + 'px'
	}else{
		if(isMobile){
			if(isAndroid && !isFile){
				mainBox.style.height = fullheight - offsetheight + 80 + 'px';
			}else{
				mainBox.style.height = fullheight - offsetheight + 40 + 'px';
			}
		}else{
			mainBox.style.height = fullheight - offsetheight + 'px';
		}
	}
}

//this one is called by window.onload below
function loadFileAsURL()
{
	var fileToLoad = fileBtn.files[0];

	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent)
	{
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.length > 2000000){
			var reply = confirm("This file is larger than 1.5MB and Chrome won't save it. Do you want to continue loading it?");
			if(!reply){
				mainMsg.innerHTML = 'File load canceled';
				throw('file load canceled')
			}
		}
		if(fileToLoad.type.slice(0,4) == "text"){
			if(URLFromFileLoaded.slice(0,2) == '==' && URLFromFileLoaded.slice(-2) == '=='){
				mainBox.innerHTML += '<br><a download="' + fileName + '" href="data:,' + URLFromFileLoaded + '">' + fileName + '&nbsp;&nbsp;<button onClick="followLink(this);">Save</button></a>'
			}else{
				mainBox.innerHTML += "<br><br>" + URLFromFileLoaded.replace(/  /g,' &nbsp;')
			}
		}else{
			mainBox.innerHTML += '<br><a download="' + fileName + '" href="' + URLFromFileLoaded + '">' + fileName + '&nbsp;&nbsp;<button onClick="followLink(this);">Save</button></a>'
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'This is the content of file <strong>' + fileToLoad.name + '</strong>';
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted.</strong>';
	}
}

//used to download a packaged file
function followLink(thisLink){
	var downloadLink = document.createElement("a");
	downloadLink.download = thisLink.parentElement.download;
	downloadLink.href = thisLink.parentElement.href;
	if (isFirefox){
		// Firefox requires the link to be added to the DOM before it can be clicked
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}