//	############################################
//	**** grandMA2/dot2 Chataigne Module by FPaul ****
//	############################################

var legacyKeys = ["cues", "color"];
var codeVersion = 1;

var timestamp = 0.0;
var lastKeepAliveTime = 0.0;
var DFTimestamp = 0.0;
var DBTimestamp = 0.0;
var SFTimestamp = 0.0;
var SBTimestamp = 0.0;

var sessionStarting = false;
var playbackStartOffset = 8;
var rateLimitArray = [];
var rateLimitDataArray = [];

var playbackRequestArray = [];
var dynamicExecList = [];
var staticExecList = [];
var readyToParse = true;

function init() {
	
	//local.parameters.dataVersion.setAttribute("readonly",true);
	//local.parameters.dataVersion.setAttribute("saveValueOnly",false);
	//local.values.internal.dataVersions.clear();
	if (typeof local.values.internal.dataVersions[codeVersion + ''] == 'undefined' && local.values.executors.activePage.getContainers().length > 0) {
		util.showMessageBox("Module update detected!", "It looks like you have updated the module and it expects a higher Datablock version.\nThis likely will cause errors if not resolved before session start.\n\nYou can either try the Validate Databocks button in the Advanced settings, or clear the Datablocks.\n\nAlternatively you can also remove and re-add the module in Chataigne.", "info", "Got it");
	}

	//local.scripts.grandMA2.enableLog.set(true);
	readOnlyPlaybacksConfig(false);
	script.setUpdateRate(50);
	//local.parameters.session.status.set(false);
	//local.values.internal.forceLogin.set(true);
	//local.parameters.session.sessionID.set(0);
	local.parameters.session.startSession.setAttribute("enabled", true);
	local.parameters.session.endSession.setAttribute("enabled", false);
	local.values.internal.connectionsLimitReached.set(false);

	if (local.parameters.session.status.get() == true) {
		buildRequestArrays(false);
	}
	
	// Populate default Server Path after the script is running so that console type can be detected
	if (local.parameters.serverPath.get() == '') {
		local.parameters.serverPath.set('127.0.0.1:80/?ma=1');
	}
}

