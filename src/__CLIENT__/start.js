//console.log(process.env);
const bodyParser = require('body-parser')

const START_ROUTINES = require('./start_routines.js');

var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
var SOCKETS = require('./../__ENTITIES__/Socket.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
//es7 async/await`
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

//===============
'use strict';
//===============

//=======================================================
//XXX
let configs = {
	SOCKET_PORT : '3000',
	DIR_REQUEST_FILE : "",
	SERVER_HOST : 'localhost',
	SERVER_PORT : '8000',
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

const __MYSQL_ENV_PATH__ = "__COMMON_FILES/mysql.env"
const __TCP_HOST_NAME__ = configs.SERVER_HOST;
const __TCP_HOST_PORT__ = configs.SERVER_PORT;
const __CLIENT_TOKEN__ = configs.TOKEN;
const __CLIENT_ID__ = configs.ID;
const __APP_TYPE__ = configs.APP_TYPE.split(',')

const __MYSELF__ = { __CLIENT_TOKEN__ : __CLIENT_TOKEN__, __CLIENT_ID__ : __CLIENT_ID__, __APP_TYPE__ : __APP_TYPE__, __TYPE__ : "__AUTH__"}
//TODO: Check all this variables before starting

//TODO: Checks ( this should not be empty )
console.log(__MYSELF__)
//=======================================================

//================================================
var __MYSQL_CONNECTION__;
var __SOCKET_COLLECTION__;

(async ()=>{
	try{
		__MYSQL_CONNECTION__ = await __MYSQL_CONNECTOR__.GET_MYSQL_CONNECTION(__MYSQL_ENV_PATH__);
		console.log("=> MYSQL CONNECTION ESTABLISHED");
	}
	catch(error) {
		console.log(error);
		return;
	}
})();
//Because has to wait for mysql to connect first - singleton pattern design
var SOCKET = new SOCKETS( __MYSQL_CONNECTION__ );

(async ()=>{
	try {
		__SOCKET_COLLECTION__ = await SOCKET.startSockets();
		console.log("=> SOCKETS ESTABLISHED");
	}
	catch( error ) {
		console.log(error);
		return;
	}
})();

(async ()=>{
	let startSocketConnection = async ()=>{
		try {
			let socketConnection = await SOCKET.connect( configs.SERVER_HOST, configs.SERVER_PORT);
			console.log("=> SERVER CONNECTION ESTABLISHED");
			SOCKET.clientSocket.on('message', function( message ){
				if(!message.hasOwnProperty("type") || !message.hasOwnProperty("data")) {
					SOCKET.clientSocket.sendMessage( __INVALID_MESSAGE__ );
					return;
				}
				console.log("=> NEW MESSAGE:", message);
				if(message.type == "__AUTH__") {
					console.log("=> __AUTH__ required");
					if(message.data == "W.A.Y.") {
						SOCKET.clientSocket.sendMessage( __MYSELF__, ()=>{console.log("=> WAY ACK SENT")});
					}
					else {
						console.error("=> __AUTH__ unknown data requested");
					}
				}
				else if(message.type == "__REQUEST__") {
					console.log("=> __REQUEST__ required");
				}
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

