/* 
  Copyright 2020. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial concept
*/

/**** Create and populate data structure ****/

var arrTrolls = []; // name, time added, channel ID

// Update arrTrolls from storage
browser.storage.local.get("trolls").then((results) => {
	if (results.trolls != undefined){
		if (JSON.stringify(results.trolls) != '[]'){
			arrTrolls = results.trolls;
		}
	}
}).catch((err) => {console.log('Error retrieving "trolls" from storage: '+err.message);});

// Default preferences (future version)
var oPrefs;

/**** Context menu item ****/

browser.menus.create({
	id: "hide-troll",
	title: "Hide Commenter's Comments",
	contexts: ["page", "link", "image", "selection"],
	documentUrlPatterns: ["https://www.youtube.com/watch*"],
	icons: {
		"128": "icons/de-troll-128.png"
	}
});

browser.menus.onClicked.addListener((menuInfo, currTab) => {
	switch (menuInfo.menuItemId) {
		case 'hide-troll':
			if (menuInfo.modifiers.includes('Shift')){
				// Call up Options
				browser.runtime.openOptionsPage();
			} else {
				// Send the tab info about the context element
				browser.tabs.sendMessage(
					currTab.id,
					{ 
						"tryblock": {
							"elem": menuInfo.targetElementId
						}
					}
				);
			}
			break;
		default:
			// WTF?
	}
});

/**** Handle Requests from Content and Options (future) ****/

/*
function handleMessage(request, sender, sendResponse){
	if ("get" in request) {
		// Send oPrefs to Options page
		sendResponse({
			prefs: oPrefs
		});
	} else if ("update" in request) {
		// Receive pref updates from Options page, store to oPrefs, and commit to storage
		var oSettings = request["update"];
		//TODO
		browser.storage.local.set({prefs: oPrefs})
			.catch((err) => {console.log('Error on browser.storage.local.set(): '+err.message);});
	}
}
browser.runtime.onMessage.addListener(handleMessage);
*/