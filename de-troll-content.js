/* 
  Copyright 2024. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial concept
  version 0.6 - add buttons for each author
  version 0.6.1 - bug fixes, Refresh List button on Options page
  version 0.7 - re-base event handler for post (Community) pages
  version 0.8 - fix various broken things
  version 0.8.1 - update CSS selectors, accommodate delayed comment rendering (3/30/2024)
  version 0.8.2 - update CSS selectors for comment replies (3/31/2024)
  TODO: hidden comment count, options button
*/

/*** Main Hiding Routine (may need fixed as Google changes things) ***/

const commentsel = 'ytd-comment-view-model, ytd-comment-renderer';
const authorsel = '#author-text';
const threadselector = 'ytd-comment-thread-renderer';
const threadauthorsel = 'ytd-comment-view-model:not([is-reply]) ' + authorsel + ', ytd-comment-renderer:not([is-reply]) ' + authorsel;
const replyselector = 'ytd-comment-thread-renderer:not([hidetroll="true"]) ytd-comment-view-model[is-reply], ytd-comment-thread-renderer:not([hidetroll="true"]) ytd-comment-renderer[is-reply]';
const replyId = 'loaded-replies';
const replyClass = 'ytd-comment-replies-renderer';

function flagTrolls(elStart){
	var threads, replies, i, author, chan, verif;
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
			if (arrChans.includes(chan)){  // hide comment
				threads[i].setAttribute('hidetroll', 'true');
			} else {  // un-hide comment
				threads[i].removeAttribute('hidetroll');
				if (oPrefs.buttons) {  // insert button if we don't already have one on this comment
					if (!author.hasAttribute('hidden')){  // position next to authorsel
						if (!author.nextElementSibling){
							author.parentNode.appendChild(btnTrash.cloneNode(true));
						} else if (!author.nextElementSibling.hasAttribute('detrollbutton')){
							author.parentNode.insertBefore(btnTrash.cloneNode(true), author.nextElementSibling);
						}
					} else {  // check for verified author tag
						verif = author.nextElementSibling;
						if (verif && !verif.hasAttribute('hidden')){
							if (verif && !verif.nextElementSibling){
								verif.parentNode.appendChild(btnTrash.cloneNode(true));
							} else if (verif && !verif.nextElementSibling.hasAttribute('detrollbutton')){
								verif.parentNode.insertBefore(btnTrash.cloneNode(true), verif.nextElementSibling);
							}
						}
					}
				}
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
			if (arrChans.includes(chan)){  // hide comment
				replies[i].setAttribute('hidetroll', 'true');
			} else {  // un-hide comment
				replies[i].removeAttribute('hidetroll');
				if (oPrefs.buttons) {  // insert button if we don't already have one on this comment
					if (!author.hasAttribute('hidden')){  // position next to authorsel
						if (!author.nextElementSibling){
							author.parentNode.appendChild(btnTrash.cloneNode(true));
						} else if (!author.nextElementSibling.hasAttribute('detrollbutton')){
							author.parentNode.insertBefore(btnTrash.cloneNode(true), author.nextElementSibling);
						}
					} else {  // check for verified author tag
						verif = author.nextElementSibling;
						if (verif && !verif.hasAttribute('hidden')){
							if (verif && !verif.nextElementSibling){
								verif.parentNode.appendChild(btnTrash.cloneNode(true));
							} else if (verif && !verif.nextElementSibling.hasAttribute('detrollbutton')){
								verif.parentNode.insertBefore(btnTrash.cloneNode(true), verif.nextElementSibling);
							}
						}
					}
				}
			} 
		}
	}
}
function doDTbutton(evt){
	if (evt.target.hasAttribute('detrollbutton')){
		if (evt.shiftKey){	// Open Options
			browser.runtime.sendMessage({"options": "show"});
		} else {			// Hide troll
			// Find the comment and author
			var comment, author, chan;
			comment = evt.target.closest(replyselector);
			if (comment) { // it's a reply
				author = comment.querySelector(authorsel);
			} else {
				comment = evt.target.closest(threadselector);
				author = comment.querySelector(threadauthorsel);
			}
			// Update array
			chan = author.href.slice(author.href.lastIndexOf('/') + 1);
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
		}
	}
}

/*** Initialize Everything ***/

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
		if (oPrefs.buttons){
			setupClickEvent();
		}
	});
}).then(() => {
	step = 'calling "flagTrolls"';
	// check existing comments
	flagTrolls(null);
	// set up mutation observer for future loaded comments
	step = 'creating Mutation Observer';
	var chgMon = new MutationObserver((mutationSet, observer) => {
		if (oPrefs.buttons){ // no worries about duplicating
			document.body.addEventListener('click', doDTbutton, false);
		}
		mutationSet.forEach((mutation) => {
			if (mutation.type == "childList" && (mutation.target.nodeName == 'YTD-COMMENT-RENDERER' || 
				mutation.target.nodeName == 'YTD-COMMENT-THREAD-RENDERER' || mutation.target.nodeName == 'YTD-COMMENT-REPLIES-RENDERER' || 
				mutation.target.id == replyId || mutation.target.classList.contains(replyClass))){
				flagTrolls(mutation.target);
			}
		});
	});
	// attach chgMon to document.body
	step = 'attaching Mutation Observer';
	chgMon.observe(document.body, {
		childList: true, subtree: true, 
		attributes: false, characterData: false
	});
}).catch((err) => {console.log('Error ' + step + ': '+err.message);});

function setupClickEvent(){
	var comments = document.querySelector('ytd-comments#comments');
	if (comments){
		comments.addEventListener('click', doDTbutton, false);
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