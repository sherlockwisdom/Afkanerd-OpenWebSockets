const bodyParser = require('body-parser')
const START_ROUTINES = require('./start_routines.js');
var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
const Cl_Socket = require('./cl_socket.js');
const MySQLConnector = require('./../MYSQL_CONNECTION.js');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

'use strict';
let configs = {
	SOCKET_PORT : '4000',
	DIR_REQUEST_FILE : "",
	SERVER_HOST : 'localhost',
	SERVER_PORT : '3000',
	TOKEN : 'DEVELOPER_TOKEN',
	ID : 'DEVELOPER_ID',
	APP_TYPE : 'SMS'
}

let return_values = {
	SUCCESS : '200',
	INVALID_REQUEST : '400',
	NOT_AUTHORIZED : '400',
	FAILED : '400'
}

const auth_details = {
	token : 'AFKANERD_TOKEN',
	id : 'AFKANERD_ID'
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
					console.error( error );
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
			clientSocket.sendMessage( auth_details_msg );
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
							if( message.message = "new_request" ) {
								let readyAck = {
									type : 'notification',
									message : 'ready'
								}
								clientSocket.sendMessage(readyAck, ()=> { console.log("=> READY ACK") });
								return;
							}
							break;

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

				let response = {}
				try {
					let writeState = await writeToDatabase( message );
					response = {
						type : 'ack',
						message : 'processed',
						ids : writeState.ids
					}
				}
				catch( error ) {
					response = {
						type : 'ack',
						message : 'failed process',
						ids : writeState.ids,
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

