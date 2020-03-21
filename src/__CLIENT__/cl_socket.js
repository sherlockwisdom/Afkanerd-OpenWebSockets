var __DBCLIENT__ = require('./../__ENTITIES__/DBClient.js');
var __MYSQL_CONNECTOR__ = require('./../MYSQL_CONNECTION.js');
const JsonSocket = require('json-socket');
const Socket = require ('net');
'use strict'

module.exports =
class Cl_Socket {
	constructor() {}

	connect(__SERVER_HOST__, __SERVER_PORT__) {
		return new Promise((resolve, reject)=>{
			let clientSocket = new JsonSocket( new Socket.Socket() );	
			
			//console.log("... connecting tcp host: %s", __SERVER_HOST__);
			//console.log("... connecting tcp port: %s", __SERVER_PORT__);

			clientSocket.connect(__SERVER_PORT__, __SERVER_HOST__);

			clientSocket.on('connect', ()=>{
				resolve( clientSocket );
			});

			clientSocket.on('error', ( error )=>{
				reject( error );
			});

			clientSocket.on('close', ()=>{
				//resolve(false);
			});

		});

	}
}
