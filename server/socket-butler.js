const JsonSocket = require('json-socket');
const Queue = require ('./../globals/queue.js');
'use strict';


module.exports = 
class SocketButler {
//for you see, I'm simply one hell of a butler
	constructor() {
		const Socket = require ('net');
		this.socketContainer = [];
		this.pendingClientConnect = {};
		this.socket = new Socket.Server();
		this.socketConnectionOptions = {
			port : "8080",
			host : "localhost"
		}
	}

	start() {
		return new Promise( async (resolve, reject) => {
			this.socket.listen(this.socketConnectionOptions, ()=>{
				console.log("socket.listen=> listening on port ", this.socketConnectionOptions.port);
				this.socket.on('connection', ( socketClient )=>{
					console.log("socket.connection=> new connection made");
					socketClient = new JsonSocket ( socketClient );

					socketClient.on("message", ( jsData )=>{
						try{
							switch( jsData.type ) {
								case "auth":
								case "Auth":
								case "AUTH":
									if(!jsData.hasOwnProperty("UUID") || !jsData.hasOwnProperty("clientToken")) {
										console.log("socket:on:message=> not a valid socket client");
										socket.end();
										throw new Error("invalid client");
										return;
									}
									else {
										console.log("socket:on:message=> socket authentication token:", jsData.clientToken);
										socketClient.clientToken = jsData.clientToken;
										socketClient.UUID = jsData.UUID;
										socketButler.addClientSocket(socketClient);
										console.log("socket:on:message=> number of client sockets:", this.size());
									}
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

					socketClient.on("close",async ()=>{
						console.log("socket:on:disconnect=> a socket just disconnected");
						await this.removeClientSocket(socketClient.UUID, socketClient.clientToken)
						console.log("socket:on:close=> number of client sockets:", this.size());
					})

				})
				resolve();
			})
		})
	}

	size() {
		return this.socketContainer.length
	}

	addClientSocket(socket) {
		this.socketContainer.push( socket );
	}

	removeClientSocket(socketUUID, clientToken) {
		return new Promise( resolve => {
			for(let i=0;i<this.socketContainer.length;++i) {
				let socket = this.socketContainer[i];
				console.log("remove::client::checking=>", socketUUID, " against ", socket.UUID, "at index: ", i);
				if(socket.UUID == socketUUID && socket.clientToken == clientToken){
					socket.end();
					this.socketContainer.splice(i, 1);
					--i;
				}
			}
			resolve();
		});
	}


	async forward( request ) {
		console.log("socket-butler:forward=> new request:", request);
	}

}