function buildRequestArrays( forceCreate) {
	//Erase all previous data and prepare a new array structure.
	playbackRequestArray.splice(0, playbackRequestArray.length);
	dynamicExecList.splice(0, dynamicExecList.length);
	staticExecList.splice(0, staticExecList.length);
	playbackRequestArray = [[[],[],[]],[[],[],[]],[],[]];

	//Build Dynamic Faders block.
	if (local.parameters.playbacks.dynamic.faders.get() != '') {
		var loopTempArray = local.parameters.playbacks.dynamic.faders.get().split(";");
		for (var tempSplitIndex = 0; tempSplitIndex < loopTempArray.length; tempSplitIndex++ ) {    			
			playbackRequestArray[0][0].push(parseInt(loopTempArray[tempSplitIndex].split("-")[0]) - 1);
			playbackRequestArray[0][1].push(parseInt(loopTempArray[tempSplitIndex].split("-")[1]) - parseInt(loopTempArray[tempSplitIndex].split("-")[0]) + 1);
			playbackRequestArray[0][2].push(2);
			for (var tempListIndex = parseInt(loopTempArray[tempSplitIndex].split("-")[0]); tempListIndex < parseInt(loopTempArray[tempSplitIndex].split("-")[1]) + 1; tempListIndex++ ) {  
				//Add element to the dynamic lookup table.
				dynamicExecList.push('exec' + tempListIndex);
				if (typeof local.values.executors["activePage"]["exec" + tempListIndex] != 'object' && local.parameters.advanced.preGenerateValues.get() == true) {
					createNewExecutor(1, "activePage", tempListIndex, "exec" + tempListIndex);
				} else if (forceCreate == true) {
					createNewExecutor(1, "activePage", tempListIndex, "exec" + tempListIndex);
				}
			}
		}
	}

	//Build Dynamic Buttons block.
	if (local.parameters.playbacks.dynamic.buttons.get() != '') {
		var loopTempArray = local.parameters.playbacks.dynamic.buttons.get().split(";");
		for (var tempSplitIndex = 0; tempSplitIndex < loopTempArray.length; tempSplitIndex++ ) {    			
			playbackRequestArray[1][0].push(parseInt(loopTempArray[tempSplitIndex].split("-")[0]) - 1);
			playbackRequestArray[1][1].push(parseInt(loopTempArray[tempSplitIndex].split("-")[1]) - parseInt(loopTempArray[tempSplitIndex].split("-")[0]) + 1);
			playbackRequestArray[1][2].push(3);
			for (var tempListIndex = parseInt(loopTempArray[tempSplitIndex].split("-")[0]); tempListIndex < parseInt(loopTempArray[tempSplitIndex].split("-")[1]) + 1; tempListIndex++ ) {  
				//Add element to the dynamic lookup table.
				dynamicExecList.push('exec' + tempListIndex);
				if (typeof local.values.executors["activePage"]["exec" + tempListIndex] != 'object' && local.parameters.advanced.preGenerateValues.get() == true) {
					createNewExecutor(1, "activePage", tempListIndex, "exec" + tempListIndex);
				} else if (forceCreate == true) {
					createNewExecutor(1, "activePage", tempListIndex, "exec" + tempListIndex);
				}
			}
		}
	}

	//Build Static Faders block.
	if (local.parameters.playbacks.static.faders.get() != '') {
		var tempPagePreparationArray = local.parameters.playbacks.static.faders.get().split(";");
		var tempStaticObject = {};
		var tempPageCount = 0;
		var tempPageList = [];

		//Process all entries into an Object with combined page blocks.
		for (var tempSplitIndex = 0; tempSplitIndex < tempPagePreparationArray.length; tempSplitIndex++ ) {    
			if (typeof tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]] != 'object') {
				tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]] = [];
				tempPageCount++;
				tempPageList.push(tempPagePreparationArray[tempSplitIndex].split(".")[0]);
			}
			tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]].push(tempPagePreparationArray[tempSplitIndex].split(".")[1]);
		}

		//Build array for each page block.
		for (var tempPageSplitIndex = 0; tempPageSplitIndex < tempPageList.length; tempPageSplitIndex++ ) {	
			playbackRequestArray[2].push([[],[],[],0]);	
			var loopTempArray = tempStaticObject[tempPageList[tempPageSplitIndex]].join(';').split(";");
			for (var tempSplitIndex = 0; tempSplitIndex < loopTempArray.length; tempSplitIndex++ ) {    			
				playbackRequestArray[2][tempPageSplitIndex][0].push(parseInt(loopTempArray[tempSplitIndex].split("-")[0]) - 1);
				playbackRequestArray[2][tempPageSplitIndex][1].push(parseInt(loopTempArray[tempSplitIndex].split("-")[1]) - parseInt(loopTempArray[tempSplitIndex].split("-")[0]) + 1);
				playbackRequestArray[2][tempPageSplitIndex][2].push(2);
				for (var tempListIndex = parseInt(loopTempArray[tempSplitIndex].split("-")[0]); tempListIndex < parseInt(loopTempArray[tempSplitIndex].split("-")[1]) + 1; tempListIndex++ ) {  
				//Add element to the static lookup table.
					staticExecList.push('page'+ tempPageList[tempPageSplitIndex]  + 'exec' + tempListIndex);

					if (typeof local.values.executors['page'+ tempPageList[tempPageSplitIndex]]['exec' + tempListIndex] != 'object' && local.parameters.advanced.preGenerateValues.get() == true) {
						createNewExecutor(tempPageList[tempPageSplitIndex], 'page'+ tempPageList[tempPageSplitIndex], tempListIndex, 'exec' + tempListIndex);
					} else if (forceCreate == true) {
						createNewExecutor(tempPageList[tempPageSplitIndex], 'page'+ tempPageList[tempPageSplitIndex], tempListIndex, 'exec' + tempListIndex);
					}
				}	
				playbackRequestArray[2][tempPageSplitIndex][3] = parseInt(tempPageList[tempPageSplitIndex]);	
			}				
		}
	}

	//Build Static Buttons block.
	if (local.parameters.playbacks.static.buttons.get() != '') {
		var tempPagePreparationArray = local.parameters.playbacks.static.buttons.get().split(";");
		var tempStaticObject = {};
		var tempPageCount = 0;
		var tempPageList = [];

		//Process all entries into an Object with combined page blocks.
		for (var tempSplitIndex = 0; tempSplitIndex < tempPagePreparationArray.length; tempSplitIndex++ ) {    
			if (typeof tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]] != 'object') {
				tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]] = [];
				tempPageCount++;
				tempPageList.push(tempPagePreparationArray[tempSplitIndex].split(".")[0]);
			}
			tempStaticObject[tempPagePreparationArray[tempSplitIndex].split(".")[0]].push(tempPagePreparationArray[tempSplitIndex].split(".")[1]);
		}

		//Build array for each page block
		for (var tempPageSplitIndex = 0; tempPageSplitIndex < tempPageList.length; tempPageSplitIndex++ ) {	
			playbackRequestArray[3].push([[],[],[],0]);	
			var loopTempArray = tempStaticObject[tempPageList[tempPageSplitIndex]].join(';').split(";");
			for (var tempSplitIndex = 0; tempSplitIndex < loopTempArray.length; tempSplitIndex++ ) {    			
				playbackRequestArray[3][tempPageSplitIndex][0].push(parseInt(loopTempArray[tempSplitIndex].split("-")[0]) - 1);
				playbackRequestArray[3][tempPageSplitIndex][1].push(parseInt(loopTempArray[tempSplitIndex].split("-")[1]) - parseInt(loopTempArray[tempSplitIndex].split("-")[0]) + 1);
				playbackRequestArray[3][tempPageSplitIndex][2].push(3);
				for (var tempListIndex = parseInt(loopTempArray[tempSplitIndex].split("-")[0]); tempListIndex < parseInt(loopTempArray[tempSplitIndex].split("-")[1]) + 1; tempListIndex++ ) {  
					//Add element to the static lookup table.
					staticExecList.push('page'+ tempPageList[tempPageSplitIndex]  + 'exec' + tempListIndex);
					if (typeof local.values.executors['page'+ tempPageList[tempPageSplitIndex]]['exec' + tempListIndex] != 'object' && local.parameters.advanced.preGenerateValues.get() == true) {
						createNewExecutor(tempPageList[tempPageSplitIndex], 'page'+ tempPageList[tempPageSplitIndex], tempListIndex, 'exec' + tempListIndex);
					} else if (forceCreate == true) {
						createNewExecutor(tempPageList[tempPageSplitIndex], 'page'+ tempPageList[tempPageSplitIndex], tempListIndex, 'exec' + tempListIndex);
					}
				}	
				playbackRequestArray[3][tempPageSplitIndex][3] = parseInt(tempPageList[tempPageSplitIndex]);	
			}				
		}
	}
}

//Changes readOnlyState so config can not be changed while in session.
function readOnlyPlaybacksConfig(stateToSetTo) {
	local.parameters.playbacks.dynamic.faders.setAttribute("readonly",stateToSetTo);
	local.parameters.playbacks.dynamic.buttons.setAttribute("readonly",stateToSetTo);
	local.parameters.playbacks.static.faders.setAttribute("readonly",stateToSetTo);
	local.parameters.playbacks.static.buttons.setAttribute("readonly",stateToSetTo);
}

