// Boot up
// boot.js

var CONFIG_PATH

if( process.argv.length < 3 ) {
	// TODO, put some important message here to make the user aware of what's happening
	return;
}

for( let i in process.argv ) {
	if( process.argv[i] == "--c" ) {
		// TODO, check in here to make sure the next things are the required arguments
		CONFIG_PATH = process.argv[Number(i)+1];
	}
}

require('dotenv').config( { path: CONFIG_PATH } )
const Boots = require('./boot.js')

// console.log ( Boots.boot() )
var sysDetails = Boots.boot();

const Connection = require('./connection.js')
const connectionDetails = {
	connectionType : "server",
	listeningPort : sysDetails.CON_PORT
}
Connection.beginSocketConnection( connectionDetails );
