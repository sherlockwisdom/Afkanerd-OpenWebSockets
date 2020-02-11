

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
		return new Promise( async (resolve, reject) => {
			this.socket.listen(this.socketConnectionOptions, ()=>{});
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
				if( typeof data.__MESSAGE_TYPE__ == "undefined" ) return;

				if( data.__MESSAGE_TYPE__ == "__AUTH__" ) {
					let DBClient = new __DBCLIENT__( data.ID, data.TOKEN );
					let validated_client = await DBClient.validate( data.ID, data.TOKEN );
					if( !validated_client) {
						client.sendEndMessage( "IDKY" );
					}

					this.collection[data.ID + data.TOKEN] = client;
					console.log("=> AUTHENTICATED ESTABLISHED");
				}
						
			})
		})

		socketClient.on("message", ( jsData )=>{
			try{
				switch( jsData.type ) {
					case "auth":
					case "Auth":
					case "AUTH":
						if(!jsData.hasOwnProperty("UUID") || !jsData.hasOwnProperty("clientToken") || !jsData.hasOwnProperty("appType")) {
							console.log("socket:on:message=> not a valid socket client");
							console.log(jsData);
							socket.end();
							throw new Error("invalid client");
							return;
						}
						else {
							console.log("socket:on:message=> socket authentication token:", jsData.clientToken);
							socketClient.clientToken = jsData.clientToken;
							socketClient.clientUUID = jsData.UUID;
							socketClient.appType = jsData.appType; //This is still JSON object
							this.addClientSocket(socketClient);
							console.log("socket:on:message=> number of client sockets:", this.size());
						}
					break;

					case "confirmation":
						console.log("socket.on:message=> confirmation from client|||");
						console.log(jsData);
					break;

					default:
						throw new Error("invalid message type");
					break;
				}
			}
			catch(error) {
				console.log("socket:on:message:error=> ", error.message);
			}
		})


			socketClient.on("error",async ()=>{
				console.log("socket:on:disconnect=> a socket just ended");
				socketClient.end();
				await this.removeClientSocket(socketClient.clientUUID, socketClient.clientToken)
				console.log("socket:on:close=> number of client sockets:", this.size());
			})
			socketClient.on("close",async ()=>{
				console.log("socket:on:disconnect=> a socket just disconnected");
				socketClient.end();
				await this.removeClientSocket(socketClient.clientUUID, socketClient.clientToken)
				console.log("socket:on:close=> number of client sockets:", this.size());
			})
		resolve();
	})
	}
}
