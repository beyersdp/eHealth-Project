/* Moduleinbindung */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var hbs = require('express-handlebars');
var handlebars = require('handlebars');
var bcrypt = require('bcrypt');
var session = require('client-sessions');
var moment = require('moment');
var uniqueRandom = require('unique-random');
var shell = require('shelljs');



/* Server initialisieren */
var server = express();
server.set('views', path.join(__dirname, 'views'));
server.set('port', 8080);
server.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'defaultLayout', layoutsDir: __dirname + '/views/layouts/'}));
server.set('view engine', 'hbs');

server.use(express.static('views'));

var urlencodedParser = bodyParser.urlencoded({extended: false});

var mongodbClient = mongodb.MongoClient; 
var url = "mongodb://localhost:27017";
//var mongod = shell.exec('start cmd.exe /c mongod', {async: true});

server.use(session({ 
	cookieName: 'session',
	secret: 'crypto-string',
	duration: 5000*60*1000,
	activeDuration: 5*30*1000 
}));



/* Server starten */
server.listen(server.get('port'), '0.0.0.0', function() {
	console.log('L1-Info: Server started listening at ' + server.get('port'));
});



/* / - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/', function(req, res){
	console.log("L2-Info: GET-REQUEST for / ");
	res.render('login', {title: "Login - Digitaler Führungsassistent",
						 loginFalse: "",
						 registrationFalse: ""});
});



/* /login - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/login', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /login");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	mongodbClient.connect(url, function(err, dbClient) {
		if (err) throw err;
		var db = dbClient.db('DigitalerFuehrungsassistent');
		console.log("L2-Info: DB-Connection true");
		
		db.collection('Fuehrungskraft').find({mail: req.body.login_mail}).toArray(function(err, result) {
			
			if (result.length != 0 && bcrypt.compareSync(req.body.login_passwort, result[0].passwort)) {
				console.log("L1-Info: Login true");
				
				//Kontrolle, ob angegebener HiOrg-Key valide
				db.collection('HiOrgKey').find({key: req.body.login_key}).toArray(function(err, result) {
					if (result.length == 0) {
						console.log("L1-Info: HiOrg Key not valide");
						res.render('login', {title: "Login - Digitaler Führungsassistent",
											 loginFalse: "Der angegebene HiOrg-Schlüssel ist ungültig!",
											 registrationFalse: ""});
				
						dbClient.close();
					}
					
					else {
						console.log("L1-Info: HiOrg Key valide");
						
						//Cookie-Generierung
						var salt = bcrypt.genSaltSync(10);
						req.session.user = bcrypt.hashSync(req.body.login_mail, salt, function(err, hash) {
							if (err) throw err;
						});
						
						res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent"});
				
						dbClient.close();
					}
				});
				
			}
			
			else {
				console.log("L1-Info: Login false");
				res.render('login', {title: "Login - Digitaler Führungsassistent",
									 loginFalse: "Es existiert kein Konto zu diesen Daten!",
									 registrationFalse: ""});
				
				dbClient.close();
			}
		
		});
	});
	
	
});



/* /passwort_vergessen - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/passwort_vergessen', function(req, res){
	console.log("L2-Info: GET-REQUEST for /passwort_vergessen");
	
	res.render('passwort_vergessen', {title: "Neues Passwort - Digitaler Führungsassistent"});
});	



/* /passwortNEU - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/passwortNeu', urlencodedParser, function(req, res){
	console.log("L2-Info: GET-REQUEST for /passwortNEU");
	
	mongodbClient.connect(url, function(err, dbClient) {
		if (err) throw err;
		var db = dbClient.db('DigitalerFuehrungsassistent');
		console.log("L2-Info: DB-Connection true");
		
		db.collection('Fuehrungskraft').find({mail: req.body.login_mail}).toArray(function(err, db_check) {
			//Kontrolle, ob fuer die angegebene E-Mail schon ein Konto existiert, mittels Suche in der Collection

			if (db_check.length == 1 && db_check[0].tel == req.body.login_tel) {
				//Konto fuer angegebene E-Mail existiert und passt zur angegebenen Telefonnummer
				
				console.log("L1-Info: New Password true");
				
				var salt = bcrypt.genSaltSync(10);
				var new_passwort_hash = bcrypt.hashSync(req.body.login_passwort, salt, function(err, hash) {
					if (err) throw err;
				});
				
				db.collection('Fuehrungskraft').update({mail: req.body.login_mail}, {$set: {passwort: new_passwort_hash}});
				
				res.render('login', {title: "Login - Digitaler Führungsassistent",
									 loginFalse: "Ihr Passwort wurde erfolgreich geändert!",
									 registrationFalse: ""});
				
				dbClient.close();
			}	
			
			else {
				//Kein Konto unter der angegebenen Mail und Telefonnummer
				console.log("L1-Info: New Password false");
				res.render('passwort_vergessen', {title: "Neues Passwort - Digitaler Führungsassistent",
									              error: "E-Mail oder Telefonnummer sind unbekannt."});
				
				dbClient.close();
			}
		});
	});
});	



/* /registration - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/registration', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /registration");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	var salt = bcrypt.genSaltSync(10);
	var registration_passwort_hash = bcrypt.hashSync(req.body.registration_passwort, salt, function(err, hash) {
		if (err) throw err;
	});
	
	var registration_data = {titel: req.body.registration_titel,
							 vorname: req.body.registration_vorname,
							 nachname: req.body.registration_nachname,
							 quali: req.body.registration_quali,
							 hiorg: req.body.registration_hiorg,
							 mail: req.body.registration_mail,
							 tel: req.body.registration_tel,
							 passwort: registration_passwort_hash,
							 ist_EL: false};
	
	mongodbClient.connect(url, function(err, dbClient) {
		if (err) throw err;
		var db = dbClient.db('DigitalerFuehrungsassistent');
		console.log("L2-Info: DB-Connection true");
		
		db.collection('Fuehrungskraft').find({mail: req.body.registration_mail}).toArray(function(err, db_check) {
			//Kontrolle, ob fuer die angegebene E-Mail schon ein Konto existiert, mittels Suche in der Collection
			
			if (db_check.length != 0) {
				//Datenkontrollobjekt beinhaltet daten fuer die angegebene E-Mail. Es existiert somit schon ein Konto
				console.log("L1-Info: Registration false");
				res.render('login', {title: "Login - Digitaler Führungsassistent",
									 loginFalse: "",
									 registrationFalse: "Es existiert bereits ein Konto für die angegebene E-Mail!"});
				
				dbClient.close();
			}
			
			else {
				db.collection('Fuehrungskraft').insertOne(registration_data, function(err, result) {
					if (err) throw err;
					console.log("L1-Info: Registration true");
					
					//Cookie-Generierung
					var salt = bcrypt.genSaltSync(10);
					req.session.user = bcrypt.hashSync(req.body.registration_mail, salt, function(err, hash) {
						if (err) throw err;
					});
						
					res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent"});
					
					dbClient.close();
				});
			}
		});
	});
});



/* /cookietest - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/cookietest', function(req, res){
	console.log("L2-Info: GET-REQUEST for /cookietest");
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		console.log("L3-Info: Cookie = " + req.session.user);
		
		res.send(req.session.user);
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
	
});	