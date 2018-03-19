
/**
	* Node.js Login Boilerplate
	* More Info : http://kitchen.braitsch.io/building-a-login-system-in-node-js-and-mongodb/
	* Copyright (c) 2013-2016 Stephen Braitsch
**/

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var textEncoding = require('text-encoding'); 
var TextDecoder = textEncoding.TextDecoder;

const WebSocket = require('ws');

var ws;

var reconnectInterval = 1000 * 30;

var processes = {}

var connect = function(){
	ws = new WebSocket('ws://127.0.0.1:4000/'); // ws://localhost:3000 | wss://biggerpyweb.herokuapp.com/
	ws.on('open', function open() {
		ws.send(JSON.stringify({'type': 'log', 'data': 'Client Connected'}));
	});

	ws.on('message', function incoming(data) {
		console.log("Received from server: " + data);
		if (!data) return;
		var receivedObject = JSON.parse(data)
		if (receivedObject.type === 'script') {
			var fs = require('fs');
			fs.writeFile("./pythonscript.py", ("# -*- coding: utf-8 -*-\n" + receivedObject.data), function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("The file was saved!");
			});
			var spawn = require("child_process").spawn;
			var process = spawn('python',["-u", "./pythonscript.py"]); // `py` on windows, `python` on mac
			if (processes[receivedObject.user]) {
				processes[receivedObject.user].kill('SIGINT');
			}
			processes[receivedObject.user] = process;
			process.stdout.on('data', function (data){
				// Do something with the data returned from python script
				var output = new TextDecoder("utf-8").decode(data);
				console.log(output);
				ws.send(JSON.stringify({'type': 'output', 'user': receivedObject.user, 'data': output}));
			});
			process.stderr.on('data', function(data) {
				var output = new TextDecoder("utf-8").decode(data);
				console.log('Error' + output);
				ws.send(JSON.stringify({'type': 'error', 'user': receivedObject.user, 'data': output}));
				//Here is where the error output goes
			});
		}

		if (receivedObject.type === 'kill') {
			if (processes[receivedObject.user]) {
				processes[receivedObject.user].kill('SIGINT');
				processes[receivedObject.user] = null;
			}
		}
	});

	ws.on('error', function() {
        console.log('socket error');
	});
	
    ws.on('close', function() {
        console.log('socket close');
        setTimeout(connect, reconnectInterval);
    });
}
connect();
