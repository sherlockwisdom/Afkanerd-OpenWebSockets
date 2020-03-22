var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class Cl_Sockets {
	constructor(__MYSQL_CONNECTION__, __ID__, __TOKEN__){
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
				this.socket.connectedClients = []
				resolve(this.socket);
				console.log("=> SOCKET SERVER STARTED ON PORT [%s]", connectionOptions.port);
			});
		})

		this.socket.on('connection', ( client )=>{
			console.log("==================\n=> NEW CLIENT CONNECTION MADE\n===================");
			client = new JsonSocket ( client );
			this.socket.connectedClients.push( client );

			// Sample test messages could go here while developing
			// Request standard 
			// Format = [Array]
			// Important note: Last request contains the req_id, should not be left out
			/*
			const testRequestSample = [
				{
					message : new Date().toDateString(),
					number : '000000000'
				},
				{
					req_id : Number(new Date().valueOf()),
				}
			]
			client.sendMessage( testRequestSample, ( something ) => { console.log( "=> TEST REQUEST SENT" ) } );
			*/

			client.on('message', async ( data )=>{
				console.log("CLIENT:=> NEW MESSAGE");
				console.log( data );

				if( data.hasOwnProperty( "type") ) {
					switch( data.type ) {
						case "notification":
							if( data.message = "ready") {
								console.log("=> CLIENT REQUESTING ALL PENDING REQUEST");
							}
						break;

						default:
						break;
					}
				}
			})

			client.on("error",async ()=>{
				console.log("CLIENT:=> ERROR WITH CONNECTED CLIENT");
				this.removeClient( client );
			})

			client.on("close",async ()=>{
				console.log("CLIENT:=> CLIENT CONNECTION CLOSED");
				this.removeClient( client );
			})

			client.on("request_signal", async() => {
				console.log("CLIENT:=> NEW REQUEST SIGNAL");
			});
		})
		return PromisedSocket;
	}
}
