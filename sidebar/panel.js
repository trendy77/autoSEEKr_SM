//const theTitles = ["JobTitle", "Employer", "Contact", "USP1", "USP2", "USP3"];
if (!panId) {
	let panId = 0;
}
//const SCRIPT_ID = "MNiU5rCPbRI5oHLgJYy_hNZgEv2YCqn3J"; // Apps Script script id

let state = chrome.runtime.getBackgroundPage(changeState);
const selectors = ["#jtin", "#empin", "#conin", "#u1in", "#u2in", "#u3in"];
let clickSet, theJobs, searches, inerJB, textContent, s0,s1,
	s2,	s3, tTp, tFl, tSc, tSh,	s4,	s5,
	signin_button,
	xhr_button,
	revoke_button,
	exec_info_div,
	exec_data,
	exec_result;

function msger(type) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({ type: type }, function(response) {
			if (response) {
				resolve(response);
			} else {
				reject(Error(response));
			}
		});
	});
}
msger("getJobs").then(
	function(response) {
		console.log("Success!", response);
		let dehobs = response.theJobs;
		handleJobs(dehobs);
	},
	function(error) {
		console.error("Failed!", error);
	}
);
msger("getFields").then(
	function(response) {
		console.log("Success!", response);
		let fieldsObj = response.fieldsObj;
		theJobs = response.theJobs || [];
		searches = response.searches || [];
		for (var t = 0; t < theJobs.length; t++) {
			var li = document.body.createElement("li");
			li.textContent = theJobs[t];
			inerJB.appendChild(li);
		}
		id = response.id;
		if (id !== 0) {
			fields = fieldsObj.fields;
			progress = fieldsObj.progress;
			document.querySelector("#urlin").innerText = id;
			for (let k = 0; k < fields.length; k++) {
				let inff = selectors[k];
				let infobox = document.querySelector(inff);
				infobox.innerText += fields[k];
			}
		}
	},
	function(error) {
		console.error("Failed!", error);
	}
);

function handleJobs(jobs) {
	let contain = document.querySelector("#innSheetlist");
	let ul = document.createElement("ul");
	for (let y in jobs) {
		let li = document.createElement("li");
		li.textContent = jobs[y];
		let aa = document.createElement("a");
		aa.setAttribute("href", "https://seek.com.au/jobs/" + jobs[y] + "/");
		aa.setAttribute("target", "_blank");
		li.append(aa);
		ul.append(li);
		contain.append(ul);
	}
	for (var e = 0; e < jobs.length; e++) {
		inerJB.innerText += theJobs[e];
	}
}

function setSelection() {
	let selectedText = window.getSelection().toString();
	if (selectedText) {
		chrome.runtime.sendMessage({ type: "setNextField", msg: selectedText });
		switch (progress) {
			case "0":
				document.querySelector("#jtin").textContent = selectedText;
				results.s0 = selectedText;
				s0.setAttribute("display", "none");
				s1.setAttribute("display", "block");
				s1.addEventListener("click", setSelection);
				progress++;
				break;
			case "1":
				document.querySelector("#empin").textContent = selectedText;
				results.s1 = selectedText;
				s1.setAttribute("display", "none");
				s2.setAttribute("display", "block");
				s2.addEventListener("click", setSelection);
				progress++;
				break;
			case "2":
				document.querySelector("#conin").textContent = selectedText;
				results.s2 = selectedText;
				s2.setAttribute("display", "none");
				s3.setAttribute("display", "block");
				s3.addEventListener("click", setSelection);
				progress++;
				break;
			case "3":
				document.querySelector("#u1in").textContent = selectedText;
				results.s3 = selectedText;
				s3.setAttribute("display", "none");
				s4.setAttribute("display", "block");
				s4.addEventListener("click", setSelection);
				progress++;
				break;
		}
	} else {
		alert("select text");
	}
}
function disableButton(button) {
	button.setAttribute("disabled", "disabled");
}
function enableButton(button) {
	button.removeAttribute("disabled");
}
function changeState(window) {
	console.log(window);
	let STATE_START = 1;
	let STATE_ACQUIRING_AUTHTOKEN = 2;
	let STATE_AUTHTOKEN_ACQUIRED = 3;
	curId = window.curId;
	state = window.state;
	fieldsObj = window.fieldsObj;

	switch (state) {
		case STATE_START:
			enableButton(signin_button);
			disableButton(xhr_button);
			disableButton(clickSet);
			disableButton(revoke_button);
			break;
		case STATE_ACQUIRING_AUTHTOKEN:
			sampleSupport.log("Acquiring token...");
			disableButton(signin_button);
			disableButton(xhr_button);
			disableButton(revoke_button);
			break;
		case STATE_AUTHTOKEN_ACQUIRED:
			disableButton(signin_button);
			enableButton(xhr_button);
			enableButton(clickSet);
			enableButton(revoke_button);
			let img = window.user.image;
			let nam = window.user.name;
			let mai = window.user.email;
			document.body.querySelector("#uimg").setAttribute("src", img);
			document.body.querySelector("#uname").textContent = nam;
			document.body.querySelector("#uemail").textContent = mai;
			break;
	}
}
function login() {
	e.preventDefault();
	chrome.runtime.getBackgroundPage.getAuthTokenInteractive();
}

function sendDataToExecutionAPI() {
	chrome.runtime.getBackgroundPage.sendDataToExecutionAPI();
}

document.addEventListener("DOMContentLoaded", function() {
	clickSet = document.querySelector("#setFromClip");
	inerJB = document.querySelector("#sheetlist");
	inerJB.textContent = "";
	s0 = document.querySelector("#setZ");
	s1 = document.querySelector("#set1");
	s2 = document.querySelector("#set2");
	s3 = document.querySelector("#set3");
	s4 = document.querySelector("#set4");
	s5 = document.querySelector("#set5");
	tSc = document.querySelector("#toScript");
	tSh = document.querySelector("#toSheet"));
	tFl = document.querySelector("#toFold");
	tTp = document.querySelector("#toTemp");
	signin_button = document.querySelector("#signin");
	xhr_button = document.querySelector("#goButton");
	revoke_button = document.querySelector("#revoke");
	exec_info_div = document.querySelector("#exec_info");
	exec_data = document.querySelector("#exec_data");
	exec_result = document.querySelector("#exec_result");
	chrome.storage.sync.get(function(result) {
		theJobs = result.theJobs;
		searches = result.searches;
		console.log("stored result:" + result);
		console.log("num jobApps stored are :" + theJobs.length);
		clickSet.addEventListener("click", setSelection);
		s0.addEventListener("click", setSelection);
		s1.addEventListener("click", setSelection);
		s2.addEventListener("click", setSelection);
		s3.addEventListener("click", setSelection);
		s4.addEventListener("click", setSelection);
		s5.addEventListener("click", setSelection);
		signin_button.addEventListener("click", login);
		xhr_button.addEventListener(
			"click",
			sendDataToExecutionAPI.bind(xhr_button, true)
		);
		//revoke_button.addEventListener("click", revokeToken);
	});
});
