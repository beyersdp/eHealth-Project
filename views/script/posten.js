// Uebertragen der Informationen eines Posten-Objects in den Bearbeitungsbereich
function updatePosten(id) {
	
	document.getElementById("postenNew_button").click();
	
	var posten = document.getElementById(id);
	document.getElementById("posten_id").value = id;
	document.getElementById("posten_funkruf").value = posten.childNodes[1].innerText;
	
	for (var i = 3; i < posten.childNodes.length; i+=2) {
		
		if (i != 3) {
			document.getElementById("posten_addInputField").click();
		}
	}
	
	var inputElements = document.getElementsByClassName("posten_kraefte");
	console.log(inputElements);
	var index = 3;
	
	for (var i = 0; i < inputElements.length; i++) {

		inputElements[i].value = posten.childNodes[index].childNodes[1].data.slice(0,-1)
		index += 2;
	}
}