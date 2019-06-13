// Menu rollout
function showDetails(id) {
	var x = document.getElementById(id);
	if (x.className.indexOf("w3-show") == -1) {
		x.className += " w3-show";
		x.previousElementSibling.className += " w3-theme-d1";
	} 
	else { 
		x.className = x.className.replace("w3-show", "");
		x.previousElementSibling.className = 
		x.previousElementSibling.className.replace(" w3-theme-d1", "");
	}
}

// Used to toggle the menu on smaller screens when clicking on the menu button
function openNav() {
	var x = document.getElementById("navDemo");
	if (x.className.indexOf("w3-show") == -1) {
		x.className += " w3-show";
	} 
	else { 
		x.className = x.className.replace(" w3-show", "");
	}
}

// Sicherheitsabfrage, bevor der Gesamteinsatz beendet wird
function gesamteinsatzBeenden() {
  var txt= "Wollen Sie den Gesamteinsatz wirklich beenden und die Gesamtdokumentation erstellen?";
  if (confirm(txt)) {
	document.getElementById("beendenButton").href= "/gesamtdoku";
  }
}

// Aus default Date-String die Stunden, Minuten und Sekunden extrahieren
function toHour(className) {
	
	var dateStrings = document.getElementsByClassName(className);
	
	Array.prototype.forEach.call(dateStrings, function(dateString) {

		newIcon = document.createElement("i");
		newIcon.className = "fa fa-clock-o fa-fw w3-margin-right";
		
		dateString.appendChild(newIcon);
		dateString.innerText = moment(dateString.innerText, 'YYYYMMDDHHmmss').format('HH:mm:ss');
	});
}

// Einer HTML-Form ein weiteres Input-Feld hinzufuegen
function addInputField(id, inputName) {

	var newParagraph = document.createElement("p");
	newParagraph.style = "font-size:10px";
	
	var newInput = document.createElement("input");
	newInput.className = "w3-input w3-border dropElement " + inputName;
	newInput.setAttribute("list", "funkrufDataList");
	newInput.type = "text";
	newInput.placeholder = "Tippen oder Drag&Drop";
	newInput.name = inputName;
	newInput.value = "";
	newInput.id = id+id; //wichtig fuer removeInputField, sonst loescht es alle und es koennen auch keine neuen hinzugefuegt werden
	newInput.style= "height:25px; margin-left:auto; margin-right:auto;"
	
	newInput.addEventListener('dragover', handleDragOver, false);
	newInput.addEventListener('dragenter', handleDragEnter, false);
	newInput.addEventListener('dragleave', handleDragLeave, false);
	newInput.addEventListener('drop', handleDrop, false);
	newInput.addEventListener('dragend', handleDragEnd, false);
	
	newParagraph.appendChild(newInput);
	
	document.getElementById(id).appendChild(newParagraph);
}

// Eine HTML-Form, um ein Input-Feld dezimieren
function removeInputField(id, inputName){
	var elem = document.getElementById(id+id);
    elem.parentNode.removeChild(elem);
} 

// Datalist erweitern nach Form-Eingabe
function addDataList(listName, className) {

	var classElements = document.getElementsByClassName(className);
	
	Array.prototype.forEach.call(classElements, function(classElement) {
		
		var newOption = document.createElement("option");
		newOption.innerHTML = classElement.innerText;
		document.getElementById(listName).appendChild(newOption);
	});
}

// Medizinische Qualifikationen abkuerzen
function shortQuali(className) {
	
	var qualiElements = document.getElementsByClassName(className);
	
	Array.prototype.forEach.call(qualiElements, function(qualiElement) {
		
		if (qualiElement.innerText == "Praktikant/-in (Erste Hilfe)") {
			qualiElement.innerText = "(EH)"
		}
		if (qualiElement.innerText == "Sanitätshelfer/-in") {
			qualiElement.innerText = "(SAN)"
		}
		if (qualiElement.innerText == "Rettungshelfer/-in") {
			qualiElement.innerText = "(RH)"
		}
		if (qualiElement.innerText == "Rettungssanitäter/-in") {
			qualiElement.innerText = "(RS)"
		}
		if (qualiElement.innerText == "Rettungsassistent/-in") {
			qualiElement.innerText = "(RA)"
		}
		if (qualiElement.innerText == "Notfallsanitäter/in") {
			qualiElement.innerText = "(NFS)"
		}
		if (qualiElement.innerText == "Notarzt/Notärztin") {
			qualiElement.innerText = "(NA)"
		}
	});
}

