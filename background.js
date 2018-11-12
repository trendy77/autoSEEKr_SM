let curWindowId = 0;
let curTabId = 0;
let fieldsObj = {};
let theTitles = ["Job Title", "Employer", "Contact", "USP1", "USP2", "USP3"];
//let edited = 0;
//let fields = new Array();
//let progress = 0;
let curUrl = "";
let curId = 0;

let searches = [];
let theJobs = [];

let SCRIPT_ID = "MNiU5rCPbRI5oHLgJYy_hNZgEv2YCqn3J"; // Apps Script script id
let STATE_START = 1;
let STATE_ACQUIRING_AUTHTOKEN = 2;
let STATE_AUTHTOKEN_ACQUIRED = 3;
let state = STATE_START;

function getId(url) {
	let searchfor = "seek.com.au/job/"; // 16 chars
	let searchesfor = "seek.com.au/jobs";
	if (url.indexOf(searchfor) != -1) {
		let idStartIndex = 16 + url.indexOf(searchfor);
		curId = url.substr(idStartIndex, 8);
		console.log("id is :" + curId);
		return curId;
	} else if (url.indexOf(searchesfor) != -1) {
		curId = "search";
		console.log("id is :" + curId);
		return curId;
	} else {
		console.log("error- not a seek site" + url);
	}
}
function JobApp(jobId) {
	let now = Date.now();
	this.created = now;
	this.edited = now;
	this.views = 1;
	this.id = jobId;
	this.fields = ["", "", "", "", "", ""];
	this.titles = theTitles;
	this.progress = 0;
}
function changeState(newState) {
	state = newState;

	switch (state) {
		case STATE_START:
			chrome.contextMenus.update("Sign-In", { visible: true });
			chrome.contextMenus.update("Send2Sheet", { visible: false });
			chrome.contextMenus.update("Go2Sheet", { visible: false });
			chrome.contextMenus.update("RevokeToken", { visible: false });
			break;
		case STATE_ACQUIRING_AUTHTOKEN:
			break;
		case STATE_AUTHTOKEN_ACQUIRED:
			chrome.contextMenus.update("Send2Sheet", { visible: true });
			chrome.contextMenus.update("Go2Sheet", { visible: true });
			chrome.contextMenus.update("RevokeToken", { visible: true });
			chrome.contextMenus.update("Sign-In", { visible: false });
			break;
	}
}
function getAuthToken(options) {
	chrome.identity.getAuthToken(
		{ interactive: options.interactive },
		options.callback
	);
}
function getAuthTokenSilent() {
	getAuthToken({
		interactive: false,
		callback: getAuthTokenCallback
	});
}
function getAuthTokenInteractive() {
	getAuthToken({
		interactive: true,
		callback: getAuthTokenCallback
	});
}
function getAuthTokenCallback(token) {
	// Catch chrome error if user is not authorized.
	if (chrome.runtime.lastError) {
		chrome.runtime.sendMessage({ type: "log", msg: "No token aquired" });
		changeState(STATE_START);
	} else {
		chrome.runtime.sendMessage({ type: "log", msg: "Token acquired" });
		changeState(STATE_AUTHTOKEN_ACQUIRED);
	}
}
function sendDataToExecutionAPI() {
	//xhr_button.className = "loading";
	getAuthToken({
		interactive: false,
		callback: sendDataToExecutionAPICallback
	});
}
function sendDataToExecutionAPICallback(token) {
	chrome.runtime.sendMessage({
		type: "log",
		msg: "Sending data to Execution API script"
	});
	post({
		url: "https://script.googleapis.com/v1/scripts/" + SCRIPT_ID + ":run",
		callback: executionAPIResponse,
		token: token,
		request: {
			function: "setData",
			parameters: {
				data: JSON.stringify(fieldsObj)
			}
		}
	});
}
function executionAPIResponse(response) {
	let info;
	console.log("response from sheet:" + JSON.stringify(response));
	if (response.hasOwnProperty("response")) {
		console.log("response " + response.response);
	} else {
		info = "Error...";
	}
	console.log(info);
}
function revokeToken() {
	getAuthToken({
		interactive: false,
		callback: revokeAuthTokenCallback
	});
}
function revokeAuthTokenCallback(current_token) {
	if (!chrome.runtime.lastError) {
		// Remove the local cached token
		chrome.identity.removeCachedAuthToken(
			{ token: current_token },
			function() {}
		);
		let xhr = new XMLHttpRequest();
		xhr.open(
			"GET",
			"https://accounts.google.com/o/oauth2/revoke?token=" + current_token
		);
		xhr.send();
		changeState(STATE_START);
		console.log(
			"Token revoked and removed from cache. Check chrome://identity-internals to confirm."
		);
	}
}
function post(options) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			// JSON response assumed. Other APIs may have different responses.
			options.callback(JSON.parse(xhr.responseText));
		} else if (xhr.readyState === 4 && xhr.status !== 200) {
			chrome.runtime.sendMessage({
				type: "log",
				msg: "post" + xhr.readyState + xhr.status + xhr.responseText
			});
		}
	};
	xhr.open("POST", options.url, true);
	// Set standard Google APIs authentication header.
	xhr.setRequestHeader("Authorization", "Bearer " + options.token);
	xhr.send(JSON.stringify(options.request));
}
function fillUser(user) {
	chrome.contextMenus.update("Sign-In", {
		title: "SIGNED IN AS:" + user.name
	});
}

