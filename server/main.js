const Socket = require ('net');
const JsonSocket = require('json-socket');
const Queue = require ('./../globals/queue.js');


class SocketButler {
//for you see, I'm simply one hell of a butler
	constructor() {
		this.socketContainer = [];
		this.pendingClientConnect = {};
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
					//Rather unfor
				}
			}
			resolve();
		});
	}

}



var socket = new Socket.Server();
var socketButler = new SocketButler;
var options = {
	port : "8080",
	host : "localhost"
}


socket.listen(options, ()=>{
	console.log("socket.listen=> listening on port ", options.port);
})


socket.on('connection', ( socketClient )=>{
	console.log("socket.connection=> new connection made");
	socketClient = new JsonSocket ( socketClient );

	socketClient.on("message", ( jsData )=>{
		try{
			//Important note, messages coming in here a Json Object, do not need further parsing
			switch( jsData.type ) {
				case "auth":
				case "Auth":
				case "AUTH":
					if(!jsData.hasOwnProperty("UUID") || !jsData.hasOwnProperty("clientToken")) {
						console.log("socket:on:message=> not a valid socket client");
						//socketClient.sendEndMessage("who tf are you??"); got an endless loop, find another safe way to kill
						throw new Error("invalid client");
						return;
					}
					else {
						console.log("socket:on:message=> socket authentication token:", jsData.clientToken);
						socketClient.clientToken = jsData.clientToken;
						socketClient.UUID = jsData.UUID;
						socketButler.addClientSocket(socketClient);
						console.log("socket:on:message=> number of client sockets:", socketButler.size());
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
		await socketButler.removeClientSocket(socketClient.UUID, socketClient.clientToken)
		console.log("socket:on:close=> number of client sockets:", socketButler.size());
	})
})

//TODO: check up who keeps the keep alive message, if not... there's not need for that
//TODO: client socket.uuid(assigned after connection) is linked to socket.token (gotten after connection)
//TODO: when request is made(iterating through uuid to get socket with requested token and request is forwarded)
//TODO: @cool idea@ after doing the above, all sockets with token are gotten and each socket is checked for [request type] and message is forwarded if message and request type are same - default, if only 1 socket send message regardless, (if more than 1 socket - shit men, this is just cool)
