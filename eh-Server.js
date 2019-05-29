/* Moduleinbindung */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var hbs = require('express-handlebars');
var handlebars = require('handlebars');
var bcrypt = require('bcrypt');
var session = require('client-sessions');
var moment = require('moment');
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
	
	mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
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
						
						db.collection('Fuehrungskraft').findOneAndUpdate({mail: req.body.login_mail}, {$set: {cookie: req.session.user}});
						
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
	
	mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
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
				
				db.collection('Fuehrungskraft').updateOne({mail: req.body.login_mail}, {$set: {passwort: new_passwort_hash}});
				
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
							 cookie: null,
							 ist_EL: false};
	
	mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
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
						
					res.render('login', {title: "Login - Digitaler Führungsassistent",
										 loginFalse: "Login nach Registrierung nun möglich",
										 registrationFalse: ""});
					
					dbClient.close();
				});
			}
		});
	});
});



/* /einsatz - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/einsatz', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /einsatz");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		if(req.body.einsatz_id == "") { //ein neuer Einsatz soll aufgenommen werden, da noch keine ID existert
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true");
		
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, result) {
					if (err) throw err;
					
					einsatz_data = {sender: req.body.einsatz_sender,
									position: req.body.einsatz_position,
									meldebild: req.body.einsatz_meldebild,
									anzVerletzte: req.body.einsatz_anzVerletzte,
									text: req.body.einsatz_text,
									status: req.body.einsatz_status,
									timestamp: moment().format('YYYYMMDDHHmmss'),
									fuehrungskraft: result[0]};
			
					db.collection('Einsatz').insertOne(einsatz_data, function(err, inserted) {
						if (err) throw err;

						res.render('html_form_dummy', {title: "Einsatz - Digitaler Führungsassistent",
													   einsatz_id: inserted.ops[0]._id,
													   einsatz_sender: req.body.einsatz_sender,
													   einsatz_position: req.body.einsatz_position,
													   einsatz_meldebild: req.body.einsatz_meldebild,
													   einsatz_anzVerletzte: req.body.einsatz_anzVerletzte,
													   einsatz_text: req.body.einsatz_text,
													   einsatz_status: req.body.einsatz_status,
													   einsatz_timestamp: moment(inserted.ops[0].timestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'),
													   einsatz_fuehrungskraft: result[0].nachname});
						dbClient.close();
					});
				});
			});
		}
		
		else { //ein vorhandener Einsatz soll bearbeitet werden, anhand der gesendeten ID
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true");
		
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, result) {
					if (err) throw err;
			
					db.collection('Einsatz').findOneAndUpdate({_id: ObjectID(req.body.einsatz_id)}, {$set: {sender: req.body.einsatz_sender,
																						position: req.body.einsatz_position,
																						meldebild: req.body.einsatz_meldebild,
																						anzVerletzte: req.body.einsatz_anzVerletzte,
																						text: req.body.einsatz_text,
																						status: req.body.einsatz_status,
																						fuehrungskraft: result[0]}}, function(err, updated){

						res.render('html_form_dummy', {title: "Einsatz - Digitaler Führungsassistent",
													   einsatz_id: req.body.einsatz_id,
													   einsatz_sender: req.body.einsatz_sender,
													   einsatz_position: req.body.einsatz_position,
													   einsatz_meldebild: req.body.einsatz_meldebild,
													   einsatz_anzVerletzte: req.body.einsatz_anzVerletzte,
													   einsatz_text: req.body.einsatz_text,
													   einsatz_status: req.body.einsatz_status,
													   einsatz_timestamp: moment(updated.value.timestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'),
													   einsatz_fuehrungskraft: result[0].nachname});
						dbClient.close();
					});
				});
			});
		}
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /funkspruch - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/funkspruch', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /funkspruch");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
	
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, result) {
				if (err) throw err;
				
				funkspruch_data = {sender: req.body.funkspruch_sender,
								empfaenger: req.body.funkspruch_empfaenger,
								kategorie: req.body.funkspruch_kategorie,
								text: req.body.funkspruch_text,
								timestamp: moment().format('YYYYMMDDHHmmss'),
								fuehrungskraft: result[0]};
		
				db.collection('Funkspruch').insertOne(funkspruch_data, function(err, inserted) {
					if (err) throw err;
				
					res.render('html_form_dummy', {title: "Einsatz Funk - Digitaler Führungsassistent",});
					dbClient.close();
				});
			});
		});
	}

	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /funkspruchCHRONIK - Empfangen eines POST-Requests ueber Port 8080  */
server.get('/funkspruchCHRONIK', function(req, res){
	console.log("L2-Info: GET-REQUEST for /funkspruchCHRONIK");
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
	
		db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, result) {
				if (err) throw err;
				
				res.render('html_form_dummy', {funkspruch: result});
				dbClient.close();
			});
		});
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
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



/* /mainpagetest - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/mainpagetest', function(req, res){
	console.log("L2-Info: GET-REQUEST for /mainpagetest");
	
	res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent"});
	
});	



/* /formtest - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/formtest', function(req, res){
	console.log("L2-Info: GET-REQUEST for /formtest");
	
	res.render('html_form_dummy');
	
});	


/* Relevant fuer umfassendere Routing-Aufgaben */
var cb1 = function (req, res, next) {
	console.log("CB1");
	
	mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			dbClient.close();
			next();
	});
}
var cb2 = function (req, res, next) {
	console.log("CB2");
	req.gehtdas = "ja";
	next();
}
var cb3 = function (req, res) {
	console.log("CB3");
	console.log(req.gehtdas);
	res.send("klappt...")
}

server.get('/routentest', [cb1, cb2, cb3]);