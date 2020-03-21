var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class Cl_Sockets {
	constructor(__MYSQL_CONNECTION__, __ID__, __TOKEN__){
		this.__ID__ = __ID__;
		this.__TOKEN__ = __TOKEN__;
		this.collection = {};
		this.__MYSQL_CONNECTION__ = __MYSQL_CONNECTION__;
	}

	transmit( __MESSAGE__, __NUMBER__, __ID__ ) {
		//TODO: Send this information
		let client = this.collection[this.__ID__ + this.__TOKEN_];
		let transmission = {
			__MESSAGE__ : __MESSAGE__,
			__NUMBER__ : __NUMBER__,
			__ID__ : __ID__
		}
		let returnValue = false;
		client.sendMessage( transmission, ( error )=>{
			if( error) {
				console.log("=> SOMETHING WENT WRONG WITH TRANSMISSION...");
				console.log( error );
			}
			console.log("=> TRANSMISSION SUCCESSFUL");
			returnValue = true;
		})

		return returnValue;
	}
	
	find( __ID__, __TOKEN__ ) {
		return new SOCKETS(__ID__, __TOKEN__);
	}

	get getErrorCode() {}

	start() {
		this.socket = new Socket.Server();

		let PromisedSocket = new Promise( async (resolve, reject) => {
			const connectionOptions = {
				port : '3000'
			}
			
			this.socket.listen(connectionOptions, ()=>{
				resolve(this.socket);
				console.log("=> SOCKET SERVER STARTED ON PORT [%s]", connectionOptions.port);
			});
		})

		this.socket.on('connection', ( client )=>{
			console.log("==================\n=> NEW CLIENT CONNECTION MADE\n===================");
			client = new JsonSocket ( client );

			client.on('message', async ( data )=>{
				console.log("=> NEW MESSAGE");
				console.log( data );
			})

			client.on("error",async ()=>{
				console.log("=> ERROR WITH CONNECTED CLIENT");
				this.removeClient( client );
			})

			client.on("close",async ()=>{
				console.log("=> CLIENT CONNECTION CLOSED");
				this.removeClient( client );
			})
		})
		return PromisedSocket;
	}


}
