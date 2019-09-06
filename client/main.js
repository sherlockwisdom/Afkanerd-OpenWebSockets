const Tools = require('./../globals/tools.js')
const Socket = require ('net');
const JsonSocket = require('json-socket');
const Sebastian = require('./sebastian.js');
const { spawn, spawnSync,fork } = require('child_process');
'use strict';

//TODO: start pm2 manually and keep restarting using name in app
//TODO: start pm2 with app and keep restarting it


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
				sebastian.emit("safemenow!", sebastian);
				return;
			break;

			default:
			break;
		}
	});


	socket.on('message', (data ) => {
		console.log("socket.message=> new message:",data);
		try {
			if(typeof data.type !== undefined) {
				switch( data.type ) {
					case "terminal":
						console.log("socket.message=> running a config command");
						let terminalType = data.payload.terminalType;
						switch( terminalType ) {
							case "update":
								console.log("socket.message.terminal=> received command for update");
								sebastian.update();
							break;

							case "reload":
								console.log("socket.message.reload=> received command for reload");
							break;
						}
					break;

					case "sms":
					break;

					default:
						console.log("socket.message=> running default state for:", data.type);
						let options = {
							detached: true,
							stdio : ['inherit', 'inherit', 'inherit']
						}
						const newProcess = spawn(data.type, data.payload, options);
						newProcess.unref();
					break;
				}
			}
			else {
				throw new Error("unknown request type");
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
				sebastian.emit("safemenow!", sebastian);
			break;

			default:
				console.log("socket.close=> I'm just confused now....");
			break;
		}
	});
}

var sebastian = new Sebastian;
startScript(sebastian);
sebastian.on("safemenow!", startScript);
//TODO: Add important things to process file
