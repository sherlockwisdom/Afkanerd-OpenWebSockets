const Queue = require ('./../globals/queue.js');
const mysql = require('./../globals/tools.js')
const Socket = require ('net');
const JsonSocket = require('json-socket');

'use strict';


//Let's begin, le dance macabre

var socket = new JsonSocket(new Socket.Socket());

let startScript = async ()=>{
	let mysqlConnection = await mysql.mysql_connection();
	var smsMessageQueue = new Queue(mysqlConnection, "11111");
	var stateMessageQueue = new Queue(mysqlConnection, "11111");

	let options = {
		host : 'localhost',
		port : '8080'
	}

	socket.connect(options.host, options.port);

	socket.on('connect', ()=>{
		console.log("socket.connect=> connected...");
	})


	socket.on('error', async ( error ) => {
		console.log("socket.error=> ", error.message);
		let jsError = {}
		jsError["error_source"] = "socket.on.error"
		jsError["error_message"] = error.message
		/*	error_code : error.code,
			error_syscall : error.syscall
		}*/
		await stateMessageQueue.hardInsert( jsError )

		switch( error.code ) {
			case 'ENOENT':
				let sleep = new Promise( function( resolve ) {
					console.log("socket.error=> going to sleep...");
					setTimeout(()=>{ 
						console.log("socket.error=> awake now, retrying connection");
						resolve();
					}, 5000);
				});

				await sleep;
				socket.connect(options.host, options.port);
			break;

			default:
			break;
		}
	});


	socket.on('message', (data ) => {
		try {
			let jsData = JSON.parse(data);
			
			if(data.type == "sms") {
				let payload = data.payload;
				console.log("socket.message=> request for sms message received");
				smsMessageQueue.insert(payload);
				//TODO: check out something to do here to stop multiple messages from requesting the modem at once
			}
		}
		catch(error) {}
	})
}



startScript();
