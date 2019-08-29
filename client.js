//single or multiple request don't matter, for I do the management by myself

/*
 * DEPENDENCIES: 
 * 	MYSQL 
 * 		Database: deku_logs
 * 			write_ahead_log = LAST_READ_INDEX (int, defaults = 0), LAST_READ_MESSAGE_ID (int, defaults = 0) , date (update on change)
 *			request = id, payload ( json ) , date ( date on write )
 *
 *
 */
//TODO: remove all global variables to database configurations
'use strict';

const { spawnSync } = require ( 'child_process' );
const cron = require ( 'cron').CronJob;
const globals = require ( './globals/tools.js' );



var mysql_connection = "";

const LINUX_SCRIPT_NAME = "./scripts/modem_information_extraction.sh";
var LAST_READ_INDEX = 0;
var LAST_READ_MESSAGE_ID = 0;

function update_write_ahead_log( ) {

	return new Promise( resolve => {
		let data = {
			LAST_READ_INDEX : LAST_READ_INDEX,
			LAST_READ_MESSAGE_ID : LAST_READ_MESSAGE_ID
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
var cron_process = new cron( '*/5 * * * * *', async function() {
	console.log( "[CRON]: checking for pending request..." );

	let check_request = function() {
		return new Promise ( resolve => {
			let get_requested_messages_query = "SELECT * FROM request WHERE id >= ?";
			mysql_connection.query( get_requested_messages_query, [LAST_READ_MESSAGE_ID], async function( error, results ) {
				
				if( error ) { //TODO: put some log here to capture the error
					console.log( error );
				}

				console.log( `[CRON]: number of request = ${ results.length } found!` );

				let increment = false;
				if( LAST_READ_INDEX == -1) {
					LAST_READ_INDEX = 0;
					increment = true;
					console.log( `[CRON JOB]: last index changed to 0` );
				}
				
				for( let i in results) {
					await update_write_ahead_log();
					if( increment ) {
						increment = false;
						//console.log( `[LINUX_MESSAGE]: Incrementing to next message at ${results[i+1].id}` )
						if( typeof results[i+1] == "undefined" ) {
							LAST_READ_INDEX = -1;
							await update_write_ahead_log();
							break;
						}
						else continue;
					}

					//ERROR: GDBus.Error:org.freedesktop.ModemManager1.Error.Serial.ResponseTimeout: Serial command timed out = SENT
					else {
						
						console.log(`[CRON]: results index counter ${i} at request ID ${results[i].id}`);
						let message_container = results[i].payload; //TODO: database field
						LAST_READ_MESSAGE_ID = results[i].id;
						await update_write_ahead_log();

						message_container = JSON.parse( message_container );
						
						//TODO: should continue i from last place message was read
						
						for( let j in message_container ) {
							console.log(`[STATE]: sending sms ${j} for request ${results[i].id}`);
							let phonenumber = message_container[j].phonenumber;
							let message = message_container[j].message;
							let service_provider = message_container[j].service_provider; //TODO: use Bruce's rolls to govern how this works


							let args = [ "sms", "send", message, phonenumber, "5" ]; //service provider not in script, should be modem index... since that can't be known
							const linux_script_execution = spawnSync( LINUX_SCRIPT_NAME, args, { "encoding" : "utf8" } );

							//var linux_script_execution_output = linux_script_execution.stdout;
							//var linux_script_execution_return = linux_script_execution.status;
							console.log( linux_script_execution );


							//TODO: use an official logger here
							//console.log( "[LINUX_SCRIPT_EXECUTION_OUTPUT]: ", linux_script_execution_output );
							//console.log( "[LINUX_SCRIPT_EXECUTION_RETURN]: ", linux_script_execution_return );

							LAST_READ_INDEX = j;
							await update_write_ahead_log( );
						}

					}
					LAST_READ_INDEX = -1;
					await update_write_ahead_log();
					console.log('[CRON]: DONE\n\n');
				}
				console.log('[CRON]: sending resolve');
				resolve(true);
			});
		});
	}
	cron_process.stop();
	var state = await check_request();
	if( state ) cron_process.start();
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
				let insert_default_values = `INSERT INTO write_ahead_log (LAST_READ_INDEX,LAST_READ_MESSAGE_ID) VALUES (${LAST_READ_INDEX}, ${LAST_READ_MESSAGE_ID})`;
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
					LAST_READ_INDEX = results[i].last_read_index; //TODO: set this to 0 when done reading or by default
					LAST_READ_MESSAGE_ID = results[i].last_read_message_id;
				}
				console.log( `[LAST_READ_INDEX]: ${ LAST_READ_INDEX }` );
				console.log( `[LAST_READ_MESSAGE_ID]: ${ LAST_READ_MESSAGE_ID }` );
			}


			
			resolve(true);
		});
	});

}


//begin with checking configurations
async function start_script() {
	mysql_connection = await globals.mysql_connection();
	mysql_connection.connect( function ( error ) {
		if( error ) { //TODO: put some log here to capture the error
			console.log("[MYSQL CONNECTION EROR]: ", error);
			return; //kills script here because important parts can't go undocumented
		}
	});

	console.log("[START SCRIPT]: checking configurations...");
	
	let configuration_results = await check_configurations();

	configuration_results ? console.log( "[START SCRIPT]: DONE!" ) : console.log( "[START SCRIPT]: FAILED..." );
	
	console.log( "[STATE]: first cron begins after 20 seconds...." );
//	cron_daemon( "start" );
	await cron_process.start();
}

//begin first script
start_script();
