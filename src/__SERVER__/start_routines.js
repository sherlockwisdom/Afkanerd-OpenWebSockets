

'use strict'

module.exports = 
function READCONFIGS( config ) {
	let path = "";
	switch( config ) {
		case 'system_configs':
			path = "__COMMON_FILES__/system_configs.env";
			require('dotenv').config({path: path.toString()})
			
			return process.env;
		break;

		case 'return_values':
			path = "__COMMON_FILES__/return_values.env";
			require('dotenv').config({path: path.toString()})

			return process.env;
		break;
	}
}