// Medizinische Qualifikationen ausschreiben
function longQuali(quali) {
		
	var result;
		
	if (quali == "(EH)") {
		result = "Praktikant/-in (Erste Hilfe)";
	}
	if (quali == "(SAN)") {
		result = "Sanitätshelfer/-in";
	}
	if (quali == "(RH)") {
		result = "Rettungshelfer/-in";
	}
	if (quali == "(RS)"){
		result = "Rettungssanitäter/-in";
	}
	if (quali == "(RA)") {
		result = "Rettungsassistent/-in";
	}
	if (quali == "(NFS)") {
		result = "Notfallsanitäter/in";
	}
	if (quali == "(NA)") {
		result = "Notarzt/Notärztin";
	}
	
	return result;
}

// Fahrzeugbezeichnungen abkuerzen
function shortArt(className) {
	
	var artElements = document.getElementsByClassName(className);
	
	Array.prototype.forEach.call(artElements, function(artElement) {
		
		if (artElement.innerText == "Krankentransportwagen (KTW)") {
			artElement.innerText = "(KTW)"
		}
		if (artElement.innerText == "Rettungswagen (RTW)") {
			artElement.innerText = "(RTW)"
		}
		if (artElement.innerText == "Notarzteinsatzfahrzeug (NEF)") {
			artElement.innerText = "(NEF)"
		}
		if (artElement.innerText == "Mannschaftstransportwagen (MTW)") {
			artElement.innerText = "(MTW)"
		}
		if (artElement.innerText == "Gerätewagen (GW)") {
			artElement.innerText = "(GW)"
		}
		if (artElement.innerText == "Einsatzleitwagen (ELW)") {
			artElement.innerText = "(ELW)"
		}
	});
}

// Simuliert einen Klick auf ein uebergebenes Element
function clickOn(id) {
	
	document.getElementById(id).click();
}

// Wechseln des anzuzeigenden Elements des dynamischen Infobereichs mittels Pfeil-Button
function switchInfoDisplay(source) {
	
	if (source == 'kerndaten') {
		document.getElementById(source).hidden = true;
		document.getElementById('notiz').hidden = false;
	}
	
	if (source == 'notiz') {
		document.getElementById(source).hidden = true;
		document.getElementById('einsatzChronik').hidden = false;
	}
	
	if (source == 'einsatzChronik') {
		document.getElementById(source).hidden = true;
		document.getElementById('funkChronik').hidden = false;
	}
	
	if (source == 'funkChronik') {
		document.getElementById(source).hidden = true;
		document.getElementById('kerndaten').hidden = false;
	}
}

// Wechseln des anzuzeigenden Elements des dynamischen Infobereichs mittels NavBar
function switchInfoDisplayNavBar(source) {
	if (source == 'kerndaten') {
		document.getElementById(source).hidden = false;
		document.getElementById('notiz').hidden = true;
		document.getElementById('einsatzChronik').hidden = true;
		document.getElementById('funkChronik').hidden = true;
	}
	
	if (source == 'notiz') {
		document.getElementById(source).hidden = false;
		document.getElementById('kerndaten').hidden = true;
		document.getElementById('einsatzChronik').hidden = true;
		document.getElementById('funkChronik').hidden = true;
	}
	
	if (source == 'einsatzChronik') {
		document.getElementById(source).hidden = false;
		document.getElementById('kerndaten').hidden = true;
		document.getElementById('notiz').hidden = true;
		document.getElementById('funkChronik').hidden = true;
	}
	
	if (source == 'funkChronik') {
		document.getElementById(source).hidden = false;
		document.getElementById('kerndaten').hidden = true;
		document.getElementById('notiz').hidden = true;
		document.getElementById('einsatzChronik').hidden = true;
	}
}

// Dynamisch anpassbare Textareas:
var autoExpand = function (field) {
	// Reset field height
	field.style.height = 'inherit';

	// Get the computed styles for the element
	var computed = window.getComputedStyle(field);

	// Calculate the height
	var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
	             + parseInt(computed.getPropertyValue('padding-top'), 10)
	             + field.scrollHeight
	             + parseInt(computed.getPropertyValue('padding-bottom'), 10)
	             + parseInt(computed.getPropertyValue('border-bottom-width'), 10);

	
	// limitation for Expand
	var limit = 200;
	field.style.height = Math.min(height, limit) + "px";
				 
	//field.style.height = height + 'px';
};

document.addEventListener('input', function (event) {
	if (event.target.tagName.toLowerCase() !== 'textarea') return;
	autoExpand(event.target);
}, false);

// Element ausblenden, wenn die Anzahl ChildNodes zu gering
function checkChildNodesHide(id) {
	
	if (document.getElementById(id)) {
		if (document.getElementById(id).childNodes.length == 2) {
			document.getElementById(id).hidden = true;
		}
	}
}



// Direkt startende Funktionen:
toHour('timestamp');
shortQuali("medQuali");
shortArt("fahrzeugArt");
addDataList("funkrufDataList", "funkruf");
checkChildNodesHide("right_scrollbar");