function logError(error) {
	console.error(`Error: ${error}`);
}

/*
Update content when a new tab becomes active.
*/
chrome.tabs.onActivated.addListener(refreshContent);
/*
Update content when a new page is loaded into a tab.
*/
chrome.tabs.onUpdated.addListener(refreshContent);

function refreshContent() {
	chrome.windows.getCurrent({ populate: true }, function(windowInfo) {
		console.log("window:" + windowInfo);
		curWindowId = windowInfo.id;
		chrome.tabs.query({ windowId: curWindowId, active: true }, function(tabs) {
			curUrl = tabs[0].url;
			console.log("url:" + curUrl);
			curTabId = tabs[0].id;
			console.log("tabid:" + curTabId);
			if (curUrl.includes("seek.com.au")) {
				curId = getId(curUrl);
				if (curId == "search") {
					if (!searches.includes(curUrl)) {
						searches.push(curUrl);
						let skey = "searches";
						let sjsons = {};
						let sj = JSON.stringify(searches);
						sjsons[skey] = sj;
						chrome.storage.sync.set(sjsons, function() {
							console.log("searches saved:" + searches);
						});
					} else {
						console.log("search already stored in sync data");
					}
					console.log("num searches stored are :" + searches.length);
					console.log(searches);
				} else if (curId != 0) {
					if (!theJobs.includes(curId)) {
						let key = curId;
						let jsons = {};
						let j = JSON.stringify(new JobApp(curId));
						jsons[key] = j;
						console.log("new stored job:" + j);
						chrome.storage.sync.set(jsons, function() {
							console.log("new job added to storage");
						});
						theJobs.push(curId);
						let jkey = "theJobs";
						let jjsons = {};
						let jj = JSON.stringify(theJobs);
						jjsons[jkey] = jj;
						chrome.storage.sync.set(jjsons, function() {
							console.log("theJobs saved:" + theJobs);
							console.log("num jobApps stored are :" + theJobs.length);
							console.log(theJobs);
						});
						updateContent(j);
					} else {
						chrome.storage.sync.get(curId, function(result) {
							let js = result[curId];
							console.log("stored result:" + result);
							console.log("num jobApps stored are :" + theJobs.length);
							console.log(theJobs);
							updateContent(js);
						});
					}
				} else {
					console.log("neither seek job page or search? id is:" + curId);
				}
			}
		});
	});
}

