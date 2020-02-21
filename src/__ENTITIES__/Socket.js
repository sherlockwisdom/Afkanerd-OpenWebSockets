var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class SOCKETS {
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
			let __AUTH_REQUEST__ = { type : "__AUTH__", data : "W.A.Y." }
			client.sendMessage( __AUTH_REQUEST__, ( error )=>{
				if( error ) {
					console.log("=> FAILED T0 BROADCASET WAY");
					client.end();
				}
				else console.log("=> BROADCASTING WAY");
			});

			client.on('message', async ( data )=>{
				if( !data.hasOwnProperty("__TYPE__") ) return;

				//AUTHENTICATING
				if( data.__TYPE__ == "__AUTH__" ) {
					if( !data.hasOwnProperty("__CLIENT_TOKEN__") || !data.hasOwnProperty("__CLIENT_ID__")) {
						console.error("=> INVALID AUTH REQUEST");
						return;
					}
					let __MYSQL_ENV_PATH__ = "__SERVER__/mysql.env"; //TODO: Remove this line to make things more dynamic
					let __MYSQL_CONNECTION__ 
					let DBClient
					try {
						__MYSQL_CONNECTION__ = await __MYSQL_CONNECTOR__.GET_MYSQL_CONNECTION(__MYSQL_ENV_PATH__);
						DBClient = new __DBCLIENT__( __MYSQL_CONNECTION__, data.__CLIENT_ID__, data.__CLIENT_TOKEN__ );
					}
					catch( error ) {
						console.error ( error );
						console.log("=> ISSUE GETTING MYSQL CONNECTION");
						return
					}

					//IF ALREADY VALIDATED
					if( this.collection.hasOwnProperty(data.__CLIENT_ID__ + data.__CLIENT_TOKEN__) ) {
						console.log("=> CLIENT NOT BEING SURE...");
						client.sendMessage("=> I GOT YOU");
					}

					//IF NOT ALREADY VALIDATED
					else {
						let validated_client = await DBClient.validate( data.__CLIENT_ID__, data.__CLIENT_TOKEN__ );
						if( !validated_client) {
							client.sendEndMessage( "IDKY" );
						}

						this.collection[data.__CLIENT_ID__ + data.__CLIENT_TOKEN__] = client;
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
			
			//console.log("... connecting tcp host: %s", __SERVER_HOST__);
			//console.log("... connecting tcp port: %s", __SERVER_PORT__);

			this.clientSocket.connect(__SERVER_PORT__, __SERVER_HOST__);

			this.clientSocket.on('connect', ()=>{
				resolve( true);
			});

			this.clientSocket.on('error', ( error )=>{
				reject( error );
			});

			this.clientSocket.on('close', ()=>{
				//resolve(false);
			});

		});

	}
}
