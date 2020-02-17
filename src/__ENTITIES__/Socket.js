var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class SOCKETS {
	constructor(__ID__, __TOKEN__){
		this.__ID__ = __ID__;
		this.__TOKEN__ = __TOKEN__;
		this.collection = {};
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

	startSockets() {
		this.socket = new Socket.Server();

		let pendingPromise = new Promise( async (resolve, reject) => {
			let path = "../__COMMON_FILES__/system_configs.env";
			require('dotenv').config({path: path.toString()})
			let __CONNECTION_OPTIONS__ = {
				port : process.env.SOCKET_PORT	
			}
			
			this.socket.listen(__CONNECTION_OPTIONS__, ()=>{
				resolve();
			});
		})

		this.socket.on('connection', ( client )=>{
			console.log("==================\n=> NEW CLIENT CONNECTION MADE\n===================");
			client = new JsonSocket ( client );

			//AUTHENTICATE IT
			client.sendMessage( "WAY", ( error )=>{
				if( error ) {
					console.log("=> FAILED T0 BROADCASET WAY");
					client.end();
				}
				else console.log("=> BROADCASTING WAY");
			});

			client.on('message', async ( data )=>{
				if( !data.hasOwnProperty("__MESSAGE_TYPE__") ) return;

				//AUTHENTICATING
				if( data.__MESSAGE_TYPE__ == "__AUTH__" ) {
					let DBClient = new __DBCLIENT__( data.ID, data.TOKEN );
					if( this.collection.hasOwnProperty(data.ID + data.TOKEN) ) {
						console.log("=> CLIENT NOT BEING SURE...");
						client.sendMessage("=> I GOT YOU");
					}

					else {
						let validated_client = await DBClient.validate( data.ID, data.TOKEN );
						if( !validated_client) {
							client.sendEndMessage( "IDKY" );
						}

						this.collection[data.ID + data.TOKEN] = client;
						console.log("=> AUTHENTICATION ESTABLISHED");
					}
				}

				//TODO: What happens if it's an authenticated user
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
		return pendingPromise;
	}


	connect(__SERVER_HOST__, __SERVER_PORT__) {
		return new Promise((resolve, reject)=>{
			this.clientSocket = new JsonSocket( new Socket.Socket() );	
			
			this.clientSocket.connect(__SERVER_HOST__, __SERVER_PORT__);
			this.clientSocket.on('connect', ()=>{
				resolve( true);
			});

			this.clientSocket.on('error', ( error )=>{
				reject( error );
			});

			this.clientSocket.on('close', ()=>{
			});

			resolve(false);
		});

	}
}
