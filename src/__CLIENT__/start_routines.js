const __MYSQL_CONNECTION__ = require ( 'mysql' );

'use strict'

module.exports = {
	READCONFIGS : ( config )=> {
		let path = "";
		switch( config ) {
			case 'system_configs':
				path = "src/__CLIENT__/__COMMON_FILES__/system_configs.env";
				console.log("=> %s: %s", config, path);
				require('dotenv').config({path: path.toString()})
				
				return process.env;
			break;

			case 'return_values':
				path = "src/__CLIENT__/__COMMON_FILES__/return_values.env";
				console.log("=> %s: %s", config, path);
				require('dotenv').config({path: path.toString()})

				return process.env;
			break;
		}
	}

}
