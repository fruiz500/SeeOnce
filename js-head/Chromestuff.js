//to put Lock into sync storage
function syncChromeLock(name,data) {
	var syncName = name;
    var jsonfile = {};
    jsonfile[syncName.toLowerCase()] = data;
    chrome.storage.sync.set(jsonfile);
	
	//now update the list, also in Chrome sync
	updateChromeSyncList();
}

//to update the stored list
function updateChromeSyncList(){
	var ChromeSyncList = Object.keys(locDir).join('|');
	var jsonfile = {};
	jsonfile['ChromeSyncList'] = ChromeSyncList;
	chrome.storage.sync.set(jsonfile)
}

//to completely remove an entry
function remChromeLock(name) {
	var syncName = name;
    chrome.storage.sync.remove(syncName.toLowerCase());
	updateChromeSyncList();
}

//this one controls an asynchronous loop
var asyncLoop = function(o){
    var i=-1;

    var loop = function(){
        i++;
        if(i==o.length){o.callback(); return;}
        o.functionToLoop(loop, i);
    } 
    loop();//init
}

//get Lock list	from Chrome sync, then call an asynchronous loop to retrieve the data
function retrieveAllSync(){
	var syncName = 'ChromeSyncList';
	chrome.storage.sync.get(syncName, function (obj) {
		var lockdata = obj[syncName];
		if(lockdata){
			var ChromeSyncList = lockdata.split('|');
				
//asynchronous loop to fill local directory				
			asyncLoop({
				length : ChromeSyncList.length,
	
				functionToLoop : function(loop, i){
					var syncName2 = ChromeSyncList[i];
					var lockdata2 = {};
					chrome.storage.sync.get(syncName2.toLowerCase(), function (obj) {
						lockdata2 = obj[syncName2.toLowerCase()];
						locDir[ChromeSyncList[i]] = JSON.parse(lockdata2);
						localStorage['locDir'] = JSON.stringify(locDir);
					});
					loop();					
    			},
	
    			callback : function(){	//not used here
				}    
			});			
//end of asynchronous loop, any code below won't wait for it to be done

		} else {introGreeting()}
	});
}