chrome.webNavigation.onCommitted.addListener(refreshContent, {
	url: [{ hostSuffix: "seek.com" }, { hostSuffix: "seek.com.au" }]
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		let storageChange = changes[key];

		console.log(
			'Storage key "%s" in namespace "%s" changed. ' +
				'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});
/*
UPDATE when it is a seek job advert page...
*/
function updateContent(jss) {
	let now = Date.now();
	fieldsObj = JSON.parse(jss);
	fieldsObj.edited = now;
	fieldsObj.views++;
	console.log(fieldsObj);
	for (let kk = 0; kk < fieldsObj.fields.length; kk++) {
		let k = kk.toString();
		chrome.contextMenus.update(k, {
			title: theTitles[kk] + ": *" + fieldsObj.fields[kk] + "*",
			contexts: ["all"]
		});
	}
	chrome.contextMenus.update("progress", {
		title: "Progress: *" + fieldsObj.progress + "* Views:" + fieldsObj.views,
		contexts: ["all"]
	});
	let jsons = {};
	let j = JSON.stringify(fieldsObj);
	jsons[fieldsObj.id] = j;
	chrome.storage.sync.set(jsons, function() {
		console.log("job updated to storage");
	});
}

chrome.runtime.onMessage.addListener(function(response, sender, sendResponse) {
	let type = response.type;
	console.log("msg-type: " + type);
	if (type == "getFields") {
		sendResponse({
			state: state,
			type: "fields",
			fieldsObj: fieldsObj,
			id: curId,
			theJobs: theJobs,
			searches: searches
		});
	} else if (type == "setField") {
		let fieldId = response.fieldId;
		let fieldVal = response.fieldVal;
		progress++;
		fields[fieldId] = fieldVal;
		fieldsObj.fields = fields;
		fieldsObj.progress = progress;
		let key = curId;
		let jsons = {};
		let j = JSON.stringify(fieldsObj);
		jsons[key] = j;
		chrome.storage.sync.set(jsons, function() {
			console.log("job updated to storage");
		});
		console.log("num jobApps stored are :" + theJobs.length);
		sendResponse({
			state: state,
			type: "fields",
			fieldsObj: fieldsObj,
			id: curId,
			theJobs: theJobs,
			searches: searches
		});
	} else if (response.type == "setNextField") {
		let fieldVal = response.fieldVal;
		progress++;
		fields.push(fieldVal);
		fieldsObj.fields = fields;
		fieldsObj.progress = progress;
		let key = curId;
		let jsons = {};
		let j = JSON.stringify(fieldsObj);
		jsons[key] = j;
		chrome.storage.sync.set(jsons, function() {
			console.log("job updated to storage");
		});
		console.log("num jobApps stored are :" + theJobs.length);
		sendResponse({
			state: state,
			type: "fields",
			fieldsObj: fieldsObj,
			id: curId,
			theJobs: theJobs,
			searches: searches
		});
	} else if (response.type == "getJobs") {
		sendResponse({
			state: state,
			type: "theJobs",
			theJobs: theJobs
		});
	}
});

chrome.runtime.onInstalled.addListener(function() {
	getAuthTokenSilent();
	let parent = chrome.contextMenus.create({
		title: "autoSEEKr",
		id: "parent",
		contexts: ["all"]
	});
	chrome.contextMenus.create({
		id: "Sign-In",
		parentId: parent,
		title: "Sign-In",
		contexts: ["all"]
	});
	chrome.contextMenus.create({
		id: "RevokeToken",
		parentId: parent,
		title: "Revoke Sign-In",
		contexts: ["all"],
		visible: false
	});
	chrome.contextMenus.create({
		id: "s1",
		parentId: parent,
		type: "separator",
		contexts: ["all"]
	});
	chrome.contextMenus.create({
		id: "Send2Sheet",
		parentId: parent,
		title: "Send2Sheet",
		contexts: ["all"],
		visible: false
	});
	chrome.contextMenus.create({
		id: "Go2Sheet",
		parentId: parent,
		title: "Go2Sheet",
		contexts: ["all"],
		visible: false
	});
	chrome.contextMenus.create({
		id: "s2",
		parentId: parent,
		type: "separator",
		contexts: ["all"]
	});

	for (let k = 0; k < theTitles.length; k++) {
		let key = theTitles[k];
		let stnum = k.toString();
		chrome.contextMenus.create({
			id: stnum,
			parentId: parent,
			title: key,
			contexts: ["selection"]
		});
	}
	chrome.contextMenus.create({
		id: "ResetFields",
		parentId: parent,
		title: "ResetFields",
		contexts: ["all"],
		visible: false
	});
	chrome.contextMenus.create({
		id: "progress",
		parentId: parent,
		title: "Progress:",
		contexts: ["all"]
	});
	//chrome.contextMenus.create({id: "Agency", parentId: parent,title: "Agency","contexts": ["all"],"type": "checkbox"});
});
chrome.contextMenus.onClicked.addListener(function(item, tab) {
	let fieldId = item.menuItemId;
	let theValue = item.selectionText;
	console.log(
		"context clicked! id:" +
			fieldId +
			" url:" +
			tab.url +
			" thevalue:" +
			theValue
	);
	chrome.contextMenus.update("ResetFields", {
		visible: true
	});

	for (var o = 0; o < 6; o++) {
		if (o == fieldId) {
			let now = Date.now();
			fieldsObj.progress++;
			fieldsObj.edited = now;
			fieldsObj.fields[o] = theValue;
			let jsons = {};
			let j = JSON.stringify(fieldsObj);
			jsons[curId] = j;
			chrome.storage.sync.set(jsons, function() {
				console.log("job updated to storage");
			});
			chrome.contextMenus.update("progress", {
				title: "Progress:" + fieldsObj.progress + ", Views:" + fieldsObj.views
			});
			chrome.contextMenus.update(fieldId, {
				contexts: ["all"],
				title: theTitles[fieldId] + ": " + theValue
			});
		}
	}
	if (fieldId == "Send2Sheet") {
		sendDataToExecutionAPI();
	} else if (fieldId == "Sign-In") {
		getAccessToken()
			.then(getUserInfo)
			.then(fillUser)
			.catch(logError);
	} else if (fieldId == "Go2Sheet") {
		let url = "https://docs.google.com/spreadsheets/d/" + o1 + "/edit";
		chrome.tabs.create({ url: url, index: tab.index + 1 });
	}
});
