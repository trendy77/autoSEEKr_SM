function msg(type) {
	return new Promise(function(resolve, reject) {
		var ms = chrome.runtime.sendMessage({ type: type }, function(response) {
			if (response) {
				resolve(response);
			} else {
				reject(Error(response));
			}
		});
	});
}

msg("getFields").then(
	function(response) {
		console.log("Success!", response);
	},
	function(error) {
		console.error("Failed!", error);
	}
);
