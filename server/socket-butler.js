const JsonSocket = require('json-socket');
const Queue = require ('./../globals/queue.js');
const Event = require('events');
'use strict';


module.exports = 
class SocketButler extends Event {
//for you see, I'm simply one hell of a butler
	constructor( mysqlConnection ) {
		super();
		this.mysqlConnection = mysqlConnection;
		const Socket = require ('net');
		this.socketQueueContainer = {}
		this.socketContainer = [];
		this.pendingClientConnect = {};
		this.socket = new Socket.Server();
		this.socketConnectionOptions = {
			port : 8080
			//host : "localhost"
		}
		this.queue = new Queue(this.mysqlConnection);
		this.start().then((resolve)=>{
			this.emit('butler.ready');
		});

		this.on('new client', this.deQueue);
	}

	async deQueue(clientToken, clientUUID) {
		console.log("socket.deQueue=> client with token(%s) uuid(%s)", clientToken, clientUUID);
		if(!this.socketQueueContainer.hasOwnProperty(clientToken) || !this.socketQueueContainer[clientToken].hasOwnProperty(clientUUID)) {
			console.log("socket.enQueue=> creating new queue for client (%s)", clientToken);
			this.socketQueueContainer[clientToken] = {}
			this.socketQueueContainer[clientToken][clientUUID] = "";
			this.socketQueueContainer[clientToken][clientUUID] = new Queue(this.mysqlConnection)
		}
		else {
			let clientRequests = this.socketQueueContainer[clientToken][clientUUID];
			while(typeof clientRequests.getNext() != "undefined" || typeof clientRequests.getNext() === undefined) {
				this.forward(clientRequests.next());
			}
			clientRequests.empty();
		}
	}

	enQueue(clientToken, clientUUID, request) {
		console.log("socket.enQueue=> enqueing client token(%s) uuid(%s)", clientToken, clientUUID);
		if(!this.socketQueueContainer.hasOwnProperty(clientToken) || !this.socketQueueContainer[clientToken].hasOwnProperty(clientUUID)) {
			console.log("socket.enQueue=> creating new queue for client (%s)", clientToken);
			this.socketQueueContainer[clientToken] = {}
			this.socketQueueContainer[clientToken][clientUUID] = "";
			this.socketQueueContainer[clientToken][clientUUID] = new Queue(this.mysqlConnection)
		}
		this.socketQueueContainer[clientToken][clientUUID].insert(request);
		console.log(this.socketQueueContainer)
		console.log(this.socketQueueContainer[clientToken][clientUUID].size());
	}

	start() {
		return new Promise( async (resolve, reject) => {
			this.socket.listen(this.socketConnectionOptions, ()=>{
				console.log("socket.listen=> listening on port ", this.socketConnectionOptions.port);
				this.socket.on('connection', ( socketClient )=>{
					console.log("socket.connection=> new connection made");
					socketClient.setKeepAlive(true, 5000);
					socketClient = new JsonSocket ( socketClient );

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
		console.log("socket-butler:addClientSocket=> adding client with TOKEN (%s) and UUID (%s) and APP-TYPE (%s)", socket.clientToken, socket.clientUUID, socket.appType);
		this.emit('new client', socket.clientToken, socket.clientUUID);
	}

	removeClientSocket(socketUUID, clientToken) {
		return new Promise( resolve => {
			for(let i=0;i<this.socketContainer.length;++i) {
				let socket = this.socketContainer[i];
				console.log("socket-butler.removeClientSocket=>", socketUUID, " against ", socket.clientUUID, "at index: ", i);
				if(socket.clientUUID == socketUUID && socket.clientToken == clientToken){
					socket.end();
					this.socketContainer.splice(i, 1);
					--i;
				}
			}
			resolve();
		});
	}

	findClientSocket(clientToken, clientUUID) {
		console.log("socket-butler:findClientSocket=> finding (%s) - (%s)", clientToken, clientUUID);
		let socketContainer = []
		for(let i=0;i<this.socketContainer.length;++i) {
			let socket = this.socketContainer[i];
			console.log(socket.clientUUID, socket.clientToken);
			if(socket.clientUUID == clientUUID && socket.clientToken == clientToken)
				socketContainer.push(socket);
		}
		if(socketContainer.length < 1) throw new Error("socket not found");
		else return socketContainer;
	}


	forward( request ) { //the payload from the request being made
		//console.log("socket-butler:forward=> new request:", request);
		if(!request.hasOwnProperty("appType") || !request.hasOwnProperty("payload") || !request.hasOwnProperty("clientUUID") ) {
			console.log("socket-butler:forward=> not a valid request");
			throw new Error("not a valid request");
		}
		if(request.payload.length == 0 || Object.keys(request.payload).length == 0) {
			console.log("socket-butler:forward=> payload should not be empty!");
			throw new Error("payload should not be empty");
		}
  
		else {
			let clientToken = request.clientToken;
			let clientUUID = request.clientUUID;
			let payload = request.payload;
			let appType = request.appType;
			console.log("socket-butler:forward=> forwarding new request...");
			try {
				try {
					let sockets = this.findClientSocket(clientToken, clientUUID);
					for(let i in sockets) {
						let socket = sockets[i];
						if(!socket.isClosed()) {
							if(typeof appType != "undefined" && socket.appType.includes(appType) ) {
								socket.sendMessage( payload, (error)=>{
									console.log("socket-butler:forwarder=> sending payload..");
									console.log(payload);
									if(error) {
										console.log("socket-butler:forwarder:error=>", error.message);
										throw error;
									}
									else
									console.log("socket-butler:forwarder=> request made successfully!");
								});
							}
							else {
								console.log("socket-butler:forward=> found socket, but not matching appType");
								this.enQueue(clientToken, clientUUID, request);
								let error = new Error("socket not receipient to type of app");
								error.code = 501;
								throw error;
							}
						}
						else {
							console.log("socket-butler:foward=> socket is available but not connected, seems it failed throwing a disconnect event when it left");
							this.removeClientSocket(clientUUID, clientToken);
							//this.enQueue(clientToken, clientUUID, request);
							let error = new Error("socket not connected....");
							error.code=501;
							throw error;
						}
					}
				}
				catch( error ) {
					this.enQueue(clientToken, clientUUID, request);
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
