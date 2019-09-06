const Socket = require ('net');
const JsonSocket = require('json-socket');
const Queue = require ('./../globals/queue.js');



var socket = new Socket.Server();
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
					console.log("socket:on:message=> authentication message");
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

	socketClient.on("close", ()=>{
		console.log("socket:on:disconnect=> a socket just disconnected");
	})
})
