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
var cl_sockets;
var socket;
var in_cache_sockets = []
var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

(async ()=>{
	try{
		mysqlConnection = await MySQLConnector.getConnection(mysql_env_path);
		mysqlConnection.connect();
		console.log("=> MYSQL CONNECTION ESTABLISHED");
		
		cl_sockets = new Cl_Socket(mysqlConnection);
		socket = await cl_sockets.start();
	}
	catch(error) {
		console.log(error);
		return;
	}
})();


//=================================
var request_write = ( message )=> {
	return new Promise((resolve, reject)=> {
		let messages = (()=>{
			let v_data = []
			for(let i=0; i < message.length -1; ++i ) { 
				let req_id = message[message.length -1].req_id
				let msg = message[i].message
				let number = message[i].number
				v_data.push([req_id, msg, number]);
			}   
			return v_data;
		})();

		let insertQuery = "INSERT INTO __DEKU_SERVER__.__REQUEST__ (REQ_ID, __MESSAGE__, __PHONENUMBER__) VALUES ?";
		mysqlConnection.query( insertQuery, [messages], (error, result) => {
			if( error ) {
				console.error("=> FAILED TO STORE SMS REQUEST");
				reject( error );
				return;
			}

			console.log("=> REQUEST STORED IN DATABASE");
			resolve( result );
		})
	});
}

var meta_request_write = ( message )=> {
	return new Promise((resolve, reject)=> {
		let insertQuery = "INSERT INTO __DEKU_SERVER__.REQUEST (__NUMBER__) VALUES (?)";
		mysqlConnection.query( insertQuery, message.length, (error, result) => {
			if( error ) {
				console.error("=> FAILED TO STORE SMS REQUEST META-DATA");
				reject( error );
				return;
			}

			console.log("=> REQUEST META-DATA STORED IN DATABASE");
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

	let message = request_body.messages;

	// Write Requet meta information
	try {
		let metaRequestWriteState = await meta_request_write( message );
		message.push( { req_id : metaRequestWriteState.insertId })

	}
	catch ( error ) {
		res.status( 400 ).send( error )
	}

	// Write Request individual information
	try {
		await request_write( message );

	}
	catch ( error ) {
		res.status( 400 ).send( error )
	}
	res.status( 200 ).end();

	console.log("=> NUMBER OF CLIENTS: [%d]", in_cache_sockets.length );
	
	// TODO: Each message request could have an ID, but seems like an overkill for now
	let clientSocket = socket.connectedClients[0]; // TODO: Search for which socket this request is being sent to
	
	// Assumption: if client is currently connected
	let new_request_notification = {
		type : 'notification',
		message : 'new_request'
	}
	clientSocket.sendMessage( new_request_notification );
});