function update(deltaTime) {
	timestamp = util.getTime();	
	if (local.parameters.connected.get() == true) {
		//This rate limiter watchdog cleans the limit list and ensures sending the final target value, if it was cut of by rate limiting.

		//Is there any check queued up?
		if (rateLimitArray.length != -1 ) {

			//Check each existing entry.
			for (var rateLimitIndex = 0; rateLimitIndex < rateLimitArray.length; rateLimitIndex++) {

				//If timestamp difference is great than set threshold check if should be value is actual last send value.
				//The max time that has to be elapsed dynamically adjusts based on the amount of faders simultaniously send.
				if ((timestamp - rateLimitDataArray[rateLimitIndex].timestamp) > 0.04 + Math.max((0.0022 * rateLimitArray.length), 0.0)) {
					
					//If not true, trigger one send of the should be value to ensure final setpoint get's hit.
					if (rateLimitDataArray[rateLimitIndex].targetValue != rateLimitDataArray[rateLimitIndex].isValue) {
						commandSetExecutorValue(0, rateLimitArray[rateLimitIndex][0], rateLimitArray[rateLimitIndex][1], rateLimitDataArray[rateLimitIndex].targetValue);
					
					//Setpoint was already hit, just clear.
					} else {
						rateLimitArray.splice(rateLimitIndex, 1);
						rateLimitDataArray.splice(rateLimitIndex, 1);
					}		
				}
			}
		}

		//Keep alive timer trigger, as MA2 will terminate a session if it does not get this specific "blank" request in a 10 second interval.
		//(Even if other requests are sent during that time, it's gotta be this specific "blank" one.)
		if (local.parameters.session.status.get() == true){		
			if ((timestamp - lastKeepAliveTime) > 10) {
				lastKeepAliveTime = timestamp;
				local.send('{"session":' + local.parameters.session.sessionID.get() + '}');
			}

			//Request playbacks from MA, based on user config.
			if (local.parameters.playbacks.requestPlaybacks.get() == true) {	

				//Dynamic Faders
				if ((timestamp - DFTimestamp) >= local.parameters.playbacks.dynamic.faderInterval.get()) {
					if ((playbackStartOffset < 2) && (playbackRequestArray[0][0].length > 0)) {
						DFTimestamp = timestamp;
						requestPlaybacks(playbackRequestArray[0][0].join(','), playbackRequestArray[0][1].join(','), local.parameters.playbacks.dynamic.activePage.get(), playbackRequestArray[0][2].join(','), 2, 1, 0, local.parameters.session.sessionID.get());	
					}
				}
				//Dynamic Buttons.
				if ((timestamp - DBTimestamp) >= local.parameters.playbacks.dynamic.buttonInterval.get()) {
					if ((playbackStartOffset < 2) && (playbackRequestArray[1][0].length > 0)) {
						DBTimestamp = timestamp;			
						requestPlaybacks(playbackRequestArray[1][0].join(','), playbackRequestArray[1][1].join(','), local.parameters.playbacks.dynamic.activePage.get(), playbackRequestArray[1][2].join(','), 3, 1, 0, local.parameters.session.sessionID.get());		
					}
				}

				//Static Faders.
				if ((timestamp - SFTimestamp) >= local.parameters.playbacks.static.faderInterval.get()) {
					if ((playbackStartOffset < 6) && (playbackRequestArray[2][0].length > 0)) {
						SFTimestamp = timestamp;
						for (var tempSplitIndex = 0; tempSplitIndex < playbackRequestArray[2].length; tempSplitIndex++ ) { 
							requestPlaybacks(playbackRequestArray[2][tempSplitIndex][0].join(','), playbackRequestArray[2][tempSplitIndex][1].join(','), playbackRequestArray[2][tempSplitIndex][3], playbackRequestArray[2][tempSplitIndex][2].join(','), 2, 1, 0, local.parameters.session.sessionID.get());	
						}
					}
				}

				//Static Buttons.
				if ((timestamp - SBTimestamp) >= local.parameters.playbacks.static.buttonInterval.get()) {
					if ((playbackStartOffset < 3) && (playbackRequestArray[3][0].length > 0)) {
						SBTimestamp = timestamp;
						for (var tempSplitIndex = 0; tempSplitIndex < playbackRequestArray[3].length; tempSplitIndex++ ) { 
							requestPlaybacks(playbackRequestArray[3][tempSplitIndex][0].join(','), playbackRequestArray[3][tempSplitIndex][1].join(','), playbackRequestArray[3][tempSplitIndex][3], playbackRequestArray[3][tempSplitIndex][2].join(','), 3, 1, 0, local.parameters.session.sessionID.get());	
						}
					}
				}

				//Ticking down start counter to offset the request timers cycles to ideally offset the playback request requests.
				if (playbackStartOffset > 0) {
					playbackStartOffset--;
				}
			}
			local.parameters.session.startSession.setAttribute("enabled", false);
			local.parameters.session.endSession.setAttribute("enabled", true);
		
		//If websocket connections is active but Session is not.
		} else {
			local.parameters.session.startSession.setAttribute("enabled", true);
			local.parameters.session.endSession.setAttribute("enabled", false);
			readOnlyPlaybacksConfig(false);
		}

	//If Websocket connection is not active.
	} else {
		lastKeepAliveTime = timestamp;
		local.parameters.session.status.set(false);
		local.parameters.session.startSession.setAttribute("enabled", true);
		local.parameters.session.endSession.setAttribute("enabled", false);
		local.parameters.session.sessionID.set(0);
		readOnlyPlaybacksConfig(false);
	}
}

function requestPlaybacks(RequestIndex, RequestItemCount, RequestPage, RequestItemtype, RequestView, RequestButtonsViewMode, RequestExecButtonViewMode, RequestSessionID) {
	local.send('{"requestType":"playbacks","startIndex":[' + RequestIndex + '],"itemsCount":[' + RequestItemCount + '],"pageIndex":' + (RequestPage - 1) + ',"itemsType":[' + RequestItemtype + '],"view":' + RequestView + ',"execButtonViewMode":' + RequestExecButtonViewMode + ',"buttonsViewMode":' + RequestButtonsViewMode +',"session":' + RequestSessionID + ',"maxRequests":1}');
}

