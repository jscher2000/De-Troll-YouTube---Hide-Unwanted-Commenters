/* 
  Copyright 2021. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial concept
  version 0.6 - add buttons for each author
  version 0.6.1 - bug fixes, Refresh List button on Options page
*/

/*** Initialize Page ***/

var arrTrolls = []; // array of Troll objects
// Default preferences
var oPrefs = {
	buttons: true	// add buttons next to names
};

// Update arrTrolls from storage
function refreshTrolls(){
	// Clean old rows, if any
	var tbod = document.querySelector('#trolls tbody');
	while (tbod.lastChild) tbod.removeChild(tbod.lastChild);
	browser.storage.local.get("trolls").then((results) => {
		if (results.trolls != undefined){
			if (JSON.stringify(results.trolls) != '[]'){
				arrTrolls = results.trolls;
				// List trolls in reverse chron order
				arrTrolls.sort(function(a,b) {return (b.time - a.time);});
				// Set up template
				var newTR = document.getElementById('newTR'), clone, cells;
				for (var i=0; i<arrTrolls.length; i++){
					clone = document.importNode(newTR.content, true);
					row = clone.querySelector('tr');
					row.id = arrTrolls[i].channel;
					cells = row.querySelectorAll('td');
					cells[0].querySelectorAll('span')[0].textContent = arrTrolls[i].name;
					cells[0].querySelectorAll('span')[1].textContent = arrTrolls[i].channel;
					cells[1].textContent = new Date(arrTrolls[i].time).toLocaleString();
					tbod.appendChild(clone);
				}
			} else {
				document.getElementById('oops').textContent = 'No trolls blocked yet.';
			}
		} else {
			document.getElementById('oops').textContent = 'No trolls blocked yet.';
		}
	}).catch((err) => {
		document.getElementById('oops').textContent = 'Error retrieving "trolls" from storage: ' + err.message;
	});
}
refreshTrolls();

// Update oPrefs from storage
browser.storage.local.get("prefs").then((results) => {
	if (results.prefs != undefined){
		if (JSON.stringify(results.prefs) != '{}'){
			var arrSavedPrefs = Object.keys(results.prefs)
			for (var j=0; j<arrSavedPrefs.length; j++){
				oPrefs[arrSavedPrefs[j]] = results.prefs[arrSavedPrefs[j]];
			}
		}
	}
	// Update form state
	document.getElementById('chktrashcan').checked = oPrefs.buttons;
}).catch((err) => {
	document.getElementById('oops').textContent = 'Error retrieving "prefs" from storage: ' + err.message;
});

/*** Handle User Actions ***/

// Change troll status
function markRow(evt){
	var tgt = evt.target;
	if (tgt.nodeName === 'TBODY') return; // we need something in the tbody
	if (tgt.nodeName != 'TR') tgt = tgt.closest('tr');
	if (tgt.hasAttribute('axn') && tgt.getAttribute('axn') == 'remove'){
		tgt.removeAttribute('axn');
		tgt.querySelectorAll('td')[2].textContent = 'Keep Blocking';
	} else {
		tgt.setAttribute('axn', 'remove');
		tgt.querySelectorAll('td')[2].textContent = 'Grant Clemency';
	}
	// Update state of Save button
	if (document.querySelectorAll('#trolls tr[axn="remove"]').length > 0) document.getElementById('btnsave').removeAttribute('disabled');
	else document.getElementById('btnsave').setAttribute('disabled', 'disabled');
}

// Update storage
function updateTrolls(evt){
	evt.target.blur();
	// Update and save arrTrolls
	var changed = document.querySelectorAll('#trolls tr[axn="remove"]');
	for (i=0; i<changed.length; i++){
		// delete the troll with the channel ID
		arrTrolls.splice(arrTrolls.findIndex( objTroll => objTroll.channel === changed[i].id ), 1);
	}
	// Update storage
	browser.storage.local.set(
		{trolls: arrTrolls}
	).then(() => {
		// Refresh the table
		refreshTrolls();
	}).catch((err) => {
		document.getElementById('oops').textContent = 'Error on browser.storage.local.set(): ' + err.message;
	});
}

// Attach event handlers 
document.querySelector('#trolls tbody').addEventListener('click', markRow, false);
document.getElementById('btnrefresh').addEventListener('click', refreshTrolls, false);
document.getElementById('btnsave').addEventListener('click', updateTrolls, false);
document.getElementById('chktrashcan').addEventListener('click', function(){
	oPrefs.buttons = document.getElementById('chktrashcan').checked;
	browser.storage.local.set(
		{prefs: oPrefs}
	).catch((err) => {
		document.getElementById('oops').textContent = 'Error on browser.storage.local.set(): ' + err.message;
	});
}, false);
