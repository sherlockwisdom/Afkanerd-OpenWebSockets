const Queue = require ('./../globals/queue.js');
const mysql = require('./../globals/tools.js')
const Socket = require ('net');
const JsonSocket = require('json-socket');

'use strict';


//Let's begin, le dance macabre

var socket = new JsonSocket(new Socket.Socket());

let startScript = async ()=>{
	let mysqlConnection = await mysql.mysql_connection();
	var smsMessageQueue = new Queue(mysqlConnection, "11111", "sms_message");
	var stateMessageQueue = new Queue(mysqlConnection, "11111", "error_logs");

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
		await stateMessageQueue.hardInsert( error )

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
				appManager.appRequest( data );
				if(appRequest.isApp()) appRequest.queue( data );
				else {
					//TODO: something in the line of back to sender or log for back habits...nah log it!
					stateMessageQueue.hardInsert(data);
				}
				//TODO: check out something to do here to stop multiple messages from requesting the modem at once
			}
		}
		catch(error) {}
	})
}

startScript();
