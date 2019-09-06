const Tools = require('./../globals/tools.js')
const Socket = require ('net');
const JsonSocket = require('json-socket');
const Sebastian = require('./sebastian.js');
'use strict';


let startScript = async ( sebastian )=>{
//Let's begin, le dance macabre
	var socket = new JsonSocket(new Socket.Socket());

	var startSocketConnection = ()=> {
		console.log('state=> starting socket connection....');
		const options = {
			host : '127.0.0.1',
			port : '8080'
		}

		socket.connect(options, function(){
			console.log("socket.connect=> connected..."); 
			socket.sendMessage({type:"auth", clientToken:"12345", UUID:"0000"});
		});
	}

	let mysqlConnection = await Tools.mysql_connection();

	startSocketConnection();
	socket.on('error', async ( error ) => {
		console.log("socket.error=> [", error.code, "]", error.message);

		switch( error.code ) {
			case 'ENOENT':
				console.log("socket.error=> check configuration parameters... possibly wrong settings");
			break;

			case 'ECONNREFUSED':
				console.log("socket.error=> server doesn't seem to be running, check port or call devs");
				await Tools.sleep();
				socket = null; //This is murder!!
				sebastian.emit("event", "safemenow!!");
				return;
			break;

			default:
			break;
		}
	});


	socket.on('message', (data ) => {
		console.log("socket.message=> new message:",data);
		try {
			if(data.type == "sms") {
				let payload = data.payload;
				console.log("socket.message=> request for sms message received");
				console.log(data);
			}
		}
		catch(error) {
			console.log("socket.message.error=> ", error.message);
		}
	})

	socket.on('close', async ( hadError )=> {
		switch( hadError ){
			case true:
				console.log("socket.close=> failed due to transmission error, check internet connection");
			break;

			case false:
				console.log("socket.close=> was murdered by the server.... call Sherlock (Holmes)");
				socket = null;
				sebastian.emit("event", "safemenow!!");
			break;

			default:
				console.log("socket.close=> I'm just confused now....");
			break;
		}
	});
}

var sebastian = new Sebastian;
startScript(sebastian);
sebastian.watch("safemenow!!", startScript);

//TODO: Add important things to process file
