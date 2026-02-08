//	############################################
//	**** grandMA2 Chataigne Module by FPaul ****
//	############################################

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

function init() {	
	readOnlyPlaybacksConfig(false);
	script.setUpdateRate(50);
	//local.parameters.session.status.set(false);
	//local.values.internal.forceLogin.set(true);
	//local.parameters.session.sessionID.set(0);
	local.parameters.session.startSession.setAttribute("enabled", true);
	local.parameters.session.endSession.setAttribute("enabled", false);
	local.values.internal.connetionsLimitReached.set(false);
	util.delayThreadMS(100);
	buildRequestArrays();
}

function buildRequestArrays() {
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
						commandSetExecutorValue(rateLimitArray[rateLimitIndex][1], rateLimitArray[rateLimitIndex][0], rateLimitDataArray[rateLimitIndex].targetValue);
					
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
				if ((timestamp - DFTimestamp) >= local.parameters.playbacks.dynamic.faderIntervall.get()) {
					if ((playbackStartOffset < 2) && (playbackRequestArray[0][0].length > 0)) {
						DFTimestamp = timestamp;
						requestPlaybacks(playbackRequestArray[0][0].join(','), playbackRequestArray[0][1].join(','), local.parameters.playbacks.dynamic.activePage.get(), playbackRequestArray[0][2].join(','), 2, 1, 0, local.parameters.session.sessionID.get());	
					}
				}
				//Dynamic Buttons.
				if ((timestamp - DBTimestamp) >= local.parameters.playbacks.dynamic.buttonIntervall.get()) {
					if ((playbackStartOffset < 2) && (playbackRequestArray[1][0].length > 0)) {
						DBTimestamp = timestamp;			
						requestPlaybacks(playbackRequestArray[1][0].join(','), playbackRequestArray[1][1].join(','), local.parameters.playbacks.dynamic.activePage.get(), playbackRequestArray[1][2].join(','), 3, 1, 0, local.parameters.session.sessionID.get());		
					}
				}

				//Static Faders.
				if ((timestamp - SFTimestamp) >= local.parameters.playbacks.static.faderIntervall.get()) {
					if ((playbackStartOffset < 6) && (playbackRequestArray[2][0].length > 0)) {
						SFTimestamp = timestamp;
						for (var tempSplitIndex = 0; tempSplitIndex < playbackRequestArray[2].length; tempSplitIndex++ ) { 
							requestPlaybacks(playbackRequestArray[2][tempSplitIndex][0].join(','), playbackRequestArray[2][tempSplitIndex][1].join(','), playbackRequestArray[2][tempSplitIndex][3], playbackRequestArray[2][tempSplitIndex][2].join(','), 2, 1, 0, local.parameters.session.sessionID.get());	
						}
					}
				}

				//Static Buttons.
				if ((timestamp - SBTimestamp) >= local.parameters.playbacks.static.buttonIntervall.get()) {
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
			commandChangePage(local.parameters.playbacks.dynamic.activePage.get());
		}
	
	//When this get's enabled during a active session, send the current Active Page now to ensure MA2 is getting synced up.
	} else if (param.is(local.parameters.playbacks.dynamic.syncToMA2)){
		if (local.parameters.playbacks.dynamic.syncToMA2.get() == true) {
			commandChangePage(local.parameters.playbacks.dynamic.activePage.get());
		}
	
	//Initialise a new Session.
	} else if (param.is(local.parameters.session.startSession) && local.parameters.connected.get() == true){
		local.parameters.session.startSession.setAttribute("enabled", false);
		readOnlyPlaybacksConfig(false);
		local.values.internal.connetionsLimitReached.set(false);
		sessionStarting = true;  //This flag causes a follow up request to happen in the Websocket receiver once MA2 responds to the following initialisation request.
		local.send('{"session":0}');

	//End Session.
	} else if (param.is(local.parameters.session.endSession)){
		lastKeepAliveTime = util.getTime();
		local.values.internal.forceLogin.set(true);
		local.values.internal.connetionsLimitReached.set(false);		
		local.send('{"requestType": "close","session":' + local.parameters.session.sessionID.get() + ',"maxRequests":1}'); //Tells MA2 to end the session, log out the user and release the Session ID.
		local.parameters.session.status.set(false);
		readOnlyPlaybacksConfig(false);
		sessionStarting = false;
		local.parameters.session.sessionID.set(0);
	} 
}

