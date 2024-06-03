/* 
  Copyright 2024. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.9 - can add troll from channel page
*/

const channelHeader = '#channel-container #channel-header';
const channelHandle = ':where(#meta p:not([hidden]) #channel-handle, #meta span:not([hidden]) #channel-handle)';
const pageChanId = 'meta[itemprop="identifier"]';

function styleTrashCan(){
	var chanhand = document.querySelector(channelHandle);
	if (chanhand){
		var chan = document.querySelector(pageChanId);
		if (chan){
			if (chanhand.nextElementSibling) chanhand.parentNode.insertBefore(btnTrash, chanhand.nextElementSibling);
			else chanhand.parentNode.appendChild(btnTrash);
			if (arrChans.includes(chan.getAttribute('content').trim())){
				btnTrash.setAttribute('blocked', 'true');
				btnTrash.setAttribute('title', 'Already hidden');
			}
		}
	} else {
		window.setTimeout(styleTrashCan, 500);
	}
}
function doDTbutton(evt){
	if (evt.target.hasAttribute('detrollbutton')){
		if (evt.shiftKey){	// Open Options
			browser.runtime.sendMessage({"options": "show"});
		} else {			// Hide troll?
			var chan = document.querySelector(pageChanId);
			if (!arrChans.includes(chan)){ // it's a new one!
				arrChans.push(chan);
				evt.target.setAttribute('blocked', 'true');
				evt.target.setAttribute('title', 'Already hidden');
				// Construct troll record
				var troll = {
					"name": '' + document.querySelector(channelHandle).textContent.trim(),
					"time": Date.now(),
					"channel": chan.getAttribute('content').trim()
				}
				// Update storage
				arrTrolls.push(troll);
				browser.storage.local.set(
					{trolls: arrTrolls}
				).catch((err) => {console.log('Error on browser.storage.local.set(): ' + err.message);});
			} else {
				window.alert('Already blocked');
			}
		}
	}
}

/*** Initialize Everything ***/

console.log('de-troll-channel initializing');

var arrTrolls = []; // array of Troll objects
var arrChans = []; // array of channels we want to block

// Default preferences
var oPrefs = {
	buttons: true	// add buttons next to names
};
var btnTrash = document.createElement('button');
btnTrash.type = 'button';
btnTrash.setAttribute('detrollbutton', 'true');
btnTrash.setAttribute('title', 'Hide this commenter');
btnTrash.appendChild(document.createTextNode('🗑️'));

// Update arrTrolls from storage
var step = 'retrieving "trolls" from storage';
browser.storage.local.get("trolls").then((results) => {
	if (results.trolls != undefined){
		if (JSON.stringify(results.trolls) != '[]'){
			arrTrolls = results.trolls;
			// Extract channel IDs into an array
			arrChans = [];
			for (var i=0; i<arrTrolls.length; i++){
				if (arrTrolls[i].hasOwnProperty('channel')) arrChans.push(arrTrolls[i].channel);
			}
		}
	}
}).then(() => {
	// Update oPrefs from storage
	step = 'retrieving "prefs" from storage';
	browser.storage.local.get("prefs").then((results) => {
		if (results.prefs != undefined){
			if (JSON.stringify(results.prefs) != '{}'){
				var arrSavedPrefs = Object.keys(results.prefs)
				for (var j=0; j<arrSavedPrefs.length; j++){
					oPrefs[arrSavedPrefs[j]] = results.prefs[arrSavedPrefs[j]];
				}
			}
		}
		setupClickEvent(); // Trash can not optional on channel pages
	});
}).then(() => {
	step = 'calling "styleTrashCan"';
	// add trash can
	styleTrashCan();
}).catch((err) => {console.log('Error ' + step + ': '+err.message);});

function setupClickEvent(){
	var chanhead = document.querySelector(channelHeader);
	if (chanhead){
		chanhead.addEventListener('click', doDTbutton, false);
	} else {
		window.setTimeout(setupClickEvent, 500);
	}
}

/*** Messaging Functions ***/

// Listen for context menu instructions
function handleMessage(request, sender, sendResponse){
	if ("tryblock" in request) {
		var el = browser.menus.getTargetElement(request.tryblock.elem);
		if (el){
			// Find the relevant comment
			var com = el.closest(commentsel);
			if (com){
				var author = com.querySelector(authorsel);
				if (author && author.href){
					// Update the blocked channels
					var chan = author.href.slice(author.href.lastIndexOf('/') + 1);
					if (!arrChans.includes(chan)){ // it's a new one!
						arrChans.push(chan);
						// Re-run the hider function
						flagTrolls(null);
						// Construct troll record
						var troll = {
							"name": author.textContent.trim(),
							"time": Date.now(),
							"channel": chan
						}
						// Update storage
						arrTrolls.push(troll);
						browser.storage.local.set(
							{trolls: arrTrolls}
						).catch((err) => {console.log('Error on browser.storage.local.set(): ' + err.message);});
					}
				} else {
					window.alert('Had a problem identifying the comment author.');
				}
			} else {
				window.alert('Seems your right-click wasn\'t in a comment?');
			}
			// Trigger background script to update other tabs ??
		} else {
			window.alert('Wasn\'t able to determine where you right-clicked!');
		}
	}
}
browser.runtime.onMessage.addListener(handleMessage);

/* Monitor for external storage changes - v0.8 */

function fixHiding(changes, area) {
	if ('trolls' in changes){
		if (JSON.stringify(arrTrolls) != JSON.stringify(changes.trolls.newValue)){
			// Update our arrays
			arrTrolls = changes.trolls.newValue;
			// Freshen the channel array
			arrChans = [];
			for (var i=0; i<arrTrolls.length; i++){
				if (arrTrolls[i].hasOwnProperty('channel')) arrChans.push(arrTrolls[i].channel);
			}
			// Run through and update the hiding
			flagTrolls(null);
		} else {
			// Updated trolls already accounted for. No action needed.
		}
	}
	if ('prefs' in changes){
		// TODO: update oPrefs
	}
}
  
browser.storage.onChanged.addListener(fixHiding);