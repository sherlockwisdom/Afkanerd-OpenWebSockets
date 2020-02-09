

class DBCLIENT {
	constructor( __ID__, __TOKEN__ ) {
		this.__ID__ = __ID__;
		this.__TOKEN__ = __TOKEN__;
	}

	async validate( __ID__, __TOKEN__ ) {
		return new Promise((resolve, reject)=>{
			let query = "SELECT __ID__, __TOKEN__ FROM __DEKU_CLIENT__ WHERE __DEKU_CLIENT__.__ID__ = ? AND __DEKU_CLIENT__.__TOKEN__ = ?";
			MySQLConnection.query( query, [ __ID__, __TOKEN__ ], (results, error)=>{ //TODO: Not sure about this
				if( error ) {
					//TODO: Only notice
					reject();
				}

				if( result[0].__ID__ == __ID__ && result[0].__TOKEN__ == __TOKEN__ ) resolve( true );
				resolve( false );
			})	
		});
	}

	async validateTokenOnly( __TOKEN__ ) {
		return new Promise((resolve, reject)=>{
			let query = "SELECT __ID__ FROM __DEKU_CLIENT__ WHERE __DEKU_CLIENT__.__TOKEN__ = ?";
			MySQLConnection.query( query, [ __TOKEN__ ], (results, error)=>{ //TODO: Not sure about this
				if( error ) {
					//TODO: Only notice
					reject();
				}

				if( result[0].__ID__ == __ID__ && result[0].__TOKEN__ == __TOKEN__ ) resolve( true );
				resolve( false );
			})	
		});
	}
}
