'use strict'

module.exports = {
	GET_MYSQL_CONNECTION : (env_path)=> {
		return new Promise ( (resolve, reject) => {
			require('dotenv').config({path: env_path.toString()})
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
