// Aktualitaet ueberpruefen (alle 10 Sekunden)
setInterval(function checkHistory(e) {

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			console.log(this.responseText);
			
			if (this.responseText == "changed") {
				
				var audio = new Audio('sounds/reloadSound.wav');
				audio.play();
				document.getElementById("reloadButton").style.backgroundColor = "#607d8b";
			}
		}
	};
	xhttp.open("GET", "/checkHistory", true);
	xhttp.send(); 
}, 10000);