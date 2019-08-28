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
'use strict';

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


function update_write_ahead_log( ) {

	return new Promise( resolve => {
		let data = {
			last_read_index : last_read_index,
			last_read_message_id : last_read_message_id
		}

		let update_write_ahead_query = "UPDATE write_ahead_log SET ?";
		mysql_connection.query( update_write_ahead_query, data, function( error, results ) {
			if( error ) { //TODO: put some log here to capture the error
				console.log( error );
			}

			else {
				console.log( "[UPDATE WRITE_AHEAD_LOG]: DONE!" );
			}
			
		});
		resolve();
	});
}



//TODO: put some cron job here to tell it check after some setting minutes
//TODO: values of the cron job should be part of configuration (read from the database)
var cron_process = new cron( '*/20 * * * * *', function() {
	console.log( "[CRON]: checking for pending request..." );
	let get_requested_messages_query = "SELECT * FROM request WHERE ID >= ?";
	mysql_connection.query( get_requested_messages_query, last_read_index, async function( error, results ) {
		
		if( error ) { //TODO: put some log here to capture the error
		}

		console.log( `[FETCHING REQUESTED MESSAGES]: ${ results.length } found!` );

		for( let i in results) {
			
			let message_container = results[i].payload; //TODO: database field
			last_read_message_id = results[i].id;
			await update_write_ahead_log();

			message_container = JSON.parse( message_container );
			
			//TODO: should continue i from last place message was read
			for( let i in message_container ) {
				let phonenumber = message_container[i].phonenumber;
				let message = message_container[i].message;
				let service_provider = message_container[i].service_provider; //TODO: use Bruce's rolls to govern how this works


				let args = [ "sms", "send", message, phonenumber, service_provider ]; //service provider not in script, should be modem index... since that can't be known
				const linux_script_execution = spawnSync( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );

				var linux_script_execution_output = linux_script_execution.stdout;
				var linux_script_execution_return = linux_script_execution.status;


				//TODO: use an official logger here
				console.log( "[LINUX_SCRIPT_EXECUTION_OUTPUT]: ", linux_script_execution_output );
				console.log( "[LINUX_SCRIPT_EXECUTION_RETURN]: ", linux_script_execution_return );
				
				last_read_index = i;
				await update_write_ahead_log( );
			}

			last_read_index = 0;
			await update_write_ahead_log();
		}
	});
}, null);

//FUNCTION CHECK FOR CONFIGURATIONS
function check_configurations() {

	return new Promise( resolve => {
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
				for( let i in results) {
					last_read_index = results[i].last_read_index; //TODO: set this to 0 when done reading or by default
					last_read_message_id = results[i].last_read_message_id;
				}
			}


			console.log( `[LAST_READ_INDEX]: ${ last_read_index }` );
			console.log( `[LAST_READ_MESSAGE_ID]: ${ last_read_message_id }` );
			
			resolve(true);
		});
	});

}


//begin with checking configurations
async function start_script() {
	console.log("[START SCRIPT]: checking configurations...");
	
	let configuration_results = await check_configurations();

	configuration_results ? console.log( "[START SCRIPT]: DONE!" ) : console.log( "[START SCRIPT]: FAILED..." );
	
	console.log( "[STATE]: first cron begins after 20 seconds...." );
//	cron_daemon( "start" );
	await cron_process.start();
}

//begin first script
start_script();
