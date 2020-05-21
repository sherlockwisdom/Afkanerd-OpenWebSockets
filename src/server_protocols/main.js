// Boot up
// boot.js

var CONFIG_PATH

if( process.argv.length < 3 ) {
	// something important goes here
	
	return;
}

for( let i in process.argv ) {
	// console.log( process.argv[i] );
	if( process.argv[i] == "--c" ) {
		// TODO, check in here to make sure the next things are the required arguments
		CONFIG_PATH = process.argv[Number(i)+1];
	}
}

console.log( CONFIG_PATH )
require('dotenv').config( { path: CONFIG_PATH } )
const boot = require('./boot.js')

boot();
