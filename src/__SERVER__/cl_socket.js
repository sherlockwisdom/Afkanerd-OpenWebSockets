var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class Cl_Sockets {
	constructor(mysqlConnection, __ID__, __TOKEN__){
		this.mysqlConnection = mysqlConnection;
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

	getAllPendingRequest() {
		return new Promise((resolve, reject) => {
			let fetchAllQuery = "SELECT * FROM __DEKU_SERVER__.__REQUEST__ WHERE __STATUS__ = 'not_sent'";
			this.mysqlConnection.query(fetchAllQuery, ( error, results ) => {
				if( error ) {
					reject( error );
					return;
				}

				// TODO: Format results
				let messages = []
				for( let i in results ) {
					messages.push( {
						id : results[i].__ID__,
						message : results[i].__MESSAGE__,
						number : results[i].__PHONENUMBER__,
						req_id : results[i].REQ_ID
					});
				}
				resolve( messages );
			});
		});
	}


	changePendingStates( messages ) {
		// TODO: This is very inefficient, use a loop to join all the statements and use one statement instead of multipl statements
		return new Promise((resolve, reject) => {
			for(let i in messages ) {
				let changeStates = "UPDATE __DEKU_SERVER__.__REQUEST__ SET __STATUS__ = 'sent' WHERE __ID__ = ?";
				this.mysqlConnection.query(changeStates, messages[i].id, (error, results) => {
					if( error ) {
						reject( error );
					}
				});
			}
			resolve();
		});
	}

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
								try {
									let messages = await this.getAllPendingRequest(); // This should be for a specific client
									// console.log( messages );
									
									//Once transmistted to client, should change all their states
									client.sendMessage( messages );
									let results = await this.changePendingStates( messages );
									// console.log( results );
								}
								catch( error ) {
									console.log( error ) ;
								}
								//client.sendMessage( messages, ()=> { console.log("=> FORWARDED ALL PENDING REQUEST TO CLIENT") );
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
