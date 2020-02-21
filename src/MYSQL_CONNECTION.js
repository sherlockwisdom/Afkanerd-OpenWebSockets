'use strict'

module.exports = {
	GET_MYSQL_CONNECTION : ()=> {
		return new Promise ( (resolve, reject) => {
			let path = "__COMMON_FILES__/mysql.env";
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
