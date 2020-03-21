//console.log(process.env);
const bodyParser = require('body-parser')

const START_ROUTINES = require('./start_routines.js');

var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
const Cl_Socket = require('./cl_socket.js');
const MySQLConnector = require('./../MYSQL_CONNECTION.js');
//es7 async/await`
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

//===============
'use strict';
//===============

//=======================================================
//XXX
let configs = {
	SOCKET_PORT : '4000',
	DIR_REQUEST_FILE : "",
	SERVER_HOST : 'localhost',
	SERVER_PORT : '3000',
	TOKEN : 'DEVELOPER_TOKEN',
	ID : 'DEVELOPER_ID',
	APP_TYPE : 'SMS'
}

//XXX
let return_values = {
	SUCCESS : '200',
	INVALID_REQUEST : '400',
	NOT_AUTHORIZED : '400',
	FAILED : '400'
}

const path_mysql_env = "__COMMON_FILES/mysql.env"
const CLIENT_TOKEN = configs.TOKEN;
const CLIENT_ID = configs.ID;

const auth_details = {
	client_token : CLIENT_TOKEN,
	client_id : CLIENT_ID
}

//TODO: Checks ( this should not be empty )
console.log( auth_details )
//=======================================================

//================================================
var mysql_connection;
var cl_socket = new Cl_Socket;

(async ()=>{
	try{
		mysql_connection = await MySQLConnector.getConnection( path_mysql_env );
		console.log("=> MYSQL CONNECTION ESTABLISHED");
	}
	catch(error) {
		console.log(error);
		return;
	}
})();


(async ()=>{
	let startSocketConnection = async ()=>{
		try {
			console.log(configs)
			let clientSocket = await cl_socket.connect( configs.SERVER_HOST, configs.SERVER_PORT);
			console.log("=> SERVER CONNECTION ESTABLISHED");
			clientSocket.on('message', function( message ){

				//XXX: Introduces a standard
				if(!message.hasOwnProperty("type") || !message.hasOwnProperty("data")) {
					clientSocket.sendMessage( __INVALID_MESSAGE__ );
					return;
				}

				console.log("=> NEW MESSAGE:", message);
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

