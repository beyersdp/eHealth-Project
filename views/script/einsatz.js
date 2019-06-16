// Uebertragen der Informationen eines Einsatz-Objects in den Bearbeitungsbereich
function updateEinsatz(id) {
	
	document.getElementById("einsatzNew_button").click();
	
	var einsatz = document.getElementById(id);
	document.getElementById("einsatz_id").value = id;
	document.getElementById("einsatz_sender").value = einsatz.childNodes[9].innerText;
	document.getElementById("einsatz_meldebild").value = einsatz.childNodes[1].innerText;
	document.getElementById("einsatz_text").value = einsatz.childNodes[11].innerText;
	document.getElementById("einsatz_status").value = einsatz.childNodes[5].innerText;
	document.getElementById("einsatz_verbleibPatient").value = einsatz.childNodes[13].innerText.slice(0,-1);

	for (var i = 15; i < einsatz.childNodes.length; i+=2) {
		
		if (i != 15) {
			document.getElementById("einsatz_addInputField").click();
		}
	}
	
	var inputElements = document.getElementsByClassName("einsatz_kraefte");
	var index = 15;
	
	for (var i = 0; i < inputElements.length; i++) {

		inputElements[i].value = einsatz.childNodes[index].childNodes[1].data.slice(0,-1);
		index += 2;
	}
	
}