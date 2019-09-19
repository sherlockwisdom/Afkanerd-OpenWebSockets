const SocketButler = require('./socket-butler.js');
const Tools = require('./../globals/tools.js');
const express = require('express');
const bodyParser = require('body-parser')
'use strict';
let mysqlConnection = Tools.mysql_connection();
var socketButler = new SocketButler(mysqlConnection);
var app = express()

app.use(bodyParser.json());
app.post('/v1/sms', function(req, res){
	let body = req.body;
	//console.log(body);

	if(!body.hasOwnProperty("access_token")){
		res.status(401);
		res.end();
	}
	else if(!body.hasOwnProperty("payload")) {
		res.status(400);
		res.end()
	}
	else {
		try {
			let token = body.access_token;
			let payload = body.payload;
			payload.clientToken = token;
			try{
				socketButler.forward(payload)
				res.status(200);
			}
			catch(error) {
				switch(error.code) {
					case 501:
						res.status(501)
					break;
					default:
						res.status(400);
					break;
				}
			}

			res.end();
		}
		catch(error) {
			res.status(400);
			res.send(error.message);
		}
		res.end();
	}
})

async function execSocketFunctionalities() {
	socketButler.on('butler.ready', ()=>{
		console.log(arguments.callee.name+"=> butler is called!");
		let mostImportantRequest = {
			"name" : "sherlock",
			"access_token" : "SAMPLE_ACCESS_TOKEN",
			"payload" : {
				"clientToken" : "SAMPLE_ACCESS_TOKEN",
				"clientUUID" : "SAMPLE_ACCESS_UUID",
				"payload" : {
					"type" : "terminal",
					"payload" : {
						"terminalType": "update"
					}
				},
				"appType" : "sms"
			}
		}

		//socketButler.forward(mostImportantRequest);
		
		var count = 0;
		socketButler.on('new client', ()=>{
			console.log('main:event:socket-butler:new-client');
			if(count == 0) socketButler.forward(mostImportantRequest.payload);
			count=1;
		});
	});
}

let options = {
	port : 3000
}

app.listen(options, ()=>{
	console.log("api.listen=> listening on port %d", options.port);
});
//execSocketFunctionalities();



//TODO: check up who keeps the keep alive message, if not... there's not need for that
//TODO: client socket.uuid(assigned after connection) is linked to socket.token (gotten after connection)
//TODO: when request is made(iterating through uuid to get socket with requested token and request is forwarded)
//TODO: @cool idea@ after doing the above, all sockets with token are gotten and each socket is checked for [request type] and message is forwarded if message and request type are same - default, if only 1 socket send message regardless, (if more than 1 socket - shit men, this is just cool)
