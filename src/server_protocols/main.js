// Boot up
// boot.js

var CONFIG_PATH
var socketConnection

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
const Connection = require('./connection.js')

// console.log ( Boots.boot() )
var sysDetails = Boots.boot()
var connectionDetails
connectionDetails.connectionType = "server"
connectionDetails.listeningPort = sysDetails.CON_PORT

(async ()=> {
	try {
	socketConnection = await Connection.beginSocketConnection( connectionDetails );
	}
	catch( connectionException ) {
	console.log( connectionException ) 
	exit;
	}
})();

var listeningDetails
listeningDetails.connection = socketConnection
Connection.startListening( listeningDetails )
