
/**
	* Node.js Login Boilerplate
	* More Info : http://kitchen.braitsch.io/building-a-login-system-in-node-js-and-mongodb/
	* Copyright (c) 2013-2016 Stephen Braitsch
**/

var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var app = express();

app.locals.pretty = true;
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

// build mongo database connection url //

var mongoUtil = require('./app/server/modules/mongoUtil');

mongoUtil.connectToServer( function( err ) {
} );

dbURL = 'mongodb://biggerlab:56G-h7G-WEa-pCS@ds111178.mlab.com:11178/heroku_v9z3shn0';

app.use(session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ url: dbURL })
	})
);

require('./app/server/routes')(app);

const server = http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

const WebSocket = require('ws');
wss = new WebSocket.Server({ server });

var connectedClients = {}

wss.on('connection', function connection(ws, req) {
	// const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	ws.on('message', function incoming(message) {
		// if received type: config, configure users and ports
		console.log('received: %s', message);
		if (!message) return;
		var receivedObject = JSON.parse(message)
		if (receivedObject.type === 'connect') {
			connectedClients[receivedObject.user] = ws;
		}
		if (receivedObject.type === 'output' || receivedObject.type === 'error') {
			var client = connectedClients[receivedObject.user]
			if (client != null && client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		}
	});

	// ws.send('something');
});


wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

function ping() {
	wss.broadcast("");
   	setTimeout(ping, 50000);
}
ping();
