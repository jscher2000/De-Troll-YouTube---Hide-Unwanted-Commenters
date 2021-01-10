/* 
  Copyright 2021. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial concept
  version 0.6 - add buttons for each author
  version 0.6.1 - bug fixes, Refresh List button on Options page
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

// Default preferences
var oPrefs = {
	buttons: true	// add buttons next to names
};

// Update oPrefs from storage
browser.storage.local.get("prefs").then( (results) => {
	if (results.prefs != undefined){
		if (JSON.stringify(results.prefs) != '{}'){
			var arrSavedPrefs = Object.keys(results.prefs)
			for (var j=0; j<arrSavedPrefs.length; j++){
				oPrefs[arrSavedPrefs[j]] = results.prefs[arrSavedPrefs[j]];
			}
		}
	}
}).catch((err) => {console.log('Error retrieving "prefs" from storage: '+err.message);});

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

function handleMessage(request, sender, sendResponse){
	if ("options" in request) {
		browser.runtime.openOptionsPage();	
	}
}
browser.runtime.onMessage.addListener(handleMessage);
