const Events = require('events');
const {spawn,spawnSync,fork} = require('child_process');


module.exports = 
class Sebastian extends Events {
	constructor() {
		super();

		this.pm2 = require('pm2');
	}

	restart() {
		
		this.pm2.connect(()=>{
			

			this.pm2.restart("all", (err, list) => {
				console.log(list);
			});
		});
	}

	update() {
		
		let options = {
			detached: true,
			stdio : ['inherit', 'inherit', 'inherit']
		}

		let data = {
			type : "git",
			payload : ["fetch", "--all"]
		}

		var newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		
		let outputs = newProcess.stdout;
		let stderrs = newProcess.stderr;

		data = {
			type : "git",
			payload : ["reset", "--hard", "origin/master"]
		}

		newProcess = spawn(data.type, data.payload, {"encoding":"utf8"});
		
		outputs = newProcess.stdout;
		stderrs = newProcess.stderr;

		console.log("Sebastian:update=> outputs:", outputs)
		console.log("Sebastian:update=> stderrs:", stderrs);

		//Remove Daemon compiled script
		data = {
			type : "rm",
			payload : ["../scripts/daemon"]
		}

		newProcess = spawn(data.type, data.payload, {"encoding":"utf8"});
		
		outputs = newProcess.stdout;
		stderrs = newProcess.stderr;

		console.log("Sebastian:update=> outputs:", outputs)
		console.log("Sebastian:update=> stderrs:", stderrs);
		if(outputs.length < 1 && stderrs.length > 0) {
			console.warn("Sebastian:make=> error has been detected...");
			//TODO: something goes in here
			data = {
				type : "make",
				payload : ["-C", "scripts/daemon"]
			}

			newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
			outputs = newProcess.stdout;
			stderrs = newProcess.stderr;

			console.log("Sebastian:make=> outputs:", outputs)
			console.log("Sebastian:make=> stderrs:", stderrs);
		}

		

		//Compile Daemon Scripts
		data = {
			type : "make",
			payload : ["-C", "../scripts/"]
		}

		newProcess = spawn(data.type, data.payload, {"encoding":"utf8"});
		outputs = newProcess.stdout;
		stderrs = newProcess.stderr;

		console.log("Sebastian:make=> outputs:", outputs)
		console.log("Sebastian:make=> stderrs:", stderrs);


		if(outputs.length < 1 && stderrs.length > 0) {
			console.warn("Sebastian:make=> error has been detected...");
			//TODO: something goes in here
			data = {
				type : "make",
				payload : ["-C", "scripts/"]
			}

			newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
			outputs = newProcess.stdout;
			stderrs = newProcess.stderr;

			console.log("Sebastian:make=> outputs:", outputs)
			console.log("Sebastian:make=> stderrs:", stderrs);
		}


		
		data = {
			type : "pm2",
			payload : ["restart", "all"]
		}

		newProcess = spawn(data.type, data.payload, options);
		/*this.pm2.connect(()=>{
			

			this.pm2.restart("all", (err, list) => {
				console.log(list);
			});
		});*/
	}

}

