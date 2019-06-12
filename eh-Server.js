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



// Ereignis der Historie hinzufuegen
function addHistory(args) {	
	console.log("L2-Info: Create history entry");
	
	var kraefte_grouping = "";
	
	if (args.rettungskraefte != [] && args.rettungskraefte != undefined) {
		args.rettungskraefte.forEach(function (rk) {
			kraefte_grouping += rk.funkruf +", ";
		});
	}
	
	if (args.posten != [] && args.posten != undefined) {
		args.posten.forEach(function (p) {
			kraefte_grouping += p.funkruf +" (";
			
			p.kraefte.forEach(function (k) {
				kraefte_grouping += k.vorname[0] + ". " + k.nachname + ", ";
			});
			kraefte_grouping += "), "
		});	
	}
	
	if (args.rettungsmittel != [] && args.rettungsmittel != undefined) {
		args.rettungsmittel.forEach(function (rm) {
			kraefte_grouping += rm.funkruf +" (";
			
			rm.kraefte.forEach(function (k) {
				kraefte_grouping += k.vorname[0] + ". " + k.nachname + ", ";
			});
			kraefte_grouping += "), "
		});
	}
	
	if (args.ereignis == "Funkspruch") {
		var ereignis_grouping = args.ereignis + " von [" + args.sender + "] an [" + args.empfaenger + "]. "
								+ "Zum Thema [" + args.kategorie + "] folgende Kommunikation: " + args.text;
	}
	
	if (args.ereignis == "Notfalleinsatz") {
		var ereignis_grouping = args.ereignis + " " + args.meldebild + " (gemeldet durch " + args.sender + "). Anzahl verletzter Personen = " + args.anzVerletzte
								+ "\nDerzeitiger Bearbeitungsgrad = " + args.status + "\nDerzeitige zugeteilte Kräfte = " + kraefte_grouping.slice(0,-2)
								+ "\nDerzeitige Anmerkungen: " + args.text;
	}
	
	if (args.ereignis == "Rettungskraft hat Ihre Schicht begonnen") {
		var ereignis_grouping = args.ereignis + ":\n" + args.vorname + " " + args.nachname + " (" + args.quali + ")\nHilfsorganisation: " + args.hiorg
								+ "\nErreichbarkeiten: Telefonnummer = " + args.tel + ", Funkrufname = " + args.funkruf;
	}
	
	if (args.ereignis == "Personaldaten einer Rettungskraft wurden bearbeitet") {
		var ereignis_grouping = args.ereignis + ":\n" + args.vorname + " " + args.nachname + " (" + args.quali + ")\nHilfsorganisation: " + args.hiorg
								+ "\nErreichbarkeiten: Telefonnummer = " + args.tel + ", Funkrufname = " + args.funkruf;
	}
	
	if (args.ereignis == "Sanitätsposten wurde erstellt") {
		var ereignis_grouping = args.ereignis + ": " + args.funkruf + "\nDerzeitige zugeteilte Kräfte = " + kraefte_grouping.slice(0,-2);
	}
	
	if (args.ereignis == "Sanitätsposten wurde bearbeitet") {
		var ereignis_grouping = args.ereignis + ": " + args.funkruf + "\nDerzeitige zugeteilte Kräfte = " + kraefte_grouping.slice(0,-2);
	}
	
	if (args.ereignis == "Fahrzeug wurde besetzt") {
		var ereignis_grouping = args.ereignis + ": " + args.funkruf + " (" + args.art + ")\nDerzeitige zugeteilte Kräfte = " + kraefte_grouping.slice(0,-2);
	}
	
	if (args.ereignis == "Fahrzeug-Konstellation wurde angepasst") {
		var ereignis_grouping = args.ereignis + ": " + args.funkruf + " (" + args.art + ")\nDerzeitige zugeteilte Kräfte = " + kraefte_grouping.slice(0,-2);
	}
	
	if (args.ereignis == "Standort aktualisiert") {
		var ereignis_grouping = args.ereignis + ": " + args.funkruf + " befindet sich nun an den Koordinaten (" + args.position.lat + ", " + args.position.lng + ")";
	}
	
	if (args.ereignis == "hat den Dienst beendet") {
		var ereignis_grouping = args.funkruf + " " + args.ereignis;
	}
	
	if (args.ereignis == "wurde stillgelegt") {
		var ereignis_grouping = args.funkruf + " " + args.ereignis;
	}
	
	if (args.ereignis == "Einsatzleiters gewählt") {
		var ereignis_grouping = args.fuehrungskraft_vorname + " " + args.fuehrungskraft_nachname + " hat die Position des " + args.ereignis;
	}
	
	if (args.ereignis == "Fuehrungsassistenten gewählt") {
		var ereignis_grouping = args.fuehrungskraft_vorname + " " + args.fuehrungskraft_nachname + " hat die Position des " + args.ereignis;
	}
	
	console.log(ereignis_grouping);
	
	var history_data = {timestamp: moment().format('YYYYMMDDHHmmss'),
						ereignis: ereignis_grouping,
						fuehrungskraft: args.fuehrungskraft_nachname};
	
	mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
		if (err) throw err;
		var db = dbClient.db('DigitalerFuehrungsassistent');
		console.log("L2-Info: DB-Connection true");
		
		db.collection('Historie').insertOne(history_data, function(err, result) {
			if (err) throw err;
		});
		
		db.collection('Fuehrungskraft').findOneAndUpdate({cookie: args.fuehrungskraft_cookie}, {$set: {lastHistory: ereignis_grouping}}, function(err, updated) {
			if (err) throw err;
			dbClient.close();
		});
	});
}



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
		
		db.collection('Fuehrungskraft').find({mail: req.body.login_mail}).toArray(function(err, queryFuehrungskraft) {
			
			if (queryFuehrungskraft.length != 0 && bcrypt.compareSync(req.body.login_passwort, queryFuehrungskraft[0].passwort)) {
				console.log("L1-Info: Login true");
				
				//Kontrolle, ob angegebener HiOrg-Key valide
				db.collection('HiOrgKey').find({key: req.body.login_key}).toArray(function(err, queryFuehrungskraft) {
					if (queryFuehrungskraft.length == 0) {
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
						
						db.collection('Fuehrungskraft').findOneAndUpdate({mail: req.body.login_mail}, {$set: {cookie: req.session.user}}, function(err, queryFuehrungskraft) {
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
																	fuehrungskraft_nachname: queryFuehrungskraft.value.nachname,
																	fuehrungskraft_quali: queryFuehrungskraft.value.quali});
								
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



/* /el - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/el', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /el");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			if (req.body.fuehrungsposten == 'einsatzleiter') {
			
				db.collection('Fuehrungskraft').findOneAndUpdate({cookie: req.session.user}, {$set: {ist_EL: true, set_EL: true}}, function(err, updated) {
					if (err) throw err;
				});
			}
			
			else {
				db.collection('Fuehrungskraft').findOneAndUpdate({cookie: req.session.user}, {$set: {ist_EL: false, set_EL: true}}, function(err, updated) {
					if (err) throw err;
				});
			}
			
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
				if (err) throw err;
				
				db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
					if (err) throw err;
					
					db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
						if (err) throw err;
						
						db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
							
							db.collection('Posten').find().toArray(function(err, queryPosten) {
								if (err) throw err;
								
								db.collection('Notiz').find().toArray(function(err, queryNotiz) {
									
									db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
										if (req.body.fuehrungsposten == 'einsatzleiter') {
											addHistory({ereignis: "Einsatzleiters gewählt", fuehrungskraft_vorname: queryFuehrungskraft[0].vorname,
														fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
										}
										
										else { 
											addHistory({ereignis: "Fuehrungsassistenten gewählt", fuehrungskraft_vorname: queryFuehrungskraft[0].vorname,
														fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
										}
										
										res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
														einsatz: queryEinsatz,
														rettungskraft: queryRettungskrafte,
														rettungsmittel: queryRettungsmittel,
														posten: queryPosten,
														notiz: queryNotiz,
														funkspruch: queryFunkspruch,
														fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
														fuehrungskraft_quali: queryFuehrungskraft[0].quali,
														fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
														fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
														fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
														fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
														
										dbClient.close();
									});
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




/* /elNEW - Empfangen eines POST-Requests ueber Port 8080  */
server.get('/elNEW', function(req, res){
	console.log("L2-Info: POST-REQUEST for /elNEW");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			
			db.collection('Fuehrungskraft').findOneAndUpdate({cookie: req.session.user}, {$set: {set_EL: false}}, function(err, updated) {
				if (err) throw err;
			
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
					
					db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
						if (err) throw err;
						
						db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
							if (err) throw err;
							
							db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
								
								db.collection('Posten').find().toArray(function(err, queryPosten) {
									if (err) throw err;
									
									db.collection('Notiz').find().toArray(function(err, queryNotiz) {
										
										db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
											res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
															einsatz: queryEinsatz,
															rettungskraft: queryRettungskrafte,
															rettungsmittel: queryRettungsmittel,
															posten: queryPosten,
															notiz: queryNotiz,
															funkspruch: queryFunkspruch,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
															fuehrungskraft_quali: queryFuehrungskraft[0].quali,
															fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
															fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
															fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
															fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
															
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
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
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
		
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
					
					if (Array.isArray(req.body.einsatz_kraefte)) {
						var queryArray = req.body.einsatz_kraefte;
					}
					else {
						var queryArray = req.body.einsatz_kraefte.split();
					}
					
					db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskrafte1) {
						if (err) throw err;
						
						db.collection('Posten').find({funkruf: {$in: queryArray}}).toArray(function(err, queryPosten1) {
							if (err) throw err;
							
							db.collection('Rettungsmittel').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungsmittel1) {
								if (err) throw err;
						
								einsatz_data = {sender: req.body.einsatz_sender,
												meldebild: req.body.einsatz_meldebild,
												anzVerletzte: req.body.einsatz_anzVerletzte,
												text: req.body.einsatz_text,
												status: req.body.einsatz_status,
												timestamp: moment().format('YYYYMMDDHHmmss'),
												rettungskraefte: queryRettungskrafte1,
												posten: queryPosten1,
												rettungsmittel: queryRettungsmittel1,
												fuehrungskraft: queryFuehrungskraft[0]};
					
								db.collection('Einsatz').insertOne(einsatz_data, function(err, inserted) {
									if (err) throw err;
									
									db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
										if (err) throw err;
										
										db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte2) {
											if (err) throw err;
											
											db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel2) {
												if (err) throw err;
												
												db.collection('Posten').find().toArray(function(err, queryPosten2) {
													if (err) throw err;
													
													db.collection('Notiz').find().toArray(function(err, queryNotiz) {
														
														db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
													
															addHistory({ereignis: "Notfalleinsatz", sender: req.body.einsatz_sender, meldebild: req.body.einsatz_meldebild,
																		anzVerletzte: req.body.einsatz_anzVerletzte, status: req.body.einsatz_status, text: req.body.einsatz_text,
																		rettungskraefte: queryRettungskrafte1, posten: queryPosten1, rettungsmittel: queryRettungsmittel1,
																		fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user})
															
															res.render('mainpage', {title: "Einsatz - Digitaler Führungsassistent",
																					einsatz: queryEinsatz,
																					rettungskraft: queryRettungskrafte2,
																					rettungsmittel: queryRettungsmittel2,
																					posten: queryPosten2,
																					notiz: queryNotiz,
																					funkspruch: queryFunkspruch,
																					fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																					fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																					fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																					fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																					fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																					fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
		
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
			
					db.collection('Einsatz').findOneAndUpdate({_id: ObjectID(req.body.einsatz_id)}, {$set: {sender: req.body.einsatz_sender,
																						position: req.body.einsatz_position,
																						meldebild: req.body.einsatz_meldebild,
																						anzVerletzte: req.body.einsatz_anzVerletzte,
																						text: req.body.einsatz_text,
																						status: req.body.einsatz_status,
																						fuehrungskraft: queryFuehrungskraft[0]}}, function(err, updated){
																							
						addHistory({ereignis: "Notfalleinsatz", sender: req.body.einsatz_sender, meldebild: req.body.einsatz_meldebild,
																anzVerletzte: req.body.einsatz_anzVerletzte, status: req.body.einsatz_status, text: req.body.einsatz_text,
																rettungskraefte: queryRettungskrafte1, posten: queryPosten1, rettungsmittel: queryRettungsmittel1,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user})

						res.render('html_form_dummy', {title: "Einsatz - Digitaler Führungsassistent",
													   einsatz_id: req.body.einsatz_id,
													   einsatz_sender: req.body.einsatz_sender,
													   einsatz_position: req.body.einsatz_position,
													   einsatz_meldebild: req.body.einsatz_meldebild,
													   einsatz_anzVerletzte: req.body.einsatz_anzVerletzte,
													   einsatz_text: req.body.einsatz_text,
													   einsatz_status: req.body.einsatz_status,
													   einsatz_timestamp: moment(updated.value.timestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'),
													   einsatz_fuehrungskraft: queryFuehrungskraft[0].nachname});
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
	
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
				if (err) throw err;
				
				funkspruch_data = {sender: req.body.funkspruch_sender,
								   empfaenger: req.body.funkspruch_empfaenger,
								   kategorie: req.body.funkspruch_kategorie,
								   text: req.body.funkspruch_text,
								   timestamp: moment().format('YYYYMMDDHHmmss'),
								   fuehrungskraft: queryFuehrungskraft[0]};
		
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
									
									db.collection('Notiz').find().toArray(function(err, queryNotiz) {
										
										db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
									
											addHistory({ereignis: "Funkspruch", sender: req.body.funkspruch_sender, 
													   empfaenger: req.body.funkspruch_empfaenger, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, 
													   kategorie: req.body.funkspruch_kategorie, text: req.body.funkspruch_text, fuehrungskraft_cookie: req.session.user});
													   
											res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																	einsatz: queryEinsatz,
																	rettungskraft: queryRettungskrafte,
																	rettungsmittel: queryRettungsmittel,
																	posten: queryPosten,
																	notiz: queryNotiz,
																	funkspruch: queryFunkspruch,
																	fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																	fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																	fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																	fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																	fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																	fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
											  rettungsmittel: false};
					
					
				}
				
				else {
					
					var rettungskraft_data = {vorname: req.body.rettungskraft_vorname,
											  nachname: req.body.rettungskraft_nachname,
											  hiorg: req.body.rettungskraft_hiorg,
											  quali: req.body.rettungskraft_quali,
											  funkruf: req.body.rettungskraft_funkruf,
											  tel: req.body.rettungskraft_tel,
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
										
										db.collection('Notiz').find().toArray(function(err, queryNotiz) {
											
											db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
												if (req.body.rettungskraft_funkruf == "") {
													addHistory({ereignis: "Rettungskraft hat Ihre Schicht begonnen", vorname: req.body.rettungskraft_vorname,
																nachname: req.body.rettungskraft_nachname, hiorg: req.body.rettungskraft_hiorg, quali: req.body.rettungskraft_quali, 
																funkruf: req.body.rettungskraft_vorname + " " + req.body.rettungskraft_nachname,
																tel: req.body.rettungskraft_tel, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												}
												
												else {
													addHistory({ereignis: "Rettungskraft hat Ihre Schicht begonnen", vorname: req.body.rettungskraft_vorname, 
																nachname: req.body.rettungskraft_nachname, hiorg: req.body.rettungskraft_hiorg, quali: req.body.rettungskraft_quali, 
																funkruf: req.body.rettungskraft_funkruf, tel: req.body.rettungskraft_tel,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												}
												
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																		einsatz: queryEinsatz,
																		rettungskraft: queryRettungskrafte,
																		rettungsmittel: queryRettungsmittel,
																		posten: queryPosten,
																		notiz: queryNotiz,
																		funkspruch: queryFunkspruch,
																		fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																		fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																		fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																		fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																		fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																		fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
										
										db.collection('Notiz').find().toArray(function(err, queryNotiz) {
											
											db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
												if (req.body.rettungskraft_funkruf == "") {
													addHistory({ereignis: "Personaldaten einer Rettungskraft wurden bearbeitet", vorname: req.body.rettungskraft_vorname,
																nachname: req.body.rettungskraft_nachname, hiorg: req.body.rettungskraft_hiorg, quali: req.body.rettungskraft_quali, 
																funkruf: req.body.rettungskraft_vorname + " " + req.body.rettungskraft_nachname,
																tel: req.body.rettungskraft_tel, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												}
												
												else {
													addHistory({ereignis: "Personaldaten einer Rettungskraft wurden bearbeitet", vorname: req.body.rettungskraft_vorname, 
																nachname: req.body.rettungskraft_nachname, hiorg: req.body.rettungskraft_hiorg, quali: req.body.rettungskraft_quali, 
																funkruf: req.body.rettungskraft_funkruf, tel: req.body.rettungskraft_tel,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												}
												
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskraefte,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten,
																notiz: queryNotiz,
																funkspruch: queryFunkspruch,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskraefte1) {
					
					posten_data = {funkruf: req.body.posten_funkruf,
								   kraefte: queryRettungskraefte1};
					
					db.collection('Posten').insertOne(posten_data, function(err, inserted) {
						if (err) throw err;
						
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
								if (err) throw err;
								
								db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskraefte2) {
									if (err) throw err;
									
									db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
										if (err) throw err;
										
										db.collection('Posten').find().toArray(function(err, queryPosten) {
											if (err) throw err;
											
											db.collection('Notiz').find().toArray(function(err, queryNotiz) {
												
												db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
											
													addHistory({ereignis: "Sanitätsposten wurde erstellt", funkruf: req.body.posten_funkruf, rettungskraefte: queryRettungskraefte1,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user})
													
													res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																	einsatz: queryEinsatz,
																	rettungskraft: queryRettungskraefte2,
																	rettungsmittel: queryRettungsmittel,
																	posten: queryPosten,
																	notiz: queryNotiz,
																	funkspruch: queryFunkspruch,
																	fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																	fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																	fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																	fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																	fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																	fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
																													   kraefte: queryRettungskraefte1}},
																													   function(err, updated){
							
							var toChange = queryPosten1[0].kraefte.map(x => x.funkruf).filter(function(kraft){ if(queryRettungskraefte1.map(x => x.funkruf).includes(kraft)){} else {return kraft;}});
							
							db.collection('Rettungskraft').updateMany({funkruf: {$in: toChange}},
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
													
													db.collection('Notiz').find().toArray(function(err, queryNotiz) {
														
														db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
													
															addHistory({ereignis: "Sanitätsposten wurde bearbeitet", funkruf: req.body.posten_funkruf, rettungskraefte: queryRettungskraefte1,
																		fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user})
															
															res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																					einsatz: queryEinsatz,
																					rettungskraft: queryRettungskraefte2,
																					rettungsmittel: queryRettungsmittel,
																					posten: queryPosten2,
																					notiz: queryNotiz,
																					funkspruch: queryFunkspruch,
																					fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																					fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																					fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																					fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																					fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																					fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
				
				db.collection('Rettungskraft').find({funkruf: {$in: queryArray}}).toArray(function(err, queryRettungskraefte1) {
					
					rettungsmittel_data = {art: req.body.rettungsmittel_art,
									funkruf: req.body.rettungsmittel_funkruf,
									kraefte: queryRettungskraefte1};
					
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
											
											db.collection('Notiz').find().toArray(function(err, queryNotiz) {
												
												db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
											
													addHistory({ereignis: "Fahrzeug wurde besetzt", funkruf: req.body.rettungsmittel_funkruf, art: req.body.rettungsmittel_art,
																rettungskraefte: queryRettungskraefte1, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
													
													res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																	einsatz: queryEinsatz,
																	rettungskraft: queryRettungskrafte2,
																	rettungsmittel: queryRettungsmittel,
																	posten: queryPosten,
																	notiz: queryNotiz,
																	funkspruch: queryFunkspruch,
																	fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																	fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																	fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																	fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																	fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																	fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
						if (err) throw err;
					
					db.collection('Rettungsmittel').find({_id: ObjectID(req.body.rettungsmittel_id)}).toArray(function(err, queryRettungsmittel1) {
						if (err) throw err;
					
						db.collection('Rettungsmittel').findOneAndUpdate({_id: ObjectID(req.body.rettungsmittel_id)}, {$set: {art: req.body.rettungsmittel_art,
																															  funkruf: req.body.rettungsmittel_funkruf,
																															  kraefte: queryRettungskraefte1}},
																															  function(err, updated){
							
							var toChange = queryRettungsmittel1[0].kraefte.map(x => x.funkruf).filter(function(kraft){ if(queryRettungskraefte1.map(x => x.funkruf).includes(kraft)){} else {return kraft;}});
							
							db.collection('Rettungskraft').updateMany({funkruf: {$in: toChange}}, {$set: {rettungsmittel: false}}, function(err, result) {
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
													
													db.collection('Notiz').find().toArray(function(err, queryNotiz) {
														
														db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
												
															addHistory({ereignis: "Fahrzeug-Konstellation wurde angepasst", funkruf: req.body.rettungsmittel_funkruf, art: req.body.rettungsmittel_art,
																	rettungskraefte: queryRettungskraefte1, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
															
															res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																			einsatz: queryEinsatz,
																			rettungskraft: queryRettungskraefte2,
																			rettungsmittel: queryRettungsmittel,
																			posten: queryPosten,
																			notiz: queryNotiz,
																			funkspruch: queryFunkspruch,
																			fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																			fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																			fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																			fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																			fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																			fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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



/* /rettungskraftDel - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/rettungskraftDel', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /rettungskraftDel");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Rettungskraft').find({_id: ObjectID(req.body.rettungskraft_id)}).toArray(function(err, queryRettungskraefte1) {
				if (err) throw err;
			
				db.collection('Rettungskraft').deleteOne({_id: ObjectID(req.body.rettungskraft_id)}, function(err, deleted) {
					if (err) throw err;
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
					
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte2) {
								if (err) throw err;
								
								db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
									
									db.collection('Posten').find().toArray(function(err, queryPosten) {
										if (err) throw err;
										
										db.collection('Notiz').find().toArray(function(err, queryNotiz) {
											
											db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
									
												addHistory({ereignis: "hat den Dienst beendet", funkruf: queryRettungskraefte1[0].funkruf,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskrafte2,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten,
																notiz: queryNotiz,
																funkspruch: queryFunkspruch,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
		});
	}
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /postenDel - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/postenDel', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /postenDel");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Posten').find({_id: ObjectID(req.body.posten_id)}).toArray(function(err, queryPosten1) {
				if (err) throw err;
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryPosten1[0].kraefte.map(x => x.funkruf)}}, {$set: {rettungsmittel: false, position: queryPosten1[0].position}});   
			
				db.collection('Posten').deleteOne({_id: ObjectID(req.body.posten_id)}, function(err, deleted) {
					if (err) throw err;
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
					
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
								if (err) throw err;
								
								db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
									
									db.collection('Posten').find().toArray(function(err, queryPosten2) {
										if (err) throw err;
										
										db.collection('Notiz').find().toArray(function(err, queryNotiz) {
											
											db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
											
												addHistory({ereignis: "wurde stillgelegt", funkruf: queryPosten1[0].funkruf,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskrafte,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten2,
																notiz: queryNotiz,
																funkspruch: queryFunkspruch,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
		});
	}
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /rettungsmittelDel - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/rettungsmittelDel', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /rettungsmittelnDel");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Rettungsmittel').find({_id: ObjectID(req.body.rettungsmittel_id)}).toArray(function(err, queryRettungsmittel1) {
				if (err) throw err;
				
				db.collection('Rettungskraft').updateMany({funkruf: {$in: queryRettungsmittel1[0].kraefte.map(x => x.funkruf)}}, {$set: {rettungsmittel: false,position: queryRettungsmittel1[0].position}});   
			
				db.collection('Rettungsmittel').deleteOne({_id: ObjectID(req.body.rettungsmittel_id)}, function(err, deleted) {
					if (err) throw err;
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
					if (err) throw err;
					
						db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
							if (err) throw err;
							
							db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
								if (err) throw err;
								
								db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
									
									db.collection('Posten').find().toArray(function(err, queryPosten2) {
										if (err) throw err;
										
										db.collection('Notiz').find().toArray(function(err, queryNotiz) {
											
											db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
												addHistory({ereignis: "wurde stillgelegt", funkruf: queryRettungsmittel1[0].funkruf,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
												
												res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
																einsatz: queryEinsatz,
																rettungskraft: queryRettungskrafte,
																rettungsmittel: queryRettungsmittel,
																posten: queryPosten2,
																notiz: queryNotiz,
																funkspruch: queryFunkspruch,
																fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
																fuehrungskraft_quali: queryFuehrungskraft[0].quali,
																fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
																fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
																fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
																fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
		});
	}
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /position - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/position', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /position");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		//Preprocessing / Formatieren von JSON-Objekten
		var rawData = null;
		for (var k in req.body) rawData = k;
		var validData = JSON.parse(rawData);
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Rettungsmittel').findOneAndUpdate({_id: ObjectID(validData.id)}, {$set: {position: validData.position}}, function(err, updated){
				
				if (updated.value != null) {
					res.send('OK');
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
						if (err) throw err;
						
						addHistory({ereignis: "Standort aktualisiert", funkruf: updated.value.funkruf, position: validData.position, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
						dbClient.close();
					});
				}
			});
			
			db.collection('Posten').findOneAndUpdate({_id: ObjectID(validData.id)}, {$set: {position: validData.position}}, function(err, updated){
				
				if (updated.value != null) {
					res.send('OK');
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
						if (err) throw err;

						addHistory({ereignis: "Standort aktualisiert", funkruf: updated.value.funkruf, position: validData.position, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
						dbClient.close();
					});
				}
			});
			
			db.collection('Rettungskraft').findOneAndUpdate({_id: ObjectID(validData.id)}, {$set: {position: validData.position}}, function(err, updated){
				
				if (updated.value != null) {
					res.send('OK');
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
						if (err) throw err;
						
						addHistory({ereignis: "Standort aktualisiert", funkruf: updated.value.funkruf, position: validData.position, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
						dbClient.close();
					});
				}
			});
			
			db.collection('Einsatz').findOneAndUpdate({_id: ObjectID(validData.id)}, {$set: {position: validData.position}}, function(err, updated){
				
				if (updated.value != null) {
					res.send('OK');
					
					db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
						if (err) throw err;
						
						addHistory({ereignis: "Standort aktualisiert", funkruf: updated.value.meldebild, position: validData.position, fuehrungskraft_nachname: queryFuehrungskraft[0].nachname, fuehrungskraft_cookie: req.session.user});
						dbClient.close();
					});
				}
			});
		});
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});



/* /notizNew - Empfangen eines POST-Requests ueber Port 8080  */
server.post('/notizNew', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /notizNew");
	//console.log(req.body); //DEBUG Kontrollausgabe

	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Notiz').insertOne(req.body, function(err, inserted) {
				if (err) throw err;
				
				db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
				if (err) throw err;
				
					db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
						if (err) throw err;
						
						db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
							if (err) throw err;
							
							db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
								
								db.collection('Posten').find().toArray(function(err, queryPosten) {
									if (err) throw err;
									
									db.collection('Notiz').find().toArray(function(err, queryNotiz) {
										
										db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
										
											res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
															einsatz: queryEinsatz,
															rettungskraft: queryRettungskrafte,
															rettungsmittel: queryRettungsmittel,
															posten: queryPosten,
															notiz: queryNotiz,
															funkspruch: queryFunkspruch,
															fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
															fuehrungskraft_quali: queryFuehrungskraft[0].quali,
															fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
															fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
															fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
															fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
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
		
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
				if (err) throw err;
				
				db.collection('Einsatz').find().sort({timestamp: 1}).toArray(function(err, queryEinsatz) {
					if (err) throw err;
					
					db.collection('Rettungskraft').find({rettungsmittel: false}).toArray(function(err, queryRettungskrafte) {
						if (err) throw err;
						
						db.collection('Rettungsmittel').find().toArray(function(err, queryRettungsmittel) {
							
							db.collection('Posten').find().toArray(function(err, queryPosten) {
								if (err) throw err;
								
								db.collection('Notiz').find().toArray(function(err, queryNotiz) {
									
									db.collection('Funkspruch').find().sort({timestamp: 1}).toArray(function(err, queryFunkspruch) {
									
										res.render('mainpage', {title: "Hauptseite - Digitaler Führungsassistent",
														einsatz: queryEinsatz,
														rettungskraft: queryRettungskrafte,
														rettungsmittel: queryRettungsmittel,
														posten: queryPosten,
														notiz: queryNotiz,
														funkspruch: queryFunkspruch,
														fuehrungskraft_nachname: queryFuehrungskraft[0].nachname,
														fuehrungskraft_quali: queryFuehrungskraft[0].quali,
														fuehrungskraft_mapstate: queryFuehrungskraft[0].position,
														fuehrungskraft_mapzoom: queryFuehrungskraft[0].zoom,
														fuehrungskraft_istEL: queryFuehrungskraft[0].ist_EL,
														fuehrungskraft_setEL: queryFuehrungskraft[0].set_EL});
														
										dbClient.close();
									});
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



/* /checkHistory - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/checkHistory', function(req, res){
	console.log("L2-Info: GET-REQUEST for /checkHistory");
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
			
			db.collection('Fuehrungskraft').find({cookie: req.session.user}).toArray(function(err, queryFuehrungskraft) {
				if (err) throw err;
			
				db.collection('Historie').find().sort({timestamp: -1}).toArray(function(err, queryHistorie) {
					if (err) throw err;
					
					if (queryHistorie.length > 0) {
					
						if (queryFuehrungskraft[0].lastHistory == queryHistorie[0].ereignis) {
							res.send("noChange");
							dbClient.close();
						}
						else {
							res.send("changed");
							
							db.collection('Fuehrungskraft').findOneAndUpdate({cookie: req.session.user}, {$set: {lastHistory: queryHistorie[0].ereignis}}, function(err, updated) {
								if (err) throw err;
								dbClient.close();
							});
						}
					}
					
					else {
						res.send("noChange");
						dbClient.close();
					}
				});
			});
		});
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});	



/* /mapstate- Empfangen eines POST-Requests ueber Port 8080  */
server.post('/mapstate', urlencodedParser, function(req, res){
	console.log("L2-Info: POST-REQUEST for /mapstate");
	//console.log(req.body); //DEBUG Kontrollausgabe
	
	if(req.session && req.session.user) { 
		console.log("L1-Info: Cookie true");
		
		//Preprocessing / Formatieren von JSON-Objekten
		var rawData = null;
		for (var k in req.body) rawData = k;
		var validData = JSON.parse(rawData);
		
		mongodbClient.connect(url, { useNewUrlParser: true }, function(err, dbClient) {
			if (err) throw err;
			var db = dbClient.db('DigitalerFuehrungsassistent');
			console.log("L2-Info: DB-Connection true");
		
			db.collection('Fuehrungskraft').findOneAndUpdate({cookie: req.session.user}, {$set: {position: validData.position, zoom: validData.zoom}}, function(err, updated){
				if (err) throw err;
			
				res.send('OK');
				dbClient.close();
			});
		});
	}
	
	else {
		console.log("L1-Info: Cookie false");
		res.send("Cookie false");
	}
});	



/* /gesamtdoku - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/gesamtdoku', function(req, res){
	console.log("L2-Info: GET-REQUEST for /gesamtdoku");
	
	res.render('gesamtdoku', {title: "automatische Gesamtdoku - Digitaler Führungsassistent"});
});	



// Debuggin Routing-Funktionen

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
