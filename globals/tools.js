const mysql = require ( 'mysql' );
const queue = require ( './queue' );
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
	},

	sleep : function() {
		return new Promise( resolve => {
			console.log("tools.sleep=> going to sleep now...");
			setTimeout(()=>{
				console.log("tools.sleep=> awake now...");
				resolve();
			}, 5000);
		});
	}
};
