
module.exports = 
class DBREQUEST {
	constructor( __MYSQL_CONNECTION__, __ID__  ) {
		this.__MYSQL_CONNECTION__ = __MYSQL_CONNECTION__;
		this.__ID__ = __ID__;
	}

	valid(__MESSAGE__, __PHONENUMBER__) {
		if(typeof __MESSAGE__ == "undefined" || typeof __PHONENUMBER__ == "undefined"
		||
		__MESSAGE__ == "" || __PHONENUMBER__ == "") return false;
		return true;
	}

	get data() {}

	insert(__USER_ID__, __MESSAGE__, __PHONENUMBER__) {
		return new Promise((resolve,reject)=>{
			let query = "INSERT INTO __DEKU__.__REQUEST__ (__USER_ID__, __MESSAGE__, __PHONENUMBER__) VALUES (?, ?, ?)";
			this.__MYSQL_CONNECTION__.query(query, [__USER_ID__, __MESSAGE__, __PHONENUMBER__], ( error, result )=>{
				if( error ) {
					console.log( error );
					reject( error );
				}
				
				console.log(result);
				resolve( result.insertId )
			});
		});
	}
}
