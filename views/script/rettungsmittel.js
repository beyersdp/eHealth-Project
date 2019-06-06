// Uebertragen der Informationen eines Rettungsmittel-Objects in den Bearbeitungsbereich
function updateRettungsmittel(id) {
	
	document.getElementById("rettungsmittelNew_button").click();
	
	var rettungsmittel = document.getElementById(id);
	
	document.getElementById("rettungsmittel_id").value = id;
	document.getElementById("rettungsmittel_art").value = rettungsmittel.childNodes[3].childNodes[1].data;
	document.getElementById("rettungsmittel_funkruf").value = rettungsmittel.childNodes[1].innerText;
	
	for (var i = 5; i < rettungsmittel.childNodes.length; i+=2) {
		
		if (i != 5) {
			document.getElementById("rettungsmittel_addInputField").click();
		}
	}
	
	var inputElements = document.getElementsByClassName("rettungsmittel_kraefte");
	var index = 5;
	
	for (var i = 0; i < inputElements.length; i++) {

		inputElements[i].value = rettungsmittel.childNodes[index].childNodes[1].data.slice(0,-1)
		index += 2;
	}
}
