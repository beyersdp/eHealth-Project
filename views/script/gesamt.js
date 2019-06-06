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
  var txt= "Wollen Sie den Großeinsatz wirklich beenden und den automatischen Bericht starten?";
  if (confirm(txt)) {
	href="#";
  }
  document.getElementById("exit").innerHTML = txt;
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

// Einem HTML-Form ein weiteres Input-Feld hinzufuegen
function addInputField(id, inputName) {

	var newParagraph = document.createElement("p");
	newParagraph.style = "font-size:12px";
	
	var newInput = document.createElement("input");
	newInput.className = "w3-input w3-border dropElement rettungsmittel_kraefte";
	newInput.setAttribute("list", "funkrufDataList");
	newInput.type = "text";
	newInput.placeholder = "Tippen oder Drag&Drop";
	newInput.name = inputName;
	newInput.value = "";
	newInput.id = id;
	newInput.style= "margin-left:auto; margin-right:auto;"
	
	newInput.addEventListener('dragover', handleDragOver, false);
	newInput.addEventListener('dragenter', handleDragEnter, false);
	newInput.addEventListener('dragleave', handleDragLeave, false);
	newInput.addEventListener('drop', handleDrop, false);
	newInput.addEventListener('dragend', handleDragEnd, false);
	
	newParagraph.appendChild(newInput);
	
	document.getElementById(id).appendChild(newParagraph);
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

// Uebertragen der Informationen eines Rettungsmittel-Objects in den Bearbeitungsbereich
function updateRettungsmittel(id) {
	
	document.getElementById("rettungskraftNew_buton").click();
	
	var rettungsmittel = document.getElementById(id);
	
	document.getElementById("rettungsmittel_id").value = id;
	console.log(document.getElementById("rettungsmittel_id").value);
	
	document.getElementById("rettungsmittel_art").value = rettungsmittel.childNodes[3].childNodes[1].data;
	console.log(document.getElementById("rettungsmittel_art").value);
	
	document.getElementById("rettungsmittel_funkruf").value = rettungsmittel.childNodes[1].innerText;
	console.log(document.getElementById("rettungsmittel_funkruf").value);
	
	for (var i = 5; i < rettungsmittel.childNodes.length; i+=2) {
		
		console.log(rettungsmittel.childNodes[i].childNodes[1].data);
		
		if (i != 5) {
			document.getElementById("rettungsmittel_addInputField").click();
		}
	}
	
	var inputElements = document.getElementsByClassName("rettungsmittel_kraefte");
	var index = 5;
	
	for (var i = 0; i < inputElements.length; i++) {
	
		console.log(inputElements[i]);
		inputElements[i].value = rettungsmittel.childNodes[index].childNodes[1].data.slice(0,-1)
		console.log(rettungsmittel.childNodes[index].childNodes[1].data.slice(0,-1));
		
		index += 2;
	}
}

// Direkt startende Funktionen:
toHour('timestamp');
shortQuali("medQuali");
addDataList("funkrufDataList", "funkruf");