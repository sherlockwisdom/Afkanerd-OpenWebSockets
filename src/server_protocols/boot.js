/*
##### Server Protocols:
###### Booting [SP1]:
1. __Checks custom configuration files__ __[SP2]__ __[EP1]__ __[ FP1 ]__
    * If files are absent __[SP2]__
      * It complains and exits __[EP2]__
    * If files are present but incomplete or invalid 
      * It complains and exists __[EP2]__
*/

// Boot should check if passed in configurations match enough details for server to startup
function boot() {
	// console.log( process.env )

	let MYSQL_DATABASE = process.env.MYSQL_DATABASE;
	let MYSQL_USER = process.env.MYSQL_USER;
	let MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
	let MYSQL_SERVER = process.env.MYSQL_SERVER;

	if( typeof MYSQL_SERVER == "undefined")
		console.error(">> EP2: ","MYSQL_SERVER Configuration not found. Exiting.")
	if( typeof MYSQL_PASSWORD == "undefined")
		console.error(">> EP2: ","MYSQL_PASSWORD Configuration not found. Exiting.")
	if( typeof MYSQL_DATABASE == "undefined")
		console.error(">> EP2: ","MYSQL_DATABASE Configuration not found. Exiting.")
	if( typeof MYSQL_USER == "undefined")
		console.error(">> EP2: ","MYSQL_USER Configuration not found. Exiting.")

	return {
		MYSQL_DATABASE : MYSQL_DATABASE,
		MYSQL_USER : MYSQL_USER,
		MYSQL_PASSWORD : MYSQL_PASSWORD,
		MYSQL_SERVER : MYSQL_SERVER
	};
}


var Boots = {
	boot : function() { return boot() }
}

// Exported modules
module.exports = Boots
