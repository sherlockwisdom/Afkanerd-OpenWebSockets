const bodyParser = require('body-parser')

const START_ROUTINES = require('./start_routines.js');

var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
var SOCKETS = require('./../__ENTITIES__/Socket.js');

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
const __TCP_HOST_NAME__ = START_ROUTINES["SERVER_HOST"];
const __TCP_HOST_PORT__ = START_ROUTINES["SERVER_PORT"];
const __CLIENT_TOKEN__ = START_ROUTINES["TOKEN"];
const __CLIENT_UUID__ = START_ROUTIENS["UUID"];
const __APP_TYPE__ = START_ROUTINES["APP_TYPE"].split(',')
//=======================================================

//================================================
var __MYSQL_CONNECTION__;
var __SOCKET_COLLECTION__;
SOCKETS = new SOCKETS;

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
		__SOCKET_COLLECTION__ = await SOCKETS.startSockets();
		console.log("=> SOCKETS ESTABLISHED");
	}
	catch( error ) {
		console.log(error);
		return;
	}
})();