/*
function moduleValueChanged(param) {

}
*/

//Executor Commands
function commandSetExecutorValue(iExec, iPage, iValue) {
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

			//Yes = Send and update limit tracker.
			//The minimum intervall dynamically adjusts based on the amount of faders simultaniously send.
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
function commandSendExecutorButtons(iExec, iPage, iButton, iState) {
if (local.parameters.session.status.get() == true) {
		local.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + (iExec - 1) +',"pageIndex":' + (iPage - 1) +',"buttonId":' + iButton +',"pressed":' + iState +',"released":' + !iState +',"type":0,"session":' + local.parameters.session.sessionID.get() + ',"maxRequests":0}');
	}
}
function commandSetLabel(iExec, iPage, labelToSet) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Label Exec ' + iPage +'.'+ iExec + ' "' + labelToSet + '" Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}
function commandSetColor(iExec, iPage, colorToSet) {
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

function commandChangePage(pageToChangeTo) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"Page ' + pageToChangeTo + ' Please","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
	}
}
function commandSendHardKey(hardKeyToSend) {
if (local.parameters.session.status.get() == true) {
		local.send('{"command":"LUA \'gma.canbus.hardkey (' + hardKeyToSend + ', true, false)\'","session":' + local.parameters.session.sessionID.get() + ',"requestType":"command","maxRequests":0}');
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

	//If reposone type is not playbacks.
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
				local.values.internal.connetionsLimitReached.set(false);
			
			//Login was not successful.
			} else {
				local.values.internal.forceLogin.set(true);
				local.parameters.session.status.set(false);
				readOnlyPlaybacksConfig(false);
				local.parameters.session.startSession.setAttribute("enabled", true);
				local.parameters.session.endSession.setAttribute("enabled", false);
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
			local.values.internal.connetionsLimitReached.set(true);
		}
		local.values.internal.worldIndex.set(JSONMessageObject.worldIndex);

		//This flag get's set by the Start Session trigger and if true follows up to MA responding with our assigned Session ID, by sending the login request for it.
		if (sessionStarting === true) {
			sessionStarting = false;
			if(local.values.internal.connetionsLimitReached.get() != true){
				readOnlyPlaybacksConfig(true);
				local.values.internal.connetionsLimitReached.set(false);
				buildRequestArrays();
				local.send('{"requestType": "login","username":"' + local.parameters.session.credentials.ma2User.get() +'","password":"' + local.parameters.session.credentials.password_MD5_.get() +'","session":' + local.parameters.session.sessionID.get() + ',"maxRequests":1}');
			}
		}
	}
}

