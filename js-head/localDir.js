﻿var tempLock, tempEphKey, tempEphLock, tempFlag;			//to store deleted data in case decryption fails later on

var isInvite = false; 											//to distinguish an invite from a changed Password
//stores new Lock, copies old data if existing
function storeNewLock(){
	var name  = nameBox.value.trim();
	//first get the data for the previous Lock with that same name, if any, and delete that entry
	for(var Lock in locDir){
		if(locDir[Lock][3] == name){
			tempLock = Lock;
			tempEphKey = locDir[Lock][0];
			tempEphLock = locDir[Lock][1];
			tempFlag = locDir[Lock][2];
			delete locDir[Lock];
		}
	}

	//now store new data; be careful not to delete existing data
	if(!locDir[theirLock]) locDir[theirLock] = [];
	if(tempEphKey) locDir[theirLock][0] = tempEphKey;
	if(tempEphLock) locDir[theirLock][1] = tempEphLock;
	if(tempFlag) locDir[theirLock][2] = tempFlag;
	locDir[theirLock][3] = name;
	storeData();
	closeBox();
	theirName = name;
	mainMsg.textContent = 'Sender saved with name: ' + name;
	if(isInvite){
		isInvite = false;
	}else{
		isInvite = false;
		if(mainBox.textContent.match('#(.*)=')) unlockItem()		//decrypt again if still undecrypted
	}
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
//this is to just delete the Read-once data for a particular Lock
function resetPFS(){
	if(!resetRequested && callKey != 'decrypt'){												//sets flag so action happens on next click
		resetRequested = true;
		mainMsg.textContent = "If you click Reset again, the current conversation will be reset. This cannot be undone";
		resetBtn.style.background = '#802020';
		setTimeout(function() {
			resetRequested = false;
			resetBtn.style.background = '';
		}, 10000)								//forget request after 10 seconds

	}else{
		var name = theirLock;
		if ((locDir[name][0] == null) && (locDir[name][1] == null)){
			mainMsg.textContent = 'Nothing to reset';
			return
		}
		locDir[name][0] = locDir[name][1] = null;
		locDir[name][2] = 'reset';
		storeData(name);
		mainMsg.textContent = "Conversation reset. The next reply won't have perfect forward secrecy";
		resetBtn.style.background = '';
		resetBtn.disabled = true;
		resetRequested = false
	}
}

var wipeEnabled = false;
//makes encrypted backup of the whole DB, then if confirmed wipes data clean
function moveDB(){
	if(mainBox.textContent.match(/passlok.com\/seeonce#==k/) && wipeEnabled){			//delete data the second time
		locDir = {};
		delete localStorage['locDir'];
		mainMsg.textContent = 'Local data wiped';
		moveBtn.style.background = '';
		moveBtn.textContent = 'Backup';
		moveBtn.disabled = true;
		wipeEnabled = false

	}else{													//normal backup
		callKey = 'movedb';
		if(!readKey()) return;	

		//first clean out keys in locDir that don't have any real data
		for (var Lock in locDir){
			if (!locDir[Lock][0] && !locDir[Lock][1]){
				delete locDir[Lock];

				if(ChromeSyncOn) remChromeLock(Lock)		//remove from sync as well
			}
		}
		if(!locDir.length && ChromeSyncOn) chrome.storage.sync.remove('ChromeSyncList');		//remove index if empty

		//now encrypt it with the user Password
		mainBox.innerText = "The gibberish below is an encrypted backup containing data needed to continue conversations in course. Click on it to decrypt it.\n\nhttps://passlok.com/seeonce#==" + keyEncrypt(JSON.stringify(locDir)) + "==\n\nIf the link fails or you want to use the standalone app instead, copy the gibberish and paste it into the SeeOnce box.";
		mainMsg.textContent = 'Backup in the box.<br>If you click the same button again, it will now be wiped from this device';
		moveBtn.style.background = '#802020';
		moveBtn.textContent = 'Wipe';
		wipeEnabled = true;
		setTimeout(function() {
			moveBtn.style.background = '';
			moveBtn.textContent = 'Backup';
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
	list.textContent = '';
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
					selectMsg.textContent = name + ' selected';
					mainMsg.textContent = 'Replying to ' + name;
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