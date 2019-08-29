const net = require('net'),JsonSocket = require('json-socket');


var socketConnection = new net.Server;

socketConnection.on('connection', function(client) {
	client.setKeepAlive(true, 20000);
	console.log(`[ADDRESS]: ${client.remoteAddress}`)
	console.log(`[ADDRESS]: ${client.localAddress}`)
	client = new JsonSocket(client);

	client.on('close', function() {
		console.log(`Deleting client| ${client.id}`);
	});

	client.on('message', function(data) {
		console.log(`Client(${client.id}) message| ${data}`);
	});

	client.on('end', function() {
		console.log(`Client ended| ${client.id}`);
	});

	let sms_messages = [{
		"phoneumber" : "652156811",
		"message" : "Test Server Message",
		"service_provider" : "MTN"
	}, {
		"phonenumber" : "652156811",
		"message" : "Test Server Message 1",
		"service_provider" : "MTN"
	}]

	let information = {
		payload : sms_messages
	}

	information = JSON.stringify( information ) ;

	client.sendMessage( information );

});

socketConnection.listen( 8080 , function() {
	console.log(`Started SMS Gateway on port 6969`);
});
