const mysql = require ( 'mysql' );
module.exports = {
	//TODO: remove this to processes so information can be shared on git
	mysql_connection : function() {
		return new Promise ( resolve => {
			let mysql_connection = mysql.createConnection({
				host : 'localhost',
				user : 'root',
				password : 'asshole',
				database : 'deku_logs'
			});
			resolve(mysql_connection);
		});
	}

};
