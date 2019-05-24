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