const net = require('net');
const Queue = require('./../globals/queue.js');
const tools = require('./../globals/tools.js');

class SocketManager extends Queue {
	constructor() {
		super();
	}

	async forwarder( data, clientToken ) {
		try {
			let socket = this.findSocketByToken( clientToken );
			
			socket.write( JSON.stringify(data) );
		}

		catch( error ) {
			console.log("SocketManager:forwarded=> ", error.message);

			for(let i in data) data[i].access_token = clientToken;
			await this.hardInsert( data );
		}
	}

	async findSocketByToken( clientToken) {
		for(let i in this.container)
			if(this.container[i].clientToken == clientToken) 
				return this.container[i];

		throw new Error("socket not found for token");
	}

	async add ( clientSocket ) {

		this.container.push( clientSocket );
		
		let data = await this.hardLoad( clientToken );
		this.forwarder ( data, clientToken );
	}


	remove ( clientSocket ) {
		for(let i in this.container) {
			if(this.container[i].clientId == clientSocket.clientId && this.container[i].clientToken == clientSocket.clientToken) {
				this.container.splice(i, 1);
			}
		}
	}


	start() {
		return new Promise((resolve, reject)=> {
			let socket = new net.Server();
			let options = {
				port : 9090,
				host : "localhost"
			}

			socket.listen(options, ()=>{
				console.log("SocketManager:listening on port: ", options.port);
				resolve();
			});

			socket.on('connnection', ( clientSocket )=>{
				
				clientSocket.on('data', ( data )=> {
					try{
						data = JSON.parse( data );
						if(data.type == "auth") {
							let clientId = data.clientId;
							let clientToken = data.clientToken;
							clientSocket.clientId = clientId;
							clientSocket.clientToken = clientToken;
							this.add( clientSocket );
						}

						else {
							throw new Error("not valid message");
						}
					}
					catch(error) {
						console.log("SocketManager:start=> ", error.message);
					}
				})

				clientSocket.on('disconnect', ()=> {
					this.remove ( clientSocket );
				})
			})
		})
	}

}


let socketManager = new SocketManager;
socketManager.start();
