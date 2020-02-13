
module.exports = 
class DBREQUEST {
	constructor( __MYSQL_CONNECTION__, __ID__  ) {
		this.__MYSQL_CONNECTION__ = __MYSQL_CONNECTION__;
		this.__ID__ = __ID__;
	}

	valid(__SMS_COLLECTION__) {
		return (__SMS_COLLECTION__.length > 0);
	}

	get data() {}

	insert(__USER_ID__, __SMS_COLLECTION__) {
		for(let i=0;i<__SMS_COLLECTION__;++i) 
			__SMS_COLLECTION__[i]["__USER_ID__"] = __USER_ID__;
		return new Promise((resolve,reject)=>{
			let query = "INSERT INTO __DEKU__.__REQUEST__ (__USER_ID__, __MESSAGE__, __PHONENUMBER__) VALUES ?";
			this.__MYSQL_CONNECTION__.query(query, [__USER_ID__, [__SMS_COLLECTION__]], ( error, result )=>{
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
