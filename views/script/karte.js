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
		iconUrl: './img/icons/marker_blue.png',
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
	else {
		return postenIcon;
	}
}

// Kontextmenu-Funktion - Marker entfernen
function markerEntfernen(e) {
	e.relatedTarget.remove();

	// TODO: Unterschieden ob Einsatz oder Rettungsmittel (DB Querys)
}

// Kontextmenu-Funktion - Karte zentrieren
function mapZentrieren (e) {
	map.panTo(e.latlng);
}

// Kontextmenu-Funktion - Position an Server senden
function positionSenden(e) {
	
	var markerName = e.relatedTarget._popup._content.replace("<b>", "").replace("</b>","");
	var markerId = document.getElementById(markerName).parentElement.id;

	var data = {'id': markerId, 'position': e.latlng};

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



/*

// dragable default Marker:
	//muss vor den Layern/Basemaps sein, ansonsten nicht sichtbar..
	var marker = L.marker([48.506939, 9.203804], {draggable: true})
		.addTo(map)
		.on('dragend', function() {
			var coord = String(marker.getLatLng()).split(',');
				var lat = coord[0].split('(');
				var lng = coord[1].split(')');
				//marker.bindPopup("Moved to: " + lat[1] + ", " + lng[0] + ".");
		});
	//Popup zu dem obigen Marker:
	marker.bindPopup("<b>Sitz der Führungskraft</b><br>J. Schuster (NFS)").openPopup();

	// Popup, wenn die Karte irgendwo angeklickt wird: -->
	//muss vor den Layern/Basemaps sein, ansonsten nicht sichtbar..
	var popup = L.popup();
	function onMapClick(e) {
		popup
			.setLatLng(e.latlng)
			.setContent("Position: " + e.latlng.toString())
			.openOn(map);
	}
	map.on('click', onMapClick);
	
	// personifizierter dragable Marker: -->
	//muss vor den Layern/Basemaps sein, ansonsten nicht sichtbar..
	var map_rtw = L.icon({
		iconUrl: './img/icons/map_rtw.png',
		//shadowUrl: 'leaf-shadow.png',

		iconSize:     [100, 47], // size of the icon
		//shadowSize:   [50, 64], // size of the shadow
		// den Anker in das Zentrum der angegebenen Pixelgroesse setzen:
		iconAnchor:   [50, 23.5], // point of the icon which will correspond to marker's location
		//shadowAnchor: [4, 62],  // the same for the shadow
		popupAnchor:  [-3, -16] // point from which the popup should open relative to the iconAnchor
	});

	var rtwMarker = L.marker([48.50, 9.18], {icon: map_rtw, draggable: true})
		.addTo(map)
		.on('dragend', function() {
			var coord = String(rtwMarker.getLatLng()).split(',');
				var lat = coord[0].split('(');
				var lng = coord[1].split(')');
				//marker.bindPopup("Moved to: " + lat[1] + ", " + lng[0] + ".");
		});
	rtwMarker.bindPopup("<b>RTW 63/23-1</b><br>Status 3");
	// End personifizierter dragable Marker 
*/