const SocketButler = require('./socket-butler.js');

'use strict';

async function main() {


	var socketButler = new SocketButler;
	await socketButler.start();


	let mostImportantRequest = {
		type : "forward",
		clientToken : "12345",
		UUID : "0000",
		payload : {
			type : "git",
			payload : ["pull", "origin", "master"]
		}
	}
	socketButler.forward(mostImportantRequest);
}


main();



//TODO: check up who keeps the keep alive message, if not... there's not need for that
//TODO: client socket.uuid(assigned after connection) is linked to socket.token (gotten after connection)
//TODO: when request is made(iterating through uuid to get socket with requested token and request is forwarded)
//TODO: @cool idea@ after doing the above, all sockets with token are gotten and each socket is checked for [request type] and message is forwarded if message and request type are same - default, if only 1 socket send message regardless, (if more than 1 socket - shit men, this is just cool)
