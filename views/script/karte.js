var ktwIcon  = L.icon({
		iconUrl: './img/icons/map_ktw.png',
		iconSize:     [103, 54], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [51.5, 27], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

const rtwIcon = L.icon({
		iconUrl: './img/icons/map_rtw.png',
		iconSize:     [100, 47], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [50, 23.5], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

var nefIcon  = L.icon({
		iconUrl: './img/icons/map_nef.png',
		iconSize:     [99, 51], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [49.5, 25.5], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

var mtwIcon  = L.icon({
		iconUrl: './img/icons/map_mtw.png',
		iconSize:     [118, 66], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [59, 33], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

var gwIcon  = L.icon({
		iconUrl: './img/icons/map_lkw.png',
		iconSize:     [112, 63], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [56, 31.5], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

var elwIcon  = L.icon({
		iconUrl: './img/icons/map_elw.png',
		iconSize:     [113, 49], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [56.5, 24.5], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
});

var postenIcon  = L.icon({
		iconUrl: './img/icons/marker_yellow.png',
		iconSize:     [25, 41], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
		popupAnchor:  [1, -41] // point from which the popup should open relative to the iconAnchor
});

var rettungskraftIcon  = L.icon({
		iconUrl: './img/icons/marker_green.png',
		iconSize:     [25, 41], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
		popupAnchor:  [1, -41] // point from which the popup should open relative to the iconAnchor
});

var einsatzIcon  = L.icon({
		iconUrl: './img/icons/marker_red.png',
		iconSize:     [25, 41], // size of the icon
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
		popupAnchor:  [1, -41] // point from which the popup should open relative to the iconAnchor
});





// Gibt die entsprechende Referenz auf ein Map-Icon zurueck
function getIcon(indicator) {

	if (indicator == "Krankentransportwagen (KTW)") {
		return ktwIcon;
	}
	if (indicator == "Rettungswagen (RTW)") {
		return rtwIcon;
	}
	if (indicator == "Notarzteinsatzfahrzeug (NEF)") {
		return nefIcon;
	}
	if (indicator == "Mannschaftstransportwagen (MTW)") {
		return mtwIcon;
	}
	if (indicator == "Gerätewagen (GW)") {
		return gwIcon;
	}
	if (indicator == "Einsatzleitwagen (ELW)") {
		return elwIcon;
	}
	if (indicator == "Posten") {
		return postenIcon;
	}
	if (indicator == "Rettungskraft") {
		return rettungskraftIcon;
	}
	if (indicator == "Einsatz") {
		return einsatzIcon;
	}
}

// Kontextmenu-Funktion - Marker entfernen
function markerEntfernen(e) {
	e.relatedTarget.remove();
	
	var markerName = e.relatedTarget._popup._content.replace("<b>", "").replace("</b>","");
	var markerId = document.getElementById(markerName).parentElement.id;

	var data = {'id': markerId, 'position': ""};

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			console.log(this.responseText);
		}
	};
	xhttp.open("POST", "/position", true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send(JSON.stringify(data)); 
}

// Kontextmenu-Funktion - Karte zentrieren
function mapZentrieren (e) {
	map.panTo(e.latlng);
}

// Kontextmenu-Funktion - Position an Server senden
function positionSenden(e) {
	
	console.log(e);
	
	
	var markerName = e.target._popup._content.replace("<b>", "").replace("</b>","");
	var markerId = document.getElementById(markerName).parentElement.id;

	var data = {'id': markerId, 'position': e.latlng};

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			//console.log(this.responseText);
		}
	};
	xhttp.open("POST", "/position", true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send(JSON.stringify(data)); 
}

// Aktuelle Positionierung der Karte an den Server senden
function sendView(center, zoom) {
	
	var data = {'position': center, 'zoom': zoom};
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			//console.log(this.responseText);
		}
	};
	xhttp.open("POST", "/mapstate", true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send(JSON.stringify(data)); 
} 

// Gibt ein Array mit den Popup-Texten der aktuell auf der Map befindlichen Marker zurueck
function getMarker() {
	
	var marker = [];
	map.eachLayer(function(layer) {
		if(layer instanceof L.Marker) {
			marker.push(layer._popup._content.replace("<b>", "").replace("</b>", ""));
		}
	  });
	
	return marker;
}