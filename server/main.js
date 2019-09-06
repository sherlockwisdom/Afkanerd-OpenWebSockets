const SocketButler = require('./socket-butler.js');
const Tools = require('./../globals/tools.js');

'use strict';

async function main() {

	let mysqlConnection = await Tools.mysql_connection();
	var socketButler = new SocketButler(mysqlConnection);
	await socketButler.start();


	let mostImportantRequest = {
		type : "forward",
		clientToken : "12345",
		clientUUID : "0000",
		payload : {
			type : "terminal",
			payload : {
				terminalType : "update"
			}
		}
	}

	socketButler.forward(mostImportantRequest);
	
	var count = 0;
	socketButler.on('new client', ()=>{
		console.log('main:event:socket-butler:new-client');
		if(count == 0) socketButler.forward(mostImportantRequest);
		count=1;
	});
}


main();



//TODO: check up who keeps the keep alive message, if not... there's not need for that
//TODO: client socket.uuid(assigned after connection) is linked to socket.token (gotten after connection)
//TODO: when request is made(iterating through uuid to get socket with requested token and request is forwarded)
//TODO: @cool idea@ after doing the above, all sockets with token are gotten and each socket is checked for [request type] and message is forwarded if message and request type are same - default, if only 1 socket send message regardless, (if more than 1 socket - shit men, this is just cool)
