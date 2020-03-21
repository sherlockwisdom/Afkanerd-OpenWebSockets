const express = require('express');
const bodyParser = require('body-parser')
const START_ROUTINES = require('./start_routines.js');
var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
var Cl_Socket = require('./cl_socket.js');
var MySQLConnector = require('./../MYSQL_CONNECTION.js');

'use strict';
let configs = {
	COMPONENT : 'SMS',
	SOCKET_PORT : '3000',
	API_PORT : '8000'
}

let return_values = {
	SUCCESS : '200',
	INVALID_REQUEST : '400',
	NOT_AUTHORIZED : '400',
	FAILED : '400'
}

const mysql_env_path = "__COMMON_FILES__/mysql.env";
var mysqlConnection;
var sockets;

var app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

(async ()=>{
	try{
		mysqlConnection = await MySQLConnector.getConnection(mysql_env_path);
		mysqlConnection.connect();
		console.log("=> MYSQL CONNECTION ESTABLISHED");
	}
	catch(error) {
		console.log(error);
		return;
	}
})();

(async ()=>{
	try {
		sockets = new Cl_Socket(mysqlConnection);
		socket = await sockets.start();
	}
	catch( error ) {
		console.log(error);
		return;
	}
})();

//=================================
let APIOptions = {
	port : '8000'
}

app.listen(APIOptions, ()=>{
	console.log("=> RECEIVING API BEGAN, RUNNING ON PORT [%d]", APIOptions.port);
});

app.post(configs.COMPONENT, async (req, res)=>{
	let __BODY__ = req.body;

	console.log(__BODY__);

	let __CLIENT__ = __BODY__.__CLIENT__;

	if(
		typeof __CLIENT__["ID"] == "undefined" ||
		typeof __CLIENT__["TOKEN"] == "undefined"
	) {
		console.log("-- Invalid request made --");
		res.status( RETURN_VALUES['INVALID_REQUEST'] );
		res.end();
	}

	let __USER_ID__ = __CLIENT__.ID;
	let __TOKEN__ = __CLIENT__.TOKEN;

	//Let's validate this client
	let DBDeku = new __DBCLIENT__( __MYSQL_CONNECTION__, __USER_ID__, __TOKEN__);

	try{
		let validated_client = await DBDeku.validate(__USER_ID__, __TOKEN__);
		if( !validated_client) {
			res.status( RETURN_VALUES['NOT_AUTHORIZED'] );
			res.end();
		}
	}
	catch( error ) {
		console.log(error);
		res.end();
	}
	
	//Now let's validate the request
	let __REQUEST__ = __BODY__.__REQUEST__;
	if(
		typeof __REQUEST__["__REQUEST__"] == "undefined"
	) {
		res.status( RETURN_VALUES['INVALID_REQUEST'] ).end();
	}

	let __SMS_COLLECTION__ = __REQUEST__.__SMS__;

	let DBRequest = new __DBREQUEST__(__MYSQL_CONNECTION__);

	if( !DBRequest.valid( __SMS_COLLECTION__ ) ) {
		console.log("=> REQUEST NOT WELL FORMED");
		res.status(RETURN_VALUES['INVALID_REQUEST']).end();
	}
	else {
		let DBRequestID = await DBRequest.insert(__USER_ID__, __SMS_COLLECTION__);
		console.log("=> %d REQUEST STORED IN DATABASE", DBRequestID.affectedRows);
		let __SOCKET__ = await __SOCKET_COLLECTION__.find(__USER_ID__, __TOKEN__, __MSG_ID__);
		if( !__SOCKET__.transmit( __SMS_COLLECTION__ ) ){
			res.status(__SOCKET__.getErrorCode() );
			res.end();
		}
		
		res.status( RETURN_VALUES['FAILED'] );
		res.end();
	}
});

