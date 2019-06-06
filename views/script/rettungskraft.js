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

// Uebertragen der Informationen eines Rettungskraft-Objects in den Bearbeitungsbereich
function updateRettungskraft(id) {
	
	document.getElementById("rettungskraftNew_button").click();
	
	var rettungskraft = document.getElementById(id);
	
	document.getElementById("rettungskraft_id").value = id;
	document.getElementById("rettungskraft_vorname").value = rettungskraft.childNodes[3].childNodes[1].innerText;
	document.getElementById("rettungskraft_nachname").value = rettungskraft.childNodes[3].childNodes[3].innerText;
	document.getElementById("rettungskraft_hiorg").value = rettungskraft.childNodes[5].innerText;
	document.getElementById("rettungskraft_quali").value = longQuali(rettungskraft.childNodes[3].childNodes[5].innerText);
	document.getElementById("rettungskraft_tel").value = rettungskraft.childNodes[7].innerText;
	
	if (rettungskraft.childNodes[1].innerText != rettungskraft.childNodes[3].childNodes[1].innerText + " " + rettungskraft.childNodes[3].childNodes[3].innerText) {
	
		document.getElementById("rettungskraft_funkruf").value = rettungskraft.childNodes[1].innerText;
	}
	else {
		document.getElementById("rettungskraft_funkruf").value = "";
	}
}