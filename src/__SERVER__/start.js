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

var writeToDatabase = ( message ) {
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

		let insertQuery = "INSERT INTO __DEKU_SERVER__.__REQUEST__ (__MESSAGE__, __PHONENUMBER__) VALUES ?";
		mysqlConnection.query( insertQuery, [ messages ], (error, result) => {
			if( error ) {
				console.error("=> FAILED TO STORE SMS REQUEST");
				reject( error );
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

	if( !Array.isArray( request_body ) ) {
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
	let message = request_body.message;
	try {
		let writeState = writeToDatabase( message );
		res.status( 200 ).send ( writeState );
	}
	catch ( error ) {
		res.status( 400 ).send( error )
	}
	res.status(200).end();
});

