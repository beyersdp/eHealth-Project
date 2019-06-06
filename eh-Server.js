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
						
						db.collection('Fuehrungskraft').findOneAndUpdate({mail: req.body.login_mail}, {$set: {cookie: req.session.user}}, function(err, result) {
							if (err) throw err;
							
							db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
								if (err) throw err;
								
								db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
									if (err) throw err;
									
									db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
										if (err) throw err;
										
										db.collection('Posten').find().toArray(function(err, queryPosten) {
											if (err) throw err;
							
											res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent",
																	einsatz: queryEinsatz,
																	rettungskraft: queryRettungskrafte,
																	rettungsmittel: queryRettungsmittel,
																	posten: queryPosten,
																	fuehrungskraft_nachname: result.value.nachname,
																	fuehrungskraft_quali: result.value.quali});
								
											dbClient.close();
										});
									});
								});
							});
						});
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
				console.log("L2-Info: DB-Connection true I");
		
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, result) {
					if (err) throw err;
					
					if (Array.isArray(req.body.einsatz_kraefte)) {
						var queryArray = req.body.einsatz_kraefte;
					}
					else {
						var queryArray = req.body.einsatz_kraefte.split();
					}
					
					db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskrafte) {
						if (err) throw err;
						
						db.collection('Posten').find({funkruf: {$in: queryArray}}).toArray(function(err, queryPosten) {
							if (err) throw err;
							
							db.collection('Rettungsmittel').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungsmittel) {
								if (err) throw err;
						
								einsatz_data = {sender: req.body.einsatz_sender,
												position: req.body.einsatz_position,
												meldebild: req.body.einsatz_meldebild,
												anzVerletzte: req.body.einsatz_anzVerletzte,
												text: req.body.einsatz_text,
												status: req.body.einsatz_status,
												timestamp: moment().format('YYYYMMDDHHmmss'),
												rettungskraefte: queryRettungskrafte,
												posten: queryPosten,
												rettungsmittel: queryRettungsmittel,
												fuehrungskraft: result[0]};
					
								db.collection('Einsatz').insertOne(einsatz_data, function(err, inserted) {
									if (err) throw err;
									
									db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
										if (err) throw err;
										
										db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
											if (err) throw err;
											
											db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
												if (err) throw err;
												
												db.collection('Posten').find().toArray(function(err, queryPosten) {
													if (err) throw err;
										
													res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent",
																			einsatz: queryEinsatz,
																			rettungskraft: queryRettungskrafte,
																			rettungsmittel: queryRettungsmittel,
																			posten: queryPosten,
																			fuehrungskraft_nachname: result[0].nachname,
																			fuehrungskraft_quali: result[0].quali});
													dbClient.close();
												});
											});
										});
									});
								});
							});
						});
					});
					
					db.collection('Rettungskraft').updateMany({funkruf: {$in: queryArray}}, {$set: {rettungsmittel: true}});
				});
			});
		}
		
		else { //ein vorhandener Einsatz soll bearbeitet werden, anhand der gesendeten ID
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true II");
		
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
					
					db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
						if (err) throw err;
						
						db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
							if (err) throw err;
								
							db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
								if (err) throw err;
								
								db.collection('Posten').find().toArray(function(err, queryPosten) {
									if (err) throw err;
					
									res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
															einsatz: queryEinsatz,
															rettungskraft: queryRettungskrafte,
															rettungsmittel: queryRettungsmittel,
															posten: queryPosten,
															fuehrungskraft_nachname: result[0].nachname,
															fuehrungskraft_quali: result[0].quali});
									dbClient.close();
								});
							});
						});
					});
				});
			});
		});
	}

	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /rettungskraft - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/rettungskraft', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /rettungskraft");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		if(req.body.rettungskraft_id == "") { //eine neue Rettungskraft soll aufgenommen werden, da noch keine ID existert
		
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true");
				
				if (req.body.rettungskraft_funkruf == "") {
				
					var rettungskraft_data = {vorname: req.body.rettungskraft_vorname,
											  nachname: req.body.rettungskraft_nachname,
											  hiorg: req.body.rettungskraft_hiorg,
											  quali: req.body.rettungskraft_quali,
											  funkruf: req.body.rettungskraft_vorname + " " + req.body.rettungskraft_nachname,
											  tel: req.body.rettungskraft_tel,
											  //position: req.body.rettungskraft_position,
											  rettungsmittel: false};
				}
				
				else {
					
					var rettungskraft_data = {vorname: req.body.rettungskraft_vorname,
											  nachname: req.body.rettungskraft_nachname,
											  hiorg: req.body.rettungskraft_hiorg,
											  quali: req.body.rettungskraft_quali,
											  funkruf: req.body.rettungskraft_funkruf,
											  tel: req.body.rettungskraft_tel,
											  //position: req.body.rettungskraft_position,
											  rettungsmittel: false};
				}
										  
				db.collection('Rettungskraft').insertOne(rettungskraft_data, function(err, inserted) {
					if (err) throw err;
					
					db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
						db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
							if (err) throw err;
							
							db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
								if (err) throw err;
									
								db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
									if (err) throw err;
									
									db.collection('Posten').find().toArray(function(err, queryPosten) {
										if (err) throw err;
							
										res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskrafte,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali});
										dbClient.close();
									});
								});
							});
						});
					});
				});
			});
		}
		
		else { //eine vorhandene Rettungskraft soll bearbeitet werden, anhand der gesendeten ID
		
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true II");
				
				if (req.body.rettungskraft_funkruf == "") {
					
					var rettungskraft_data = {vorname: req.body.rettungskraft_vorname,
											  nachname: req.body.rettungskraft_nachname,
											  hiorg: req.body.rettungskraft_hiorg,
											  quali: req.body.rettungskraft_quali,
											  funkruf: req.body.rettungskraft_vorname + " " + req.body.rettungskraft_nachname,
											  tel: req.body.rettungskraft_tel};
				}
				else {
					var rettungskraft_data = {vorname: req.body.rettungskraft_vorname,
											  nachname: req.body.rettungskraft_nachname,
											  hiorg: req.body.rettungskraft_hiorg,
											  quali: req.body.rettungskraft_quali,
											  funkruf: req.body.rettungskraft_funkruf,
											  tel: req.body.rettungskraft_tel};
				}
				
				db.collection('Rettungskraft').findOneAndUpdate({_id: ObjectID(req.body.rettungskraft_id)}, {$set: rettungskraft_data}, function(err, updated){
						
					db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
						if (err) throw err;
						
						db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
							if (err) throw err;
							
							db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskraefte) {
								if (err) throw err;
								
								db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
									
									db.collection('Posten').find().toArray(function(err, queryPosten) {
										if (err) throw err;
									
										res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
														einsatz: queryEinsatz,
														rettungskraft: queryRettungskraefte,
														rettungsmittel: queryRettungsmittel,
														posten: queryPosten,
														fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
														fuehrungskraft_quali: queryFuehrungskraft[0].quali});
										dbClient.close();
									});
								});
							});
						});
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



