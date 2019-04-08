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
server.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
server.set('view engine', 'hbs');

server.use(express.static('views'));

var urlencodedParser = bodyParser.urlencoded({extended: false});

var mongodbClient = mongodb.MongoClient; 
var url = "mongodb://localhost:27017";
//var mongod = shell.exec('start cmd.exe /c mongod', {async: true});

server.use(session({ 
	cookieName: 'session',
	secret: 'crypto-string',
	duration: 50*60*1000, 
	activeDuration: 5*30*1000 
}));



/* Server starten */
server.listen(server.get('port'), '0.0.0.0', function() {
	console.log('L1-Info: Server started listening at ' + server.get('port'));
});



/* / - Empfangen eines GET-Requests ueber Port 8080  */
server.get('/', function(req, res){
	// Der Server erhaelt ein GET-Request ohne konkrete Fileangabe. Es wird die Login-Seite als HTTP-Response zurueckgesendet
	console.log("L2-Info: GET-REQUEST for / ");
	res.sendFile(__dirname + "/views/" + "login.html");
});
