const net = require ( 'net' );
const globals = require ( './globals/tools.js' );
const json_socket = require ( 'json-socket' );
const { spawn } = require ( 'child_process' );

'use strict';


var mysql_connection = "";

var HOST = "localhost";
var PORT = 8080;
var RECONNECTION_TIMEOUT = 10000;
var LINUX_SCRIPT_NAME = "./scripts/modem_information_extraction.sh";

function sms_daemon_script() {
	
	let args = ["sms", "received"];
	const linux_script_execution = spawn ( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );
	
	linux_script_execution.stdout.on( 'data', function ( data ) {
		console.log( "[DEKU SERVER TERMINAL]: ", data );
	});

	linux_script_execution.on( 'close' , function ( code ) {
		console.log( "[DEKU SERVER TERMINAL TERMINATED]: ", code )
	});

	linux_script_execution.stderr.on( 'data', function ( data ) {
		console.warn ( "[DEKU SERVER TERMINAL]: ", data );
	});

	linux_script_execution.on( 'error', function ( error ) {
		console.warn ( "[DEKU SERVER TERMINAL ERROR]: ", error) 
	});

}


function listeners ( state , listener_type ) {
	let connection_to_server = "";

	switch ( state ) {
		case 'start':
			connection_to_server = new json_socket( net.connect( PORT, HOST ) );
			
			//SERVER CREATES CONNECTION FROM THIS CLIENT TO ANOTHER SERVER
			connection_to_server.on( 'connect', function() {
				//TODO: print out some important server details here
				
				console.log( "[CONNECTION TO SERVER]: new connection established with details" );
			});

			//SERVER CONNECTION RECEIVES A MESSAGE
			connection_to_server.on( 'message', function( data ) {
				try {
					request = JSON.parse ( data );
				}
				catch ( error ) {
					console.log( "[CONNECTION TO SERVER ON MESSAGE]: not a json request..." );
					console.log( "[CONNECTION TO SERVER ON MESSAGE]: message of type ", typeof data );
				}
			});

			//SERVER CONNECTION HAS AN ERROR
			connection_to_server.on( 'error', function ( error ) {
				console.log( "[CONNECTION TO SERVER ERROR]: ", error );
			});

			//SERVER CONNECTION IS CLOSED
			connection_to_server.on( 'close', function () {
				console.log( "[CONNECTION TO SERVER]: socket connection closed" ); //provide more details about socket that closed
				setTimeout( function () {
					console.log( "[CONNECTION TO SERVER]: attempting a reconnect...");
					listeners ( "start", "socket" );

				}, RECONNECTION_TIMEOUT);
			});

			if( typeof listener_type == "undefined" ) sms_daemon_script ();
			break;
	}
}


async function start_script() {
	mysql_connection = await globals.mysql_connection();
	mysql_connection.connect();

	listeners ( 'start' );

}



start_script();
