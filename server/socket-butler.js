const JsonSocket = require('json-socket');
const Queue = require ('./../globals/queue.js');
const Event = require('events');
'use strict';


module.exports = 
class SocketButler extends Event {
//for you see, I'm simply one hell of a butler
	constructor( mysqlConnection ) {
		super();
		const Socket = require ('net');
		this.socketContainer = [];
		this.pendingClientConnect = {};
		this.socket = new Socket.Server();
		this.socketConnectionOptions = {
			port : "8080",
			host : "localhost"
		}
		this.queue = new Queue(mysqlConnection);
		this.start().then((resolve)=>{
			this.emit('butler.ready');
		});
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
										socketClient.appType = jsDate.app_type;
										this.addClientSocket(socketClient);
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
		this.emit('new client');
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

	findClientSocket(clientToken, clientUUID) {
		for(let i=0;i<this.socketContainer.length;++i) {
			let socket = this.socketContainer[i];
			if(socket.UUID == clientUUID && socket.clientToken == clientToken)
				return socket;
		}
		throw new Error("socket not found");
	}


	forward( request ) { //the payload from the request being made
		console.log("socket-butler:forward=> new request:", request);
		if(!request.hasOwnProperty("appType") || !request.hasOwnProperty("payload") || !request.hasOwnProperty("clientUUID") ) {
			console.log("socket-butler:forward=> not a valid request");
			throw new Error("not a valid request");
		}
  
		else {
			let clientToken = request.clientToken;
			let clientUUID = request.clientUUID;
			let payload = request.payload;
			let appType = request.appType;
			try {
				try {
					let socket = this.findClientSocket(clientToken, clientUUID);
					if(typeof appType != "undefined" && socket.appType == appType ) socket.sendMessage( payload );
					else {
						console.log("socket-butler:forward=> found socket, but not matching appType");
						this.queue.insert(request);
						let error = new Error("socket not receipient to type of app");
						error.code = 501;
						throw error;
					}
				}
				catch( error ) {
					this.queue.insert(request);
					console.log("socket-butler:forward=> socket not connected...");
					error.code = 501;
					throw error;
				}
			}
			catch(error) { throw error; }
			return true;

		}
	}

}
