const net = require ( 'net' );
const globals = require ( './globals/tools.js' );
const json_socket = require ( 'json-socket' );
const { spawnSync, spawn } = require ( 'child_process' );
const cron = require ( 'cron').CronJob;

'use strict';


var mysql_connection = "";

var HOST = "localhost";
var PORT = 8080;
var RECONNECTION_TIMEOUT = 10000;
var LINUX_SCRIPT_NAME = "./scripts/modem_information_extraction.sh";


async function log ( data ) {

}

let cron_job = new cron('*/5 * * * * *', function() {
	
	console.log( "[SMS DAEMON CHECKING RECEIVED]: started...");
	let modem_index = 4; //please remove this line, this can only be used when it's definite
	let args = ["sms", "received", modem_index];
	const linux_script_execution = spawnSync ( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );

	//SHOULD BE THE INDEXES OF MESSAGES COMING IN
	let linux_script_execution_STDOUT = linux_script_execution.stdout;
	let linux_script_execution_RETURN = linux_script_execution.status;

	//console.log( "[SMS_DAEMON_SCRIPT_TERMINAL_OUTPUT]: ", linux_script_execution_STDOUT );
	if( linux_script_execution_STDOUT.length < 1 ) {}

	let sms_message_indexes = linux_script_execution_STDOUT.split( '\n' );
	
	for( let i in sms_message_indexes ) {
		if( sms_message_indexes[i].length > 0 ) console.log( '[SMS_DAEMON_SCRIPT]: received message index = ', sms_message_indexes[i] );

		let args = [ "sms", "read_sms", sms_message_indexes[i], modem_index ]
		const linux_sms_message_execution = spawnSync ( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );
	
		let sms_message_container_STDOUT = linux_sms_message_execution.stdout;
		let sms_message_container = sms_message_container_STDOUT.split( '\n' );

		if(sms_message_container.length < 3 || sms_message_container[ 1 ].length < 1 ) {
			//console.log( `[SMS_DAEMON_SCRIPT_TERMINAL_OUTPUT]: skipping message at ${sms_message_indexes[i]}`);
		}
		else {
			let phoneumber = sms_message_container[ 0 ];
			let message = sms_message_container[ 1 ];
			let timestamp = sms_message_container[ 2 ];

			console.log( `[SMS_DAEMON_SCRIPT_(SMS_MESSAGE)]: ${message}`);
		}
	}

	console.log( "[SMS DAEMON CHECKING RECEIVED]: done...");
}, null);

function sms_daemon_script() {
	cron_job.start();
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
				console.log("[SERVER SOCKET CONNECTION]: conneciton made...");
				try {
					let request = JSON.parse ( data );

					let insert_into_request_query = `INSERT INTO request (payload) VALUES ('${JSON.stringify( request.payload )}')`;
					mysql_connection.query( insert_into_request_query, function ( error, results) {
						if( error ) { //TODO: put some message here
							console.log( "[SERVER ON MESSAGE]: ", error);
						}
					});
				}
				catch ( error ) {
					console.log( "[CONNECTION TO SERVER ON MESSAGE]: not a json request..." );
					console.log( "[CONNECTION TO SERVER ON MESSAGE]: message of type ", typeof data );
					console.log( error );
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

			//if( typeof listener_type == "undefined" ) sms_daemon_script ();
			break;
	}
}


async function start_script() {
	mysql_connection = await globals.mysql_connection();
	mysql_connection.connect();

	listeners ( 'start' );

}



start_script();
