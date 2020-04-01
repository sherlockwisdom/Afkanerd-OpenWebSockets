const fs = require('fs');
const bodyParser = require('body-parser')
const START_ROUTINES = require('./start_routines.js');
var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
const Cl_Socket = require('./cl_socket.js');
const MySQLConnector = require('./../MYSQL_CONNECTION.js');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

'use strict';

let args = process.argv.slice(2);
var configurationFile;

for(let i=0;i<args.length;++i) {
	if( args[i] == "-c" ) {
		configurationFile = args[i+1];
		require('dotenv').config({path: configurationFile.toString()})
	}
}

if( typeof configurationFile == "undefined") {
	console.error("No configuration file passed, exiting...\nUse -c to pass configurations file");
	return;
}


let configs = {
	SERVER_HOST : process.env.SERVER_HOST,
	SERVER_PORT : process.env.SERVER_PORT,
	TOKEN : process.env.CLIENT_TOKEN,
	ID : process.env.CLIENT_ID,
	APP_TYPE : process.env.APP_TYPE,
	REQUEST_FILE : process.env.DIR_REQUEST_FILE + "/" + process.env.STD_NAME_REQUEST_FILE
}

console.log( configs );

let return_values = {
	SUCCESS : '200',
	INVALID_REQUEST : '400',
	NOT_AUTHORIZED : '400',
	FAILED : '400'
}

const auth_details = {
	token : configs.TOKEN,
	id : configs.ID
}

var mysql_connection;
var cl_socket = new Cl_Socket;

const path_mysql_env = "__COMMON_FILES__/mysql.env";

(async ()=>{
	try{
		mysql_connection = await MySQLConnector.getConnection( path_mysql_env );
		mysql_connection.connect();
		console.log("=> MYSQL CONNECTION ESTABLISHED");
	}
	catch(error) {
		console.log(error);
		return;
	}
})();


(async ()=>{

	let writeToRequestFile = ( request) => {
		return new Promise( async(resolve, reject)=> {
			console.log("=> WRITING TO REQUEST FILE AT: [%s]", configs.REQUEST_FILE );
			if( request.length < 1 ) reject( false );
			let requestContainerDump = []; //This container takes a list of request and dumps to file
			for(let i in request) {
				let simpleRequest;
				if( request[i].hasOwnProperty("number") && request[i].hasOwnProperty("message")) {
					simpleRequest = "number=" + request[i].number + ",message=" + JSON.stringify(request[i].message);
				}
				else if(request[i].hasOwnProperty("phonenumber") && request[i].hasOwnProperty("message")) {
					simpleRequest = "number=" + request[i].phonenumber + ",message="+ JSON.stringify(request[i].message);
				}
				requestContainerDump.push(simpleRequest);
				//console.log(simpleRequest);
			}
			fs.appendFileSync( configs.REQUEST_FILE, requestContainerDump.join('\n') + "\n");
			resolve( true );
		});
	}
	
	let writeToDatabase = ( message )=>{ // message = [Object]
		return new Promise((resolve, reject)=> {
			let ids = []
			let messages = (()=>{
				let v_data = []
				for(let i=0; i < message.length; ++i ) {
					let id = message[i].id
					let req_id = message[i].req_id
					let msg = message[i].message
					let number = message[i].number
					v_data.push([id, req_id, msg, number]);
					ids.push( id ) 
				}
				return v_data;
			})();


			let insertQuery = "INSERT INTO __DEKU__.__REQUEST__ (__ID__, REQ_ID, __MESSAGE__, __PHONENUMBER__) VALUES ?";
			mysql_connection.query( insertQuery, [ messages ], ( error, result ) => {
				if( error ) {
					//console.error( error );
					reject( error );
					return;
				}

				console.log("=> REQUEST STORED IN DATABASE");
				resolve( {ids: ids} );
			});
		});
	}

	let startSocketConnection = async ()=>{
		try {
			let clientSocket = await cl_socket.connect( configs.SERVER_HOST, configs.SERVER_PORT);
			let auth_details_msg = auth_details;
			auth_details_msg.type = "auth";
			clientSocket.sendMessage( auth_details_msg, ()=> {
				console.log("=> AUTH DETAILS SENT");
				let messageRequest = {
					type : 'notification',
					message : 'ready'
				}
				clientSocket.sendMessage( messageRequest, ()=> {
					console.log("=> REQUESTED ALL PENDING MESSAGES");
				});
			});
			console.log("=> SERVER CONNECTION ESTABLISHED");


			clientSocket.on('close', async ()=>{
				//resolve(false);
				console.error("=> SOCKET CLOSED");

				let reconnectionTimeout = 5000;
				console.log("=> PENDING RECONNECTION - T MINUS 5 SECONDS")

				await snooze( reconnectionTimeout );
				await startSocketConnection();
			});


			clientSocket.on('message', async function( message ){
				console.log("=> NEW MESSAGE");
				if( !Array.isArray( message ) ) {
					let response = {
						type : 'ack',
						message : 'invalid request',
						data : message
					}
					if( message.hasOwnProperty("type") ) {
						switch( message.type ) {
							case "notification":
							if( message.message == "new_request" ) {
								let readyAck = {
									type : 'notification',
									message : 'ready'
								}
								clientSocket.sendMessage(readyAck, ()=> { console.log("=> READY ACK") });
								return;
							}
							break;

							case "query":
							if( message.target == "modem" ) {
								//TODO: Query the database and send all modems
							}

							default:
							response = {
								type : 'ack',
								message : 'invalid request',
								error : 'unknown type',
								data : message
							}
							break;
						}
					}
					else console.error("=> INVALID REQUEST");
					// console.log( message )
					clientSocket.sendMessage( response, ()=> { console.log("=> ACKNOWLEDGED SERVER") });
				}

				message.length > 1 ? 
					console.log("=> PROCESSING [%d] MESSAGES", message.length ) :
					console.log("=> PROCESSING [%d] MESSAGE", message.length)

				if( message.length < 1) return;

				let response = {}
				try {
					let writeDatabaseState = await writeToDatabase( message );
					let writeFileState = await writeToRequestFile ( message );
					response = {
						type : 'ack',
						message : 'processed',
						ids : writeDatabaseState.ids
					}
				}
				catch( error ) {
					response = {
						type : 'ack',
						message : 'failed process',
						ids : writeDatabaseState.ids,
						error : error
					}
				}
				clientSocket.sendMessage( response, ()=> { console.log("=> ACKNOWLEDGED SERVER") });
			});
		}
		catch (error) {
			console.error("=> CONNECTION ERROR:", error);
			console.error("=> FAILED CONNECTION TO SERVER");

			let reconnectionTimeout = 5000;
			console.log("=> PENDING RECONNECTION - T MINUS 5 SECONDS")

			await snooze( reconnectionTimeout );
			await startSocketConnection();
			return false;
		}
	} 
	startSocketConnection();
})();