//This is the function that parses and updates the datablocks.
function parseItemData(iPage, iPageString, iExec, iExecString, iObject) {
	//Check if a datablock for the received executor already exists, otherwise request it's creation.
	if (typeof local.values.executors[iPageString][iExecString] != 'object') {
		createNewExecutor(iPage, iPageString, iExec, iExecString);
	}
	eObject = local.values.executors[iPageString][iExecString];

	//Parse and update executor datablock.
	eObject.label.set(iObject.tt.t);
	eObject.isActive.set(iObject.isRun);
	eObject.color.set(parseInt('0xff' + iObject.bdC.substring(1,7)));
	eObject.buttonText.set(iObject.executorBlocks[0].button1.t);

	//Parse cue block. Single Cue or Prev/Current/Next debending on what is stored on the Executor.
	if (iObject.cues.items.length < 3){
		eObject.previousCue.set('');
		eObject.currentCue.set(iObject.cues.items[0].t);
		eObject.nextCue.set('');
	} else {
		eObject.previousCue.set(iObject.cues.items[0].t);
		if (typeof iObject.cues.items[1].t != 'string') {
			eObject.currentCue.set('');
		} else {
			eObject.currentCue.set(iObject.cues.items[1].t);
		}
		eObject.nextCue.set(iObject.cues.items[2].t);
	}
						
	//Type 2 extra data (Faders)
	if (JSONMessageObject.responseSubType == 2) {
		eObject.lowerText.set(iObject.executorBlocks[0].button2.t);
		eObject.upperText.set(iObject.executorBlocks[0].button3.t);
		eObject.faderText.set(iObject.executorBlocks[0].fader.tt);	
		eObject.faderValue.set(iObject.executorBlocks[0].fader.v);	
		eObject.faderValueText.set(iObject.executorBlocks[0].fader.vT);
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
		local.values.executors[iPageString][iExecString].setCollapsed(true);
	}

	//Common data fields for either type.
	createNewExecParameter('String', iPageString, iExecString, "label", "Label","Label of Executor", "empty");
   	createNewExecParameter('Bool', iPageString, iExecString, "isActive",  "Is Active","State of Executor", false);
    createNewExecParameter('Color', iPageString, iExecString, "color",  "Color","Color of Executor", 0x303030ff);
   	createNewExecParameter('String', iPageString, iExecString, "previousCue",  "Previous Cue","Previous Cue","");
   	createNewExecParameter('String', iPageString, iExecString, "currentCue",  "Current Cue","Current Cue","");
   	createNewExecParameter('String', iPageString, iExecString, "nextCue",  "Next Cue","Previous Cue","");

	//1 - 90 = Type 2 (Faders) | 101 - 190 = Type 3 (Buttons)
	if (iExec < 100) {
    	createNewExecParameter('String', iPageString, iExecString, "upperText",  "Upper Text","State of Executor Upper Button","");
   		createNewExecParameter('String', iPageString, iExecString, "lowerText",  "Lower Text","State of Executor Lower Button","");
	    createNewExecParameter('String', iPageString, iExecString, "buttonText",  "Button Text","State of Executor Button","");
	    createNewExecParameter('String', iPageString, iExecString, "faderText",  "Fader Text","Executor Fader Text","");
    	createNewExecParameter('Float', iPageString, iExecString, "faderValue",  "Fader Value","Value of Executor Fader",0,0,1);
   		createNewExecParameter('String', iPageString, iExecString, "faderValueText",  "Fader Value Text","Fader Text of Executor","");
	} else {
	    createNewExecParameter('String', iPageString, iExecString, "buttonText",  "Button Text","State of Executor Button","");
	}
}

//Create the requested Chatainge parameter by type and set some attributes.
function createNewExecParameter(iType, iPageString, iExecString, iKeyName, iKey, iDescription, iDefault, iDefault2, iDefault3) {
	if (iType ==='String') {
		local.values.executors[iPageString][iExecString].addStringParameter(iKey, iDescription, iDefault);
	} else if (iType ==='Int') {
		local.values.executors[iPageString][iExecString].addIntParameter(iKey,iDescription, iDefault);
	} else if (iType ==='Bool') {
		local.values.executors[iPageString][iExecString].addBoolParameter(iKey, iDescription, iDefault);
	} else if (iType ==='Float') {
		local.values.executors[iPageString][iExecString].addFloatParameter(iKey,iDescription, iDefault, iDefault2, iDefault3);
	} else if (iType ==='Color') {
		local.values.executors[iPageString][iExecString].addColorParameter(iKey,iDescription, iDefault);
	}
	local.values.executors[iPageString][iExecString][iKeyName].setAttribute("readonly",true);
	local.values.executors[iPageString][iExecString][iKeyName].setAttribute("alwaysNotify", false);

	//Ensures the data structure is maintained when loading a saved showfile in Chataigne again.
	local.values.executors[iPageString][iExecString][iKeyName].setAttribute("saveValueOnly",false);
}