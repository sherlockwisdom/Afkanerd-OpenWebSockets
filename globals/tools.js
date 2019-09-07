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
	},

	getCMServiceProviders : function( number ) {
		console.log("tools:getCMServiceProvider: ", number);
		if(number.length != 9 && number.length != 12) {
			throw new Error(number.length);
			return;
		}
		if(number.length == 12) number = number.substr(4);
		if(number[0] == '6' && number[1] == '5') {
			switch( number[2]) {
				case '0':
				case '2':
				case '4':
					return "MTN";
				break;

				case '5':
				case '9':
					return "ORANGE";
				break;

				default:
					throw new Error("type is not MTN nor Orange");
				break;

			}
		}
		else if(number[0] == "6" && number[1] == "8") return "MTN";
		else if(number[0] == "6" && number[1] == "6") return "NEXTEL";
		else throw new Error("cannot determine number type");
	}
};
