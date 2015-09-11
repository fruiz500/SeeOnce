//stores new Lock
function storeNewLock(){
	var name  = nameBox.value.trim();
	mainMsg.innerHTML = 'Sender saved with name: ' + name;
	theirName = name;
		
	//first delete the data for the previous Lock with that same name, if any
	for(var Lock in locDir){
		if(locDir[Lock][3] == name){
			delete locDir[Lock];
			mainMsg.innerHTML = 'Data for ' + name + ' updated'
		}
	}
	
	//now store new data
	locDir[theirLock][3] = name;	
	storeData();
	closeBox();
}

//to store data permanently
function storeData(Lock){
	if(locDir){
		localStorage['locDir'] = JSON.stringify(locDir);
		moveBtn.disabled = false
	}
		
	if(ChromeSyncOn){												//if Chrome sync is available, add to sync storage
		if(Lock){
			syncChromeLock(Lock,JSON.stringify(locDir[Lock]))		//sync only one entry
		}else{
			for(var name in locDir){
				syncChromeLock(name,JSON.stringify(locDir[name]))	//sync all entries
			}
		}
	}
}

var resetRequested = false;
//this is to just delete the PFS data for a particular Lock
function resetPFS(){
	if(!resetRequested && callKey != 'decrypt'){												//sets flag so action happens on next click
		resetRequested = true;
		mainMsg.innerHTML = "If you click <strong>Reset</strong> again, the current conversation will be reset. This cannot be undone";
		resetBtn.style.background = '#802020';
		setTimeout(function() {
			resetRequested = false;
			resetBtn.style.background = '';
		}, 10000)								//forget request after 10 seconds
		
	}else{
		var name = theirLock;
		if ((locDir[name][0] == null) && (locDir[name][1] == null)){
			mainMsg.innerHTML = 'Nothing to reset';
			throw('no PFS data')
		}
		locDir[name][0] = locDir[name][1] = null;
		locDir[name][2] = 'reset';
		storeData(name);
		mainMsg.innerHTML = "Conversation reset. The next reply won't have perfect forward secrecy";
		resetBtn.style.background = '';
		resetBtn.disabled = true;
		resetRequested = false
	}
}

var wipeEnabled = false;
//makes encrypted backup of the whole DB, then if confirmed wipes data clean
function moveDB(){
	if(mainBox.innerHTML.match(/SeeOnce.net#~/) && wipeEnabled){			//delete data the second time
		locDir = {};
		delete localStorage['locDir'];
		mainMsg.innerHTML = 'Local data wiped';
		moveBtn.style.background = '';
		moveBtn.innerHTML = 'Backup';
		moveBtn.disabled = true;
		wipeEnabled = false
		
	}else{													//normal backup
		callKey = 'movedb';
		readKey();

		//first clean out keys in locDir that don't have any real data
		for (var Lock in locDir){
			if (!locDir[Lock][0] && !locDir[Lock][1]){
				delete locDir[Lock];
			
				if(ChromeSyncOn) remChromeLock(Lock)		//remove from sync as well
			}
		}
		if(!locDir.length && ChromeSyncOn) chrome.storage.sync.remove('ChromeSyncList');		//remove index if empty
	
		//now encrypt it with the user Password
		mainBox.innerHTML = "The gibberish below is a locked backup containing data needed to continue conversations in course. Click on it to unlock it.<br><br>https://SeeOnce.net#" + keyEncrypt(JSON.stringify(locDir)) + "=<br><br>If the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.";
		mainMsg.innerHTML = 'Backup in the box.<br>If you click the same button again, it will now be wiped from this device';
		moveBtn.style.background = '#802020';
		moveBtn.innerHTML = 'Wipe';
		wipeEnabled = true;
		setTimeout(function() {
			moveBtn.style.background = '';
			moveBtn.innerHTML = 'Backup';
			wipeEnabled = false;
		}, 10000)							//cancel after 10 seconds
		if(!isMobile) selectMain();
		changeButtons();
		callKey = '';
	}
}

//merges two objects; doesn't sort the keys
function mergeObjects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

//grab the names in locDir and put them on the given list
function fillList(list){
	list.innerHTML = '';
	var nameArray = [];
	for(var name in locDir){								//get all the names
		nameArray = nameArray.concat(locDir[name][3]);
	}
	nameArray.sort();										//alphabetize
	for(var i = 0; i < nameArray.length; i++){
		if(nameArray[i] != undefined){
			list.innerHTML += '<option value="' + nameArray[i] + '">' + nameArray[i] + '</option>'
		}
	}	
}

//loads the Lock selected on the name list
function loadLock(){
	for (var i = 0; i < nameList.options.length; i++) {
    	if(nameList.options[i].selected){
			for(var Lock in locDir){
				var name  = locDir[Lock][3];
				if(name == nameList.options[i].value){
					theirLock = Lock;
					selectMsg.innerHTML = name + ' selected';
					mainMsg.innerHTML = 'Replying to ' + name;
					theirName = name
				}
			}
			acceptSelectBtn.disabled = false;
			initSession()
    	}
  	}
}

//loads an existing name into the new name box
function loadName(){
	for (var i = 0; i < nameList2.options.length; i++) {
    	if(nameList2.options[i].selected){
			nameBox.value = nameList2.options[i].value
    	}
  	}
	acceptNameBtn.disabled = false;
}