/* /posten - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/posten', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /posten");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
	
		if(req.body.posten_id == "") { //ein neuer Sanitaetsposten soll angelegt werden, da noch keine ID existert
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true I");
				
				if (Array.isArray(req.body.posten_kraefte)) {
					var queryArray = req.body.posten_kraefte;
				}
				else {
					var queryArray = req.body.posten_kraefte.split();
				}
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskrafte) {
					
					console.log(queryRettungskrafte);
					
					posten_data = {funkruf: req.body.posten_funkruf,
								   //position: req.body.posten_position,
								   kraefte: queryRettungskrafte};
					
					db.collection('Posten').insertOne(posten_data, function(err, inserted) {
						if (err) throw err;
						
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
								if (err) throw err;
								
								db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
									if (err) throw err;
									
									db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
										if (err) throw err;
										
										db.collection('Posten').find().toArray(function(err, queryPosten) {
											if (err) throw err;
										
											res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
															einsatz: queryEinsatz,
															rettungskraft: queryRettungskrafte,
															rettungsmittel: queryRettungsmittel,
															posten: queryPosten,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
															fuehrungskraft_quali: queryFuehrungskraft[0].quali});
											dbClient.close();
										});
									});
								});
							});
						});
					});
				});
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryArray}}, {$set: {rettungsmittel: true}});
			});
		}
		
		else { //ein vorhandener Sanitaetsposten soll bearbeitet werden, anhand der gesendeten ID
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true II");
				
				if (Array.isArray(req.body.posten_kraefte)) {
					var queryArray = req.body.posten_kraefte;
				}
				else {
					var queryArray = req.body.posten_kraefte.split();
				}
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskraefte1) {
					if (err) throw err;
					
					db.collection('Posten').find({_id: ObjectID(req.body.posten_id)}).toArray(function(err, queryPosten1) {
						if (err) throw err;

						db.collection('Posten').findOneAndUpdate({_id: ObjectID(req.body.posten_id)}, {$set: {funkruf: req.body.posten_funkruf,
																													   //position: req.body.rettungsmittel_position,
																													   kraefte: queryRettungskraefte1}},
																													   function(err, updated){
							
							db.collection('Rettungskraft').updateMany({funkruf: {$in: queryPosten1[0].kraefte.filter(o => ! queryRettungskraefte1.some(i => i == o))}},
																	  {$set: {rettungsmittel: false}}, 
																	  function(err, result) {
								if (err) throw err;
								
								db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
									if (err) throw err;
									
									db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
										if (err) throw err;
										
										db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskraefte2) {
											if (err) throw err;
											
											db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
												
												db.collection('Posten').find().toArray(function(err, queryPosten2) {
													if (err) throw err;
												
													res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																			einsatz: queryEinsatz,
																			rettungskraft: queryRettungskraefte2,
																			rettungsmittel: queryRettungsmittel,
																			posten: queryPosten2,
																			fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																			fuehrungskraft_quali: queryFuehrungskraft[0].quali});
													dbClient.close();
												});
											});
										});
									});
								});
							});
						});
					});
				});
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryArray}}, {$set: {rettungsmittel: true}});
			});
		}
	
	}
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /rettungsmittel - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/rettungsmittel', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /rettungsmittel");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
	
		if(req.body.rettungsmittel_id == "") { //ein neues Rettungsmittel soll angelegt werden, da noch keine ID existert
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true I");
				
				if (Array.isArray(req.body.rettungsmittel_kraefte)) {
					var queryArray = req.body.rettungsmittel_kraefte;
				}
				else {
					var queryArray = req.body.rettungsmittel_kraefte.split();
				}
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskrafte1) {
					
					rettungsmittel_data = {art: req.body.rettungsmittel_art,
									funkruf: req.body.rettungsmittel_funkruf,
									//position: req.body.rettungsmittel_position,
									kraefte: queryRettungskrafte1};
					
					db.collection('Rettungsmittel').insertOne(rettungsmittel_data, function(err, inserted) {
						if (err) throw err;
						
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
								if (err) throw err;
								
								db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte2) {
									if (err) throw err;
									
									db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
										
										db.collection('Posten').find().toArray(function(err, queryPosten) {
											if (err) throw err;
										
											res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
															einsatz: queryEinsatz,
															rettungskraft: queryRettungskrafte2,
															rettungsmittel: queryRettungsmittel,
															posten: queryPosten,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
															fuehrungskraft_quali: queryFuehrungskraft[0].quali});
											dbClient.close();
										});
									});
								});
							});
						});
					});
				});
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryArray}}, {$set: {rettungsmittel: true}});
			});
		}
		
		else { //ein vorhandenes Rettungsmittel soll bearbeitet werden, anhand der gesendeten ID
			
			mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
				if (err) throw err;
				var db = dbClient.db('DigitalerFuehrungsassistent');
				console.log("L2-Info: DB-Connection true II");
				
				if (Array.isArray(req.body.rettungsmittel_kraefte)) {
					var queryArray = req.body.rettungsmittel_kraefte;
				}
				else {
					var queryArray = req.body.rettungsmittel_kraefte.split();
				}
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskraefte1) {
					
					db.collection('Rettungsmittel').findOneAndUpdate({_id: ObjectID(req.body.rettungsmittel_id)}, {$set: {art: req.body.rettungsmittel_art,
																														  funkruf: req.body.rettungsmittel_funkruf,
																														  //position: req.body.rettungsmittel_position,
																														  kraefte: queryRettungskraefte1}},
																														  function(err, updated){
						
						db.collection('Rettungskraft').updateMany({funkruf: {$nin: queryArray}}, {$set: {rettungsmittel: false}}, function(err, result) {
							if (err) throw err;
							
							db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
								if (err) throw err;
								
								db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
									if (err) throw err;
									
									db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskraefte2) {
										if (err) throw err;
										
										db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
											
											db.collection('Posten').find().toArray(function(err, queryPosten) {
												if (err) throw err;
											
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskraefte2,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali});
												dbClient.close();
											});
										});
									});
								});
							});
						});
					});
				});
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryArray}}, {$set: {rettungsmittel: true}});
			});
		}
	
	}
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /funkspruchCHRONIK - Empfangen eines GET-Requests ueber Port 8080  */
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



/* /mainpage - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/mainpage', function(req, res){
	console.log("L2-Info: GET-REQUEST for /mainpage");
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
		
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, result) {
				if (err) throw err;
				
				db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
					if (err) throw err;
					
					db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
						if (err) throw err;
						
						db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
							
							db.collection('Posten').find().toArray(function(err, queryPosten) {
								if (err) throw err;
									
								res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
												einsatz: queryEinsatz,
												rettungskraft: queryRettungskrafte,
												rettungsmittel: queryRettungsmittel,
												posten: queryPosten,
												fuehrungskraft_nachname: result[0].nachname,
												fuehrungskraft_quali: result[0].quali});
								dbClient.close();
							});
						});
					});
				});
			});
		});
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
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