function moduleParameterChanged(param) {		

	//When Active Page get's changed and Sync to MA2 is enabled, send page change command to Active Page's value.
	if (param.is(local.parameters.playbacks.dynamic.activePage)){
		local.values.executors.activePage.page.set(local.parameters.playbacks.dynamic.activePage.get());
		if (local.parameters.playbacks.dynamic.syncToMA2.get() == true) {
			//commandChangePage(local.parameters.playbacks.dynamic.activePage.get());
			local.send('{"command":"Page ' + local.parameters.playbacks.dynamic.activePage.get() + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
		}
	
	//When this get's enabled during a active session, send the current Active Page now to ensure MA2 is getting synced up.
	} else if (param.is(local.parameters.playbacks.dynamic.syncToMA2)){
		if (local.parameters.playbacks.dynamic.syncToMA2.get() == true) {
			//commandChangePage(local.parameters.playbacks.dynamic.activePage.get());
			local.send('{"command":"Page ' + local.parameters.playbacks.dynamic.activePage.get() + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
		}
	
	//Initialise a new Session.
	} else if (param.is(local.parameters.session.startSession) && local.parameters.connected.get() == true){
		local.parameters.session.startSession.setAttribute("enabled", false);
		readOnlyPlaybacksConfig(false);
		local.values.internal.connectionsLimitReached.set(false);
		sessionStarting = true;  //This flag causes a follow up request to happen in the Websocket receiver once MA2 responds to the following initialisation request.
		local.send('{"session":0}');

	//End Session.
	} else if (param.is(local.parameters.session.endSession)){
		lastKeepAliveTime = util.getTime();
		local.values.internal.forceLogin.set(true);
		local.values.internal.connectionsLimitReached.set(false);		
		local.send('{"requestType": "close","session":' + local.parameters.session.sessionID.get() + ',"maxRequests":1}'); //Tells MA2 to end the session, log out the user and release the Session ID.
		local.parameters.session.status.set(false);
		readOnlyPlaybacksConfig(false);
		sessionStarting = false;
		local.parameters.session.sessionID.set(0);
	//End Session.
	} else if (param.is(local.parameters.advanced.unstuckCMD)){
		local.send('{"requestType":"commandConfirmationResult","result":1,"option":[],"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
	}  else if (param.is(local.parameters.advanced.validateDatablocks)){
		
		//Check each existing Executor block if it contains legacy keys and then run create function to add potentially missing enties of older or partial generated blocks.
		//For each page.
		for (var pageBlocks = 0; pageBlocks < local.values.executors.getContainers().length; pageBlocks++ ) {   
			//For each executor.
			for (var execBlocks = 0; execBlocks < local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers().length; execBlocks++ ) {    	
					
				//Does block contain colors container?
				if (typeof local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors == 'object') {
					//If yes, for each colors key.
					for (var execKeys = 0; execKeys < local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors.getControllables().length; execKeys++ ) {    	
						//Check if key is on the list of old keys that no longer are in use and remove it if true.
						if (legacyKeys.indexOf(local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors.getControllables()[execKeys].name) != -1){		
							local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].removeParameter(local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors.getControllables()[execKeys].name);
						}
					}
				}
				//For each key.
				for (var execKeys = 0; execKeys < local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].getControllables().length; execKeys++ ) {    	
					//Check if key is on the list of old keys that no longer are in use and remove it if true.
					if (legacyKeys.indexOf(local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].getControllables()[execKeys].name) != -1){		
						local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].removeParameter(local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].getControllables()[execKeys].name);
					}
				}
				//Call creation function to create possibly missing entries.
				createNewExecutor(0, local.values.executors.getContainers()[pageBlocks].name, parseInt(local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].name.replace("exec","")), local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].name);			
			}			
		}
	} else if (param.is(local.parameters.advanced.clearExecutorDatablocks)){
		util.showOkCancelBox("clearexecs", "Clear Executor Datablocks?", "Will remove all current executor datablocks from Values to be generated from scratch on next connection.", "warning", "Confirm","Abort");
	}
}


function messageBoxCallback(id, result)
{
	if (result == 1) {
		if (id == "clearexecs"){
			
			//Check for and if true end active session.
			if (local.parameters.session.status.get() == true) {
				lastKeepAliveTime = util.getTime();
				local.values.internal.forceLogin.set(true);
				local.values.internal.connectionsLimitReached.set(false);		
				local.send('{"requestType": "close","session":' + local.parameters.session.sessionID.get() + ',"maxRequests":1}'); //Tells MA2 to end the session, log out the user and release the Session ID.
				local.parameters.session.status.set(false);
				readOnlyPlaybacksConfig(false);
				sessionStarting = false;
				local.parameters.session.sessionID.set(0);
			}

			//Sequencially clear executor blocks.
			for (var pageBlocks = 0; pageBlocks < local.values.executors.getContainers().length; pageBlocks++ ) {   
				for (var execBlocks = 0; execBlocks < local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers().length; execBlocks++ ) {    		
					if (typeof local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors == 'object') {
					local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].colors.clear(true, true);
					}
						local.values.executors[local.values.executors.getContainers()[pageBlocks].name].getContainers()[execBlocks].clear(true, true);
					}
				local.values.executors[local.values.executors.getContainers()[pageBlocks].name].clear(true, true);
			}
			local.values.executors.clear(true, true);
			util.showMessageBox("ATTENTION!", "Chataigne might crash uppon re-creation of the Datablocks if the showfile has not been reloaded.\nSave your project and reload it to fix/avoid this issue.", "warning", "Got it");
		}	
	}
}

/*
function moduleValueChanged(param) {

}
*/

