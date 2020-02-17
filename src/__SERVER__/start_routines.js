const __MYSQL_CONNECTION__ = require ( 'mysql' );

'use strict'

module.exports = {
	READCONFIGS : ( config )=> {
		let path = "";
		switch( config ) {
			case 'system_configs':
				path = "src/__SERVER__/__COMMON_FILES__/system_configs.env";
				require('dotenv').config({path: path.toString()})
				
				return process.env;
			break;

			case 'return_values':
				path = "src/__SERVER__/__COMMON_FILES__/return_values.env";
				require('dotenv').config({path: path.toString()})

				return process.env;
			break;
		}
	},

	GET_MYSQL_CONNECTION : ()=> {
		return new Promise ( (resolve, reject) => {
			let path = "src/__SERVER__/__COMMON_FILES__/mysql.env";
			require('dotenv').config({path: path.toString()})
			try{
				let mysql_connection = __MYSQL_CONNECTION__.createConnection({
					host : process.env.MYSQL_HOST,
					user : process.env.MYSQL_USER,
					password : process.env.MYSQL_PASSWORD,
					database : process.env.MYSQL_DATABASE
				});
				resolve(mysql_connection);
			}
			catch(error) {
				reject(error)
			}
		});
	}
}
