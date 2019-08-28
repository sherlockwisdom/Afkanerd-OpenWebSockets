//single or multiple request don't matter, for I do the management by myself

/*
 * DEPENDENCIES: 
 * 	MYSQL 
 * 		Database: deku_logs
 * 			write_ahead_log = last_read_index (int, defaults = 0), last_read_message_id (int, defaults = 0) , date (update on change)
 *			request = id, payload ( json ) , date ( date on write )
 *
 *
 */

const mysql = require ( 'mysql' );
const { spawnSync } = require ( 'child_process' );
const cron = require ( 'cron').CronJob;

var last_read_index = 0;
var last_read_message_id = 0;

const LINUX_SCRIPT_NAME = "./scripts/modem_information_extraction.sh";


//TODO: remove this to processes so information can be shared on git
var mysql_connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'asshole',
	database : 'deku_logs'
});


mysql_connection.connect( function( error ) {
	//TODO: put some log here to capture the error
});


//write-ahead log is saved on the database -> can be good for further things, but can't see that now

let get_write_ahead_log_query = "SELECT * FROM write_ahead_log";
mysql_connection.query( get_write_ahead_log_query, function ( error, results ) {
	if( error ) { //TODO: put some log here to capture the error
	}

	console.log( `[FETCHING WRITE_AHEAD_LOG]: ${ results.length } found!` );

	//check to make sure nothing is wrong with configurations
	
	//TODO: transform this into an installation process
	if( results.length < 1 ) {
		//nothing is put here, then put it
		let insert_default_values = `INSERT INTO write_ahead_log (last_read_index,last_read_message_id) VALUES (${last_read_index}, ${last_read_message_id})`;
		mysql_connection.query( insert_default_values, function( error, results ) {
			if( error ) { //TODO: put some log here to capture the error
				console.log( "[WRITE_AHEAD_LOG_DEFAULT_INSERT ERROR]:\n", error );
			}

			else {
				console.log( `[WRITE_AHEAD_LOG]: default values inserted` );
			}
		});
	}


	else {
		for( i in results) {
			last_read_index = results[i].last_read_index; //TODO: set this to 0 when done reading or by default
			last_read_message_id = results[i].last_read_message_id;
		}
	}


	console.log( `[LAST_READ_INDEX]: ${ last_read_index }` );
	console.log( `[LAST_READ_MESSAGE_ID]: ${ last_read_message_id }` );
});


//after doing all the continuations, it's time to begin the listening


//TODO: put some cron job here to tell it check after some setting minutes
//TODO: values of the cron job should be part of configuration (read from the database)

new cron( '20 * * * * *', function() {
	console.log( "[CRON]: checking for pending request..." );
	let get_requested_messages_query = "SELECT * FROM request WHERE ID >= ?";
	mysql_connection.query( get_requested_messages_query, last_read_index, function( error, results ) {
		
		if( error ) { //TODO: put some log here to capture the error
		}

		console.log( `[FETCHING REQUESTED MESSAGES]: ${ results.length } found!` );

		for( i in results) {
			
			let message_container = results[i].payload; //TODO: database field

			message = JSON.parse( message );

			let phonenumber = message_container.phonenumber;
			let message = message_container.message;
			let service_provider = message_container.service_provider; //TODO: use Bruce's rolls to govern how this works


			let args = [ "sms", "send", message, phonenumber, service_provider ];
			const linux_script_execution = spawnSync( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );

			var linux_script_execution_output = linux_script_execution.stdout;
			var linux_script_execution_return = linux_script_execution.status;


			//TODO: use an official logger here
			console.log( "[LINUX_SCRIPT_EXECUTION_OUTPUT]: ", linux_script_execution_output );
			console.log( "[LINUX_SCRIPT_EXECUTION_RETURN]: ", linux_script_execution_return );
		}
	});
});
