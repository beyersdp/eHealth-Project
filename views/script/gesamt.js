// Menu rollout
function showDetails(id) {
  var x = document.getElementById(id);
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
    x.previousElementSibling.className += " w3-theme-d1";
  } else { 
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
  } else { 
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
		document.getElementById(dateString.id).innerHTML = moment(dateString.id, 'YYYYMMDDHHmmss').format('HH:mm:ss');
	});
}

// Einem HTML-Form ein weiteres Input-Feld hinzufuegen
function addInputField(id) {

	var newParagraph = document.createElement("p");
	newParagraph.style = "font-size:12px";
	
	var newInput = document.createElement("input");
	newInput.className = "w3-input w3-border dropElement";
	newInput.type = "text";
	newInput.placeholder = "Tippen oder Drag&Drop";
	newInput.name = "einsatz_kraefte";
	newInput.value = "";
	newInput.style= "margin-left:auto; margin-right:auto;"
	
	newInput.addEventListener('dragover', handleDragOver, false);
	newInput.addEventListener('dragenter', handleDragEnter, false);
	newInput.addEventListener('dragleave', handleDragLeave, false);
	newInput.addEventListener('drop', handleDrop, false);
	newInput.addEventListener('dragend', handleDragEnd, false);
	
	newParagraph.appendChild(newInput);
	console.log(newParagraph);
	
	document.getElementById(id).appendChild(newParagraph);
	
}

// Datalist erweitern nach Form-Eingabe
function addDataList(listName, v) {
	console.log("hier");
	var newOption = document.createElement("option");
	newOption.innerHTML = v;
	document.getElementById(listName).appendChild(newOption);
	
	console.log(document.getElementById(listName));
}

// Direkt startende Funktionen:
toHour('timestamp');
