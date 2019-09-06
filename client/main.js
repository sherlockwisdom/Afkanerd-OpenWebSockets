const Queue = require ('./../globals/queue.js');
const Tools = require('./../globals/tools.js')
const Socket = require ('net');
const JsonSocket = require('json-socket');
const Events = require('events');

'use strict';

class Sebastian extends Events {
	constructor() {
		super();
		this.eventList = {}
		this.on('event', this.execute);
	}

	execute(eventName) {
		console.log("(-_-) Ciel: ", eventName, " Sebastian: yes master!");
		this.eventList[eventName](this)
	}

	watch(eventName, eventFunction) {
		this.eventList[eventName] = eventFunction
	}
}

//Let's begin, le dance macabre


let startScript = async ( sebastian )=>{
	var socket = new JsonSocket(new Socket.Socket());

	var startSocketConnection = ()=> {
		console.log('state=> starting socket connection....');
		const options = {
			host : '127.0.0.1',
			port : '8080'
		}

		socket.connect(options, function(){
			console.log("socket.connect=> connected..."); 
			socket.sendMessage({type:"auth", token:"12345"});
		});
	}

	let mysqlConnection = await Tools.mysql_connection();
	var smsMessageQueue = new Queue(mysqlConnection, "11111", "sms_message");
	var stateMessageQueue = new Queue(mysqlConnection, "11111", "error_logs");

	startSocketConnection();
	socket.on('error', async ( error ) => {
		console.log("socket.error=> [", error.code, "]", error.message);
		await stateMessageQueue.hardInsert( error )

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
		try {
			let jsData = JSON.parse(data);
			
			if(data.type == "sms") {
				let payload = data.payload;
				console.log("socket.message=> request for sms message received");
				smsMessageQueue.insert(payload);
				/*appManager.appRequest( data );
				if(appRequest.isApp()) appRequest.queue( data );
				else {
					//TODO: something in the line of back to sender or log for back habits...nah log it!
					stateMessageQueue.hardInsert(data);
				}*/
				//TODO: check out something to do here to stop multiple messages from requesting the modem at once
			}
		}
		catch(error) {}
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
