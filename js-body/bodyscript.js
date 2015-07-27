//this is the part of the javascript code that must be within the body

//  Clear out "sorry, no JavaScript" warning and display the type of source
	showGreeting();
	
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
		msgEnd = "<br>Enter your Key. Then click OK";
		
	//display special greeting the first time the program runs. The Chrome app does this differently
	if(!ChromeSyncOn){if(!localStorage){introGreeting();}else if(!localStorage['locDir']){introGreeting();}}
	
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
}

//special instructions the first time it runs
function introGreeting(){
	if(isiPhone || isAndroidPhone){
		keyScr.style.width = '100%';			//more space needed for phones
		keyScr.style.height = '100%';
		keyScr.style.top = 0;
		keyScr.style.left = 0;
		firstTimeKey.style.fontSize = 'large'	//smaller font
	}
	firstTimeKey.style.display = 'block'
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

//functions for reading a file into the box, and for saving it later
function saveURLAsFile(){
	var URLToWrite = mainBox.innerHTML.trim().replace(/<br>/g,'\n'),
		URLToWriteSplit = URLToWrite.split('\n'),
		fileNameToSaveAs = URLToWriteSplit[0].split(':')[1];
	if(URLToWriteSplit.length > 1){
		var content = URLToWriteSplit[1].trim()
	} else {
		var content = URLToWriteSplit[0].trim()
	};
	var downloadLink = document.createElement("a");
	if(content.slice(0,4).toLowerCase()=='data'){							//regular save of encoded file		
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File"
	}
	if (window.URL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = content;
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = content;
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
	mainMsg.innerHTML = 'File saved with filename ' + downloadLink.download
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
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
		if(fileToLoad.type.slice(0,4) == "text"){
			mainBox.innerHTML = URLFromFileLoaded.replace(/  /g,' &nbsp;');
		}else{
			mainBox.innerHTML = "filename:" + fileName + "<br>" + URLFromFileLoaded;
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'This is the content of file <strong>' + fileToLoad.name + '</strong>'
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted</strong>'
	}
	setTimeout(function(){changeButtons();},1000)
}