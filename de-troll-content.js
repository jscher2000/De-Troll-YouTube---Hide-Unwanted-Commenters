/* 
  Copyright 2020. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial concept
*/

/*** Main Hiding Routine (may need fixed as Google changes things) ***/

const commentsel = 'ytd-comment-renderer';
const authorsel = '#author-text';
const threadselector = 'ytd-comment-thread-renderer';
const threadauthorsel = 'ytd-comment-renderer:not([is-reply]) ' + authorsel;
const replyselector = 'ytd-comment-thread-renderer:not([hidetroll="true"]) ytd-comment-renderer[is-reply]';

function flagTrolls(elStart){
	var threads, replies, i, author, chan;
	// Check threads (top level comments)
	if (elStart){ // bump up to thread instead of entire doc
		threads = [elStart.closest(threadselector)];
	} else {
		threads = document.querySelectorAll(threadselector);
	}
	for (i=0; i<threads.length; i++){
		author = threads[i].querySelector(threadauthorsel);
		if (author && author.href){
			chan = author.href.slice(author.href.lastIndexOf('/') + 1);
			if (arrChans.includes(chan)){
				threads[i].setAttribute('hidetroll', 'true');
			}
		}
	}
	// Check replies to non-hidden comments
	if (elStart){ // bump up to thread instead of entire doc
		replies = elStart.closest(threadselector).querySelectorAll(replyselector);
	} else {
		replies = document.querySelectorAll(replyselector);
	}
	for (i=0; i<replies.length; i++){
		author = replies[i].querySelector(authorsel);
		if (author && author.href){
			chan = author.href.slice(author.href.lastIndexOf('/') + 1);
			if (arrChans.includes(chan)){
				replies[i].setAttribute('hidetroll', 'true');
			}
		}
	}
}

/*** Initialize Everything ***/

var arrTrolls = []; // array of Troll objects
var arrChans = []; // array of channels we want to block

// Update arrTrolls from storage
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
	// check existing comments
	flagTrolls(null);
	// set up mutation observer for future loaded comments
	var chgMon = new MutationObserver((mutationSet, observer) => {
		mutationSet.forEach((mutation) => {
			if (mutation.type == "childList" && mutation.target.nodeName == 'YTD-COMMENT-RENDERER'){
				console.log(mutation);
				flagTrolls(mutation.target);
			}
		});
	});
	// attach chgMon to document.body
    chgMon.observe(document.body, {
		childList: true, subtree: true, 
		attributes: false, characterData: false
	});
}).catch((err) => {console.log('Error retrieving "trolls" from storage: '+err.message);});

/*** Messaging Functions ***/

// Listen for context menu instructions
function handleMessage(request, sender, sendResponse){
	console.log(request);
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
