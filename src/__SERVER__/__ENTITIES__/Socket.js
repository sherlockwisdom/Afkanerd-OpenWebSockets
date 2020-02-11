

class SOCKETS {
	constructor( __ID__ ) {
		this.__ID__ = __ID__;
	}


	transmit( __MESSAGE__, __NUMBER__ ) {
		//TODO: Send this information
	}
	
	find( __ID__, __TOKEN__ ) {
	}

	get getErrorCode() {}

	start() {
		var __DBCLIENT__ = require('./__ENTITIES__/DBClient.js');
		let pendingPromise = new Promise( async (resolve, reject) => {
			let __CONNECTION_OPTIONS__ = {
				port = process.env.SOCKET_PORT;	
			}
			
			this.socket.listen(__CONNECTION_OPTIONS__, ()=>{
				resolve();
			});
		})

		this.socket.on('connection', ( client )=>{
			console.log("==================\n=> NEW CLIENT CONNECTION MADE\n===================");
			client = new JsonSocket ( client );

			//AUTHENTICATE IT
			client.sendMessage( "WAY", ( error )=>{
				if( error ) {
					console.log("=> FAILED T0 BROADCASET WAY");
					client.end();
				}
				else console.log("=> BROADCASTING WAY");
			});

			client.on('message', ( data )=>{
				if( !data.hasOwnProperty("__MESSAGE_TYPE__") ) return;

				//AUTHENTICATING
				if( data.__MESSAGE_TYPE__ == "__AUTH__" ) {
					let DBClient = new __DBCLIENT__( data.ID, data.TOKEN );
					if( this.collection.hasOwnProperty(data.ID + data.TOKEN) ) {
						console.log("=> CLIENT NOT BEING SURE...");
						client.sendMessage("=> I GOT YOU");
					}

					else {
						let validated_client = await DBClient.validate( data.ID, data.TOKEN );
						if( !validated_client) {
							client.sendEndMessage( "IDKY" );
						}

						this.collection[data.ID + data.TOKEN] = client;
						console.log("=> AUTHENTICATION ESTABLISHED");
					}
				}

				//TODO: What happens if it's an authenticated user
			})

			client.on("error",async ()=>{
				console.log("=> ERROR WITH CONNECTED CLIENT");
				this.removeClient( client );
			})

			client.on("close",async ()=>{
				console.log("=> CLIENT CONNECTION CLOSED");
				this.removeClient( client );
			})
		})
		return pendingPromise;
	}
}
