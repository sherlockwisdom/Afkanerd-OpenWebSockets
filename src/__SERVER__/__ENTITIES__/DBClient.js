
'use strict'
module.exports = 
class DBCLIENT {
	constructor( __MYSQL_CONNECTION__, __ID__, __TOKEN__ ) {
		this.__ID__ = __ID__;
		this.__TOKEN__ = __TOKEN__;
		this.__MYSQL_CONNECTION__ = __MYSQL_CONNECTION__;
	}

	validate( __ID__, __TOKEN__ ) {
		return new Promise((resolve, reject)=>{
			let query = "SELECT __ID__, __TOKEN__ FROM __DEKU__.__CLIENTS__ WHERE __CLIENTS__.__ID__ = ? AND __CLIENTS__.__TOKEN__ = ?";
			this.__MYSQL_CONNECTION__.query( query, [ __ID__, __TOKEN__ ], (error, result)=>{ //TODO: Not sure about this
				if( error ) {
					//TODO: Only notice
					reject(error);

					return;
				}
				if( typeof result[0].__ID__ == "undefined" || typeof result[0].__TOKEN__ == "undefined"){ 
					console.error("=> Cannot find __ID__ or __TOKEN__ in results");
					resolve(false);
				}

				if( result[0].__ID__ == __ID__ && result[0].__TOKEN__ == __TOKEN__ ) resolve( true );
				
				resolve(false);
			})	
		});
	}

	async validateTokenOnly( __TOKEN__ ) {
		return new Promise((resolve, reject)=>{
			let query = "SELECT __ID__ FROM __DEKU__.__CLIENTS__ WHERE __CLIENTS__.__TOKEN__ = ?";
			this.__MYSQL_CONNECTION__.query( query, [ __TOKEN__ ], (results, error)=>{ //TODO: Not sure about this
				if( error ) {
					//TODO: Only notice
					reject(error);
				}

				if( typeof result[0].__TOKEN__ == "undefined"){ 
					console.error("=> Cannot find __ID__ or __TOKEN__ in results");
					resolve(false);
				}

				if( result[0].__TOKEN__ == __TOKEN__ ) resolve( true );
				
				resolve(false);
			})	
		});
	}
}
