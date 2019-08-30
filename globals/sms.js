//TODO: number of modems

const { spawnSync, spawn } = require ('child_process');

const PATH_TO_SCRIPT = "../scripts/modem_information_extraction.sh";

function get_modem_indexes() {
	let args = [ "list" ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } )
	return std_out.stdout.split( '\n' );
}

function get_modem( index ) {
	
	let args = [ "extract", index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	
	return std_out.stdout.split( '\n' );
}


function get_sms_indexes( modem_index ) {
	
	let args = [ "sms", "all", modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	
	return std_out.stdout.split( '\n' );
}


function get_sms( modem_index, index ) {

	let args = [ "sms", "read_sms", index, modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	std_out = std_out.stdout.split( '\n' );
	
	return std_out;
}


function send_sms( modem_index, message, phonenumber ) {
	let args = [ "sms", "send", message, phonenumber, modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	
	return std_out.stdout.length < 1 ? std_out.stderr : std_out.stdout;
}


console.log( get_modem_indexes() );
console.log( get_modem( "6" ) );
console.log( get_sms_indexes( "6" ) );
console.log( get_sms( "5384" ) );
console.log( get_sms( "6", "5385" ) );
console.log( send_sms( "6", "Testing NodeJs lib", 652156811) );
