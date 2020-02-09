

'use strict'


function readConfigs( config ) {
	switch( config ) {
		case 'system_configs':
			const path = "common_files/system_configs.env";
			require('dotenv').config({path: path.toString()})
		break;

		case 'return_values':
			const path = process.env.HOME + "common_files/return_values.env";
			require('dotenv').config({path: path.toString()})
		break;
	}
}