//Executor Commands.
function commandSetExecutorValue(useActivePage, iPage, iExec, iValue) {
	if (useActivePage == 1) {
		iPage = local.parameters.playbacks.dynamic.activePage.get();
	}
if (local.parameters.session.status.get() == true) {
		timestamp = util.getTime();	

		//Per Executor send rate limiter. (As crazy amounts of requests can lead to overload of MA2)
		limitCheckIndex = rateLimitArray.indexOf([iPage,iExec]);
		
		//Is it the first request since the last watchdog cleanup? Yes = Send immediately and create new entry in watchdog array.
		if(limitCheckIndex == -1){
			rateLimitArray.push([iPage, iExec]);
			rateLimitDataArray.push({"page": iPage,"exec": iExec, "timestamp": timestamp, "isValue": iValue, "targetValue": iValue});
			local.send('{"requestType":"playbacks_userInput","execIndex":' + (iExec - 1)  + ',"pageIndex":' + (iPage - 1) + ',"faderValue":' + iValue + ',"type":1,"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
		} else {		
			//Was the last request long enough ago?
			//(The minimum interval dynamically adjusts based on the amount of faders simultaniously send.)
	 		
			//Yes = Send and update limit tracker.
			if ((timestamp - rateLimitDataArray[limitCheckIndex].timestamp) > 0.024999 + Math.max((0.0024 * rateLimitArray.length), 0.0)) {
				rateLimitDataArray[limitCheckIndex].timestamp = timestamp;
				rateLimitDataArray[limitCheckIndex].isValue = iValue;
				rateLimitDataArray[limitCheckIndex].targetValue = iValue;
				local.send('{"requestType":"playbacks_userInput","execIndex":' + (iExec - 1)  + ',"pageIndex":' + (iPage - 1) + ',"faderValue":' + iValue + ',"type":1,"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
			
			//No = Too fast re-trigger, do not send and only update limit tracker entry with the last requested send value.
			} else {
				rateLimitDataArray[limitCheckIndex].targetValue = iValue;
			}
		}
	}
}
function commandSendExecutorButtons(useActivePage, iPage, iExec, iButton, iState) {
	if (useActivePage == 1) {
		iPage = local.parameters.playbacks.dynamic.activePage.get();
	}
if (local.parameters.session.status.get() == true) {
		local.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + (iExec - 1) +',"pageIndex":' + (iPage - 1) +',"buttonId":' + iButton +',"pressed":' + iState +',"released":' + !iState +',"type":0,"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
	}
}
function commandSetLabel(useActivePage, iPage, iExec, labelToSet) {
	if (useActivePage == 1) {
		iPage = local.parameters.playbacks.dynamic.activePage.get();
	}
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Label Exec ' + iPage +'.'+ iExec + ' "' + labelToSet + '"","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}
function commandSetColor(useActivePage, iPage, iExec, colorToSet) {
	if (useActivePage == 1) {
		iPage = local.parameters.playbacks.dynamic.activePage.get();
	}
	if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Appearance Exec ' + iPage +'.'+ iExec + ' /r=' + parseInt(colorToSet[0] * 100) + ' /g=' + parseInt(colorToSet[1] * 100) + ' /b=' + parseInt(colorToSet[2] * 100) + '","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}

//Console commands.
function commandSendCMD(cmdToSend) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"' + cmdToSend + '","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}

function commandChangePage(isRelative, pageToChangeTo, relativAction, syncActivePage) {
	if (local.parameters.session.status.get() == true) {

			
			if (syncActivePage == true) {
				if (isRelative == true) {
					local.parameters.playbacks.dynamic.activePage.set(local.parameters.playbacks.dynamic.activePage.get() + parseInt(relativAction));
				} else {
					local.parameters.playbacks.dynamic.activePage.set(pageToChangeTo);
				}
					
				if (local.parameters.playbacks.dynamic.syncToMA2.get() == false) {
					if (isRelative == true) {
							local.send('{"command":"Page ' + relativAction + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
					} else {
						local.send('{"command":"Page ' + pageToChangeTo + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
					}				
				}
			} else {
				if (isRelative == true) {
						local.send('{"command":"Page ' + relativAction + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
				} else {
					local.send('{"command":"Page ' + pageToChangeTo + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
				}
			}
	}
}

function commandSendHardKey(hardKeyToSend, pressedState, holdState) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"LUA \'gma.canbus.hardkey (' + hardKeyToSend + ', ' + intToBoolString(pressedState) + ', ' + intToBoolString(holdState) + ')\'","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}

//Encoder commands.
function commandSendEncoderByWheel(encoderID, stepAmount) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Feature $feature.' + encoderID + ' At +  ' + stepAmount + '","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}

function commandSendEncoderByAttribute(encoderAttribute, stepAmount) {
if (local.parameters.session.status.get() == true) {
		local.send('{"requestType":"encoder","name":"' + encoderAttribute + '","value":' + stepAmount + ',"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
	}
}

function commandSetPGMRGBColor(colorToSet) {
	if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Attribute COLORRGB1 At ' + parseInt(colorToSet[0] * 100) + ' ; Attribute COLORRGB2 At ' + parseInt(colorToSet[1] * 100) + ' ; Attribute COLORRGB3 At ' + parseInt(colorToSet[2] * 100) + '","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}

function intToBoolString (inputInt) {
	if (inputInt == 1) {
		return "true";
	} else {
		return "false";
	}
}


//Websocket receiver and parser.
function wsMessageReceived(message) {
	var JSONMessageObject = JSON.parse(message);
	timestamp = util.getTime();	
	iPage = JSONMessageObject.iPage;
	iPageString = 'page' + iPage;	
	//Get responseType and proceed accordingly.
	if (JSONMessageObject.responseType === 'playbacks') {										

		//Executor Type 2 (1-90) or Type 3 (101 - 190)
		if ((JSONMessageObject.responseSubType == 2) || (JSONMessageObject.responseSubType == 3)) {

			//Loop trough all ITEMGROUPS (Each array entry in the playback request comes as a itemGroup)
			for (var itemGroupsArray = 0; itemGroupsArray < JSONMessageObject.itemGroups.length; itemGroupsArray++) {
				//ITEMS (Each items array contains a max of 5 items then a new is created for the next 5)
				for (var itemsArray = 0; itemsArray < JSONMessageObject.itemGroups[itemGroupsArray].items.length; itemsArray++) {
					//ITEMSSUBARRAY (The actual individual data elements)
					for (var itemsSubArray = 0; itemsSubArray < JSONMessageObject.itemGroups[itemGroupsArray].items[0].length; itemsSubArray++) {
						
						//Saving you and my self from gray hair by defining some reappearing parts to make the parsing section even remotely readable.
						//Like, seriously, this is updating a executor label element fully broken down: local.values.executors['page' + JSONMessageObject.iPage]['exec' + JSONMessageObject.itemGroups[itemGroupsArray].items[itemsArray][itemsSubArray].iExec + 1].label.set(JSONMessageObject.itemGroups[itemGroupsArray].items[itemsArray][itemsSubArray].tt.t);
						iObject = JSONMessageObject.itemGroups[itemGroupsArray].items[itemsArray][itemsSubArray];
						iExec = (iObject.iExec + 1);
						iExecString = 'exec' + iExec;

						//Check if received page matches the current Active Page, and if executor is part of the Dynamic lookup table
						//If both checks succeed, call parse function for Active Page and current iExec.
						if ((iPage == (local.parameters.playbacks.dynamic.activePage.get())) && (dynamicExecList.indexOf(iExecString) != -1)){							
							parseItemData(iPage, 'activePage', iExec, iExecString, iObject);
						}

						//Check if received page & executor is part of the Static lookup table, and call parse function with passed trough data, if true.
						if (staticExecList.indexOf(iPageString + iExecString) != -1) {
							parseItemData(iPage, iPageString, iExec, iExecString, iObject);
						}
					}
				}
			}
		}

	//If response type is not playbacks.
	} else {

		//If responsonding to us asking for the command log.
		if (JSONMessageObject.responseType === 'commandHistory') {	
		
		//If responding to us asking to authenticate us for the provided Session ID.
		} else if (JSONMessageObject.responseType === 'login') {	
			local.values.internal.result.set(JSONMessageObject.result);
			local.values.internal.realtime.set(JSONMessageObject.realtime);
			local.values.internal.prompt.set(JSONMessageObject.prompt);
			local.values.internal.promptcolor.set(parseInt('0xff' + JSONMessageObject.promptcolor.substring(1,7)));
			
			//If Login was successful.
			if (JSONMessageObject.result == true) {	
				local.parameters.session.startSession.setAttribute("enabled", false);
				local.parameters.session.endSession.setAttribute("enabled", true);
				readOnlyPlaybacksConfig(true);
				local.values.internal.forceLogin.set(false);
				local.parameters.session.status.set(true);				
				local.values.internal.connectionsLimitReached.set(false);
			
			//Login was not successful.
			} else {
				local.values.internal.forceLogin.set(true);
				local.parameters.session.status.set(false);
				readOnlyPlaybacksConfig(false);
				local.parameters.session.startSession.setAttribute("enabled", true);
				local.parameters.session.endSession.setAttribute("enabled", false);
			}

		// If intitial WebSocket connection response
		} else if (JSONMessageObject.status == 'server ready') {
			// Store Values
			local.values.internal.appType.set(JSONMessageObject.appType);
			// Considered storing status, but then it'd show persistently even when WebSocket connection is later closed.
			// local.values.internal.status.set(JSONMessageObject.status);

			if (JSONMessageObject.appType == 'dot2') {
			// Set & lock username field to dot2 pre-set username for dot2, as dot2's Web Remote does not support multiple user logins and will only accept the username "remote" for a successful login.
			local.parameters.session.credentials.ma2User.set('remote');
			local.parameters.session.credentials.ma2User.setAttribute("enabled", false);

			if (local.parameters.session.credentials.password_MD5_.get() == '(to be initialized on WebSocket connection)') {
				// dot2 default password is 'remote': https://help.malighting.com/dot2/en/help/key_ht_use_web_remote.html
				local.parameters.session.credentials.password_MD5_.set('2c18e486683a3db1e645ad8523223b72');				
			}
			} else {
				// If not dot2, unlock username field in Chataigne GUI
				local.parameters.session.credentials.ma2User.setAttribute("enabled", true);
				if (local.parameters.session.credentials.password_MD5_.get() == '(to be initialized on WebSocket connection)') {
					// Set default password to 'chataigne'
					local.parameters.session.credentials.password_MD5_.set('e31b120e31610e45bcc5d7e1e5d00290');
				}
			}
		}
	
		//Generic data.
		local.parameters.session.sessionID.set(JSONMessageObject.session);
		local.values.internal.forceLogin.set(JSONMessageObject.forceLogin);	
		if (JSONMessageObject.forceLogin == true) {
			local.parameters.session.status.set(false);
		}

		//This key get's send when too many sessions are being created. According to MA2's knowledgebase the max simultanious Web Remotes is 3.
		if (typeof JSONMessageObject.connections_limit_reached == 'string') {
			local.parameters.session.status.set(false);
			local.values.internal.connectionsLimitReached.set(true);
		}
		local.values.internal.worldIndex.set(JSONMessageObject.worldIndex);

		//This flag get's set by the Start Session trigger and if true follows up to MA responding with our assigned Session ID, by sending the login request for it.
		if (sessionStarting === true) {
			sessionStarting = false;
			if(local.values.internal.connectionsLimitReached.get() != true){
				readOnlyPlaybacksConfig(true);
				local.values.internal.connectionsLimitReached.set(false);
				buildRequestArrays(false);
				local.send('{"requestType": "login","username":"' + local.parameters.session.credentials.ma2User.get() +'","password":"' + local.parameters.session.credentials.password_MD5_.get() +'","session":' + local.parameters.session.sessionID.get() + ',"maxRequests":1}');
			}
		}
	}
	readyToParse = true;
}

//This is the function that parses and updates the datablocks.
function parseItemData(iPage, iPageString, iExec, iExecString, iObject) {
	//For each datablock. (1 Is Normal. up to 5 for multi width executors. For multiple exetuors, the button data is rendered into the next executors element which it occupies within MA as well.)
	for (var execBlocks = 0; execBlocks < iObject.executorBlocks.length; execBlocks++) {
		iExecString = 'exec' + parseInt(iExec + execBlocks);
		eObject = local.values.executors[iPageString][iExecString];

		if (execBlocks == 0) {			
			eObject.width.set(iObject.executorBlocks.length);
		} else {
			eObject.width.set(0);
		}

		//Check if a datablock for the received executor already exists, otherwise request it's creation.
		if (typeof local.values.executors[iPageString][iExecString] != 'object') {
			createNewExecutor(iPage, iPageString, parseInt(iExec + execBlocks) + execBlocks, iExecString);
		}


		//Parse and update executor datablock.
		eObject.label.set(iObject.tt.t);
		eObject.isActive.set(iObject.isRun);
		if (iObject.bC == '#00FF00') {
		eObject.isSelected.set(true);
		} else {
			eObject.isSelected.set(false);
		}

		eObject.id.set(iObject.i.t);
		eObject.type.set(iObject.oType.t);
		eObject.sequence.set(iObject.oI.t);

		eObject.colors.execColor.set(parseInt(('0xff' + iObject.bdC)));
		eObject.colors.idTextColor.set(parseInt('0xff' + iObject.i.c));
		eObject.colors.typeTextColor.set(parseInt('0xff' + iObject.oType.c));
		eObject.colors.sequenceTextColor.set(parseInt('0xff' + iObject.oI.c));
		eObject.colors.labelTextColor.set(parseInt('0xff' + iObject.tt.c));

		eObject.buttonText.set(iObject.executorBlocks[execBlocks].button1.t);
		eObject.colors.buttonTextColor.set(parseInt('0xff' +iObject.executorBlocks[execBlocks].button1.c));

		//Check if executor is not empty.
		if (iObject.executorBlocks[execBlocks].button1.t != "Empty") {
		//Parse cue block. Single Cue or Prev/Current/Next debending on what is stored on the Executor.
		eObject.colors.cueBackgroundColor.set(parseInt(('0xff' + iObject.cues.bC)));
		if (iObject.cues.items.length < 3){
			if (typeof iObject.cues.items[0].t != 'string') {
				eObject.currentCue.set('');
			} else {
				eObject.currentCue.set(iObject.cues.items[0].t);
			}

			if (typeof iObject.cues.items[0].pgs.v == 'undefined') {
				eObject.currentProgress.set(0.0);
			} else {
				eObject.currentProgress.set(iObject.cues.items[0].pgs.v);
			}
			
			eObject.previousCue.set('');
			eObject.previousProgress.set(0.0);
			eObject.colors.previousProgressBarColor.set(0xFF0000FF);
			eObject.nextCue.set('');
			eObject.nextProgress.set(0.0);
			eObject.colors.nextProgressBarColor.set(0xff0000FF);

		} else {
			if (typeof iObject.cues.items[0].t != 'string') {
				eObject.previousCue.set('');
				eObject.colors.previousTextColor.set(0xFFFFFFFF); 
			} else {
				eObject.previousCue.set(iObject.cues.items[0].t);
				eObject.colors.previousTextColor.set(parseInt('0xff' + iObject.cues.items[0].c)); 
			}
			if (typeof iObject.cues.items[1].t != 'string') {
				eObject.currentCue.set('');
				eObject.colors.currentTextColor.set(0xFFFFFFFF); 		
			} else {
				eObject.currentCue.set(iObject.cues.items[1].t);
				eObject.colors.currentTextColor.set(parseInt('0xff' + iObject.cues.items[1].c)); 		

			}
			if (typeof iObject.cues.items[2].t != 'string') {
				eObject.nextCue.set('');
				eObject.colors.nextTextColor.set(0xFFFFFFFF); 	
			} else {
				eObject.nextCue.set(iObject.cues.items[2].t);
				eObject.colors.nextTextColor.set(parseInt('0xff' + iObject.cues.items[2].c)); 	
			}

			if (typeof iObject.cues.items[0].pgs.v == 'undefined') {
				eObject.previousProgress.set(0.0);
				eObject.colors.previousProgressBarColor.set(0xFF0000FF);
			} else {
				eObject.previousProgress.set(iObject.cues.items[0].pgs.v);
				eObject.colors.previousProgressBarColor.set(parseInt('0xff' + iObject.cues.items[0].pgs.bC)); 
			}

			if (typeof iObject.cues.items[1].pgs.v == 'undefined') {
				eObject.currentProgress.set(0.0);
				eObject.colors.currentProgressBarColor.set(0xff0000FF);
			} else {
				eObject.currentProgress.set(iObject.cues.items[1].pgs.v);
				eObject.colors.currentProgressBarColor.set(parseInt('0xff' + iObject.cues.items[1].pgs.bC));
			}

			if (typeof iObject.cues.items[2].pgs.v == 'undefined') {
				eObject.nextProgress.set(0.0);
				eObject.colors.nextProgressBarColor.set(0xff0000FF);
			} else {
				eObject.nextProgress.set(iObject.cues.items[2].pgs.v);
				eObject.colors.nextProgressBarColor.set(parseInt('0xff' + iObject.cues.items[2].pgs.bC));
			}
		}

		//If executor is empty, clear out data blocks that would otherwise parse incorrectly.
		} else {
			eObject.colors.cueBackgroundColor.set(0xff1A1A1A);
			eObject.previousCue.set('');
			eObject.currentCue.set('');
			eObject.nextCue.set('');
			eObject.previousProgress.set(0.0);
			eObject.currentProgress.set(0.0);
			eObject.nextProgress.set(0.0);
			eObject.width.set(1);
			eObject.colors.typeTextColor.set(0xFFFFFFFF);
			eObject.colors.sequenceTextColor.set(0xFFFFFFFF);
			eObject.colors.labelTextColor.set(0xFFFFFFFF);
		}
						
		//Type 2 extra data (Faders)
		if (JSONMessageObject.responseSubType == 2) {
			eObject.lowerText.set(iObject.executorBlocks[execBlocks].button2.t);
			eObject.upperText.set(iObject.executorBlocks[execBlocks].button3.t);
			eObject.faderText.set(iObject.executorBlocks[execBlocks].fader.tt);	
			eObject.faderValue.set(iObject.executorBlocks[execBlocks].fader.v);	
			eObject.faderValueText.set(iObject.executorBlocks[execBlocks].fader.vT);

			eObject.colors.lowerTextColor.set(parseInt('0xff' +iObject.executorBlocks[execBlocks].button2.c));
			eObject.colors.upperTextColor.set(parseInt('0xff' +iObject.executorBlocks[execBlocks].button3.c));
			//eObject.colors.faderTextColor.set(iObject.executorBlocks[execBlocks].fader.c);			
		}
	}
}

//Called when no datablock for a received page + exec combination exists to create a new datablock for it.
function createNewExecutor(iPage, iPageString, iExec, iExecString) {
	
	//Does the target page already exist? If not, create one.
	if (typeof local.values.executors[iPageString] != 'object') {
		local.values.executors.addContainer('Page' + iPage);
		local.values.executors[iPageString].pageid = parseInt(iPage);
		local.values.executors[iPageString].setCollapsed(true);
	}

	//Does the executor already exist? If not, create one. Theoretically this should always be the case, as nothing should call this function if this wasn't missing.
	if (typeof local.values.executors[iPageString][iExecString] != 'object') {
		local.values.executors[iPageString].addContainer('Exec' + iExec);
		local.values.executors[iPageString][iExecString].pageid = parseInt(iPage);
		local.values.executors[iPageString][iExecString].execid = parseInt(iExec);
		//createNewExecParameter('Int', iPageString, iExecString, "execID", "Exec ID","ID of the Executor", parseInt(iExec));
		local.values.executors[iPageString][iExecString].setCollapsed(true);
	}

		if (typeof local.values.executors[iPageString][iExecString].colors != 'object') {
		local.values.executors[iPageString][iExecString].addContainer('Colors');
		local.values.executors[iPageString][iExecString].colors.setCollapsed(true);
	}

	//Common data fields for either type.		
   	createNewExecParameter('Int', iPageString, iExecString, "width",  "Width","Cue Width of Executor. Is 0 if child of earlier executor.", 0);
   	createNewExecParameter('Bool', iPageString, iExecString, "isActive",  "Is Active", "State of the Executor", false);
   	createNewExecParameter('Bool', iPageString, iExecString, "isSelected",  "Is Selected","Selectection state of the Executor", false);
	
	createNewExecParameter('String', iPageString, iExecString, "id", "ID","ID of the Executor", "");
	createNewExecParameter('String', iPageString, iExecString, "type", "Type","Type of the Executor", "");
	createNewExecParameter('String', iPageString, iExecString, "sequence", "Sequence","Assigned Sequence", "");
	createNewExecParameter('String', iPageString, iExecString, "label", "Label","Label of the Executor", "");

   	createNewExecParameter('String', iPageString, iExecString, "previousCue",  "Previous Cue", "Previous Cue","");
   	createNewExecParameter('Float', iPageString, iExecString, "previousProgress",  "Previous Progress","Cue Progress",0,0,1);
   	createNewExecParameter('String', iPageString, iExecString, "currentCue",  "Current Cue", "Current Cue","");
   	createNewExecParameter('Float', iPageString, iExecString, "currentProgress",  "Current Progress","Cue Progress",0,0,1);
   	createNewExecParameter('String', iPageString, iExecString, "nextCue",  "Next Cue", "Previous Cue","");
   	createNewExecParameter('Float', iPageString, iExecString, "nextProgress",  "Next Progress","Cue Progress",0,0,1);

	//Color Block
	createNewExecParameter('Color', iPageString, iExecString, "execColor",  "Exec Color", "Color of the Executor", 0x303030ff);
    createNewExecParameter('Color', iPageString, iExecString, "cueBackgroundColor",  "Cue Background Color", "Cue Background Color of the Executor", 0x303030ff);
    createNewExecParameter('Color', iPageString, iExecString, "idTextColor",  "ID Text Color", "ID text color of the Executor", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "typeTextColor",  "Type Text Color", "Type Text color of the Executor", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "sequenceTextColor",  "Sequence Text Color", "Sequence text color of the Executor", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "labelTextColor",  "Label Text Color", "Text Color", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "previousTextColor",  "Previous Text Color", "Text Color", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "previousProgressBarColor",  "Previous Progress Bar Color", "Progress Bar Color", 0x0000FFFF);
    createNewExecParameter('Color', iPageString, iExecString, "currentTextColor",  "Current Text Color", "Text Color", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "currentProgressBarColor",  "Current Progress Bar Color", "Text Color", 0x0000FFFF);
    createNewExecParameter('Color', iPageString, iExecString, "nextTextColor",  "Next Text Color", "Text Color", 0xffffffff);
    createNewExecParameter('Color', iPageString, iExecString, "nextProgressBarColor",  "Next Progress Bar Color", "Text Color", 0x0000FFFF);

	//1 - 90 = Type 2 (Faders) | 101 - 190 = Type 3 (Buttons)
	if (iExec < 100) {
    	createNewExecParameter('String', iPageString, iExecString, "upperText",  "Upper Text","Function of Executor Upper Button","");
   		createNewExecParameter('String', iPageString, iExecString, "lowerText",  "Lower Text","Function of Executor Lower Button","");
	    createNewExecParameter('String', iPageString, iExecString, "buttonText",  "Button Text","Function of Executor Button","");
	    createNewExecParameter('String', iPageString, iExecString, "faderText",  "Fader Text","Executor Fader Text","");
    	createNewExecParameter('Float', iPageString, iExecString, "faderValue",  "Fader Value","Value of Executor Fader",0,0,1);
   		createNewExecParameter('String', iPageString, iExecString, "faderValueText",  "Fader Value Text","Fader Text of Executor","");
		
		//Color Block
	    createNewExecParameter('Color', iPageString, iExecString, "upperTextColor",  "Upper Text Color", "Text Color", 0xffffffff);
    	createNewExecParameter('Color', iPageString, iExecString, "lowerTextColor",  "Lower Text Color", "Text Color", 0xffffffff);
    	createNewExecParameter('Color', iPageString, iExecString, "buttonTextColor",  "Button Text Color", "Text Color", 0xffffffff);
   		createNewExecParameter('Color', iPageString, iExecString, "faderTextColor",  "Fader Text Color", "Text Color", 0xffffffff);
	} else {
	    createNewExecParameter('String', iPageString, iExecString, "buttonText",  "Button Text","Function of Executor Button","");
		
		//Color Block
    	createNewExecParameter('Color', iPageString, iExecString, "buttonTextColor",  "Button Text Color", "Text Color", 0xffffffff);
	}
}

//Create the requested Chatainge parameter by type and set some attributes.
function createNewExecParameter(iType, iPageString, iExecString, iKeyName, iKey, iDescription, iDefault, iDefault2, iDefault3) {
	if (typeof local.values.executors[iPageString][iExecString][iKey] == 'undefined') {
		if (iType ==='String') {
			local.values.executors[iPageString][iExecString].addStringParameter(iKey, iDescription, iDefault);
		} else if (iType ==='Int') {
			local.values.executors[iPageString][iExecString].addIntParameter(iKey,iDescription, iDefault);
		} else if (iType ==='Bool') {
			local.values.executors[iPageString][iExecString].addBoolParameter(iKey, iDescription, iDefault);
		} else if (iType ==='Float') {
			local.values.executors[iPageString][iExecString].addFloatParameter(iKey,iDescription, iDefault, iDefault2, iDefault3);
		} else if (iType ==='Color') {
			local.values.executors[iPageString][iExecString].colors.addColorParameter(iKey,iDescription, iDefault);
		}
		if (iType ==='Color') {
			local.values.executors[iPageString][iExecString].colors[iKeyName].setAttribute("readonly",true);
			//Ensures the data structure is maintained when loading a saved showfile in Chataigne again.
			local.values.executors[iPageString][iExecString].colors[iKeyName].setAttribute("saveValueOnly",false);
		} else {
			local.values.executors[iPageString][iExecString][iKeyName].setAttribute("readonly",true);
			//Ensures the data structure is maintained when loading a saved showfile in Chataigne again.
			local.values.executors[iPageString][iExecString][iKeyName].setAttribute("saveValueOnly",false);
		}
	}
	if (typeof local.values.internal.dataVersions[codeVersion + ''] == 'undefined') {
		local.values.internal.dataVersions.addContainer(codeVersion + '');
		local.values.internal.dataVersions[codeVersion + ''].setCollapsed(true);
	}
}