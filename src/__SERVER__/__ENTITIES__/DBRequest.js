
module.exports = 
class DBREQUEST {
	constructor( __MYSQL_CONNECTION__, __ID__  ) {
		this.__MYSQL_CONNECTION__ = __MYSQL_CONNECTION__;
		this.__ID__ = __ID__;
	}

	get valid() {}

	get data() {}

	insert(__ID__, __MESSAGE__, __PHONENUMBER__) {
		return new Promise((resolve, reject)=>{
			let query = "INSERT INTO __DEKU__.__REQUEST__ (__USER_ID__, __MESSAGE__, __PHONENUMBER__) VALUES (?, ?, ?)";
			this.__MYSQL_CONNECTION__.query(query, [__ID__, __MESSAGE__, __PHONENUMBER__], ( error, result )=>{
				if( error ) {
					console.log( error );
					reject( error );
				}
				
				console.log(result);
				resolve( result )
			});
		});
	}
}
