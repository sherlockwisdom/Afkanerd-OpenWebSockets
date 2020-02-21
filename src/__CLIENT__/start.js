//console.log(process.env);
const bodyParser = require('body-parser')

const START_ROUTINES = require('./start_routines.js');

var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
var SOCKETS = require('./../__ENTITIES__/Socket.js');

//es7 async/await`
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

//===============
'use strict';
//===============

//=======================================================
let CONFIGS = START_ROUTINES.READCONFIGS('system_configs');
let RETURN_VALUES = START_ROUTINES.READCONFIGS('return_values');
if(typeof CONFIGS["__DEFAULT__"] == "undefined") {
	console.error("=> CONFIGS NOT PROPERLY LOADED");
	return;
}
const __TCP_HOST_NAME__ = CONFIGS["SERVER_HOST"];
const __TCP_HOST_PORT__ = CONFIGS["SERVER_PORT"];
const __CLIENT_TOKEN__ = CONFIGS["TOKEN"];
const __CLIENT_UUID__ = CONFIGS["UUID"];
const __APP_TYPE__ = CONFIGS["APP_TYPE"].split(',')
const __MYSELF__ = { __CLIENT_TOKEN__ : __CLIENT_TOKEN__, __CLIENT_UUID__ : __CLIENT_UUID__, __APP_TYPE__ : __APP_TYPE__ };
//TODO: Check all this variables before starting

//TODO: Checks ( this should not be empty )
console.log("=> __TCP_HOST_NAME__: %s", __TCP_HOST_NAME__);
console.log("=> __TCP_HOST_PORT__: %s", __TCP_HOST_PORT__);
console.log("=> __CLIENT_TOKEN__: %s", __CLIENT_TOKEN__);
console.log("=> __CLIENT_UUID__: %s", __CLIENT_UUID__);
console.log("=> __APP_TYPE__: %s", __APP_TYPE__);
//=======================================================

//================================================
var __MYSQL_CONNECTION__;
var __SOCKET_COLLECTION__;
var SOCKET = new SOCKETS;

(async ()=>{
	try{
		__MYSQL_CONNECTION__ = await START_ROUTINES.GET_MYSQL_CONNECTION();
		console.log("=> MYSQL CONNECTION ESTABLISHED");
	}
	catch(error) {
		console.log(error);
		return;
	}
})();

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
			let socketConnection = await SOCKET.connect(__TCP_HOST_NAME__, __TCP_HOST_PORT__);
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

