const express = require('express');
const bodyParser = require('body-parser')
const START_ROUTINES = require('./start_routines.js');
var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __DBREQUEST__ = require('./../__ENTITIES__/DBRequest.js');
var Cl_Socket = require('./cl_socket.js');
var MySQLConnector = require('./../MYSQL_CONNECTION.js');

'use strict';
let configs = {
	COMPONENT : '/sms',
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
const APIOptions = {
	port : '8000'
}
var mysqlConnection;
var sockets;
var in_cache_sockets = []
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
		let socket = await sockets.start();
		in_cache_sockets.push( socket );
	}
	catch( error ) {
		console.log(error);
		return;
	}
})();

//=================================

var meta_request_write = ( message )=> {
	return new Promise((resolve, reject)=> {
		let insertQuery = "INSERT INTO __DEKU_SERVER__.REQUEST (__NUMBER__) VALUES (?)";
		mysqlConnection.query( insertQuery, message.length, (error, result) => {
			if( error ) {
				console.error("=> FAILED TO STORE SMS REQUEST");
				reject( error );
				return;
			}

			console.log("=> STORED IN DATABASE");
			resolve( result );
		})
	});
}

app.listen(APIOptions, ()=>{
	console.log("=> RECEIVING API BEGAN, RUNNING ON PORT [%d]", APIOptions.port);
});

app.post(configs.COMPONENT, async (req, res)=>{
	let request_body = req.body;
	console.log(request_body);

	if( !Array.isArray( request_body.messages ) ) {
		console.error("=> NOT VALID REQUEST!");
		res.status(400).end();
		return;
	}

	console.log("=> PROCESSING NEW REQUEST");
	// Store request and extract ID
	/*
	 * request_body.message
	 *
	*/
	let message = request_body.messages;
	try {
		let metaRequestWriteState = await meta_request_write( message );
		message.push( { req_id : metaRequestWriteState.insertId })
		res.status( 200 ).send ( metaRequestWriteState );

		// Send this to socket
		// Sends to first client it can find
		console.log("=> NUMBER OF CLIENTS: [%d]", in_cache_sockets.length );
		let socket = in_cache_sockets[0];
		sockets.sendMessage( message, socket );
	}
	catch ( error ) {
		res.status( 400 ).send( error )
	}

	res.end();
});

