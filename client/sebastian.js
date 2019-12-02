const Events = require('events');
const {spawnSync,spawnSync,fork} = require('child_process');


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
			stdio: 'ignore'
			//stdio : ['inherit', 'inherit', 'inherit']
		}

		let data = {
			type : "git",
			payload : ["fetch", "--all"]
		}

		var newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		data = {
			type : "git",
			payload : ["reset", "--hard", "origin/master"]
		}

		newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		//newProcess.unref();

		//Remove Daemon compiled script
		data = {
			type : "rm",
			payload : ["../scripts/daemon"]
		}

		newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		newProcess.unref();
		if(outputs.length < 1 && stderrs.length > 0) {
			console.warn("Sebastian:make=> error has been detected...");
			//TODO: something goes in here
			data = {
				type : "rm",
				payload : ["-C", "scripts/daemon"]
			}

			newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
			//newProcess.unref();

		}

		

		//Compile Daemon Scripts
		data = {
			type : "make",
			payload : ["-C", "../scripts/"]
		}

		newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		//newProcess.unref();

		if(outputs.length < 1 && stderrs.length > 0) {
			console.warn("Sebastian:make=> error has been detected...");
			//TODO: something goes in here
			data = {
				type : "make",
				payload : ["-C", "scripts/"]
			}

			newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
			//newProcess.unref();
		}


		
		/*data = {
			type : "pm2",
			payload : ["restart", "all"]
		}*/

		newProcess = spawnSync(data.type, data.payload, options);
		//newProcess.unref();
		this.pm2.connect(()=>{
			

			this.pm2.restart("all", (err, list) => {
				console.log(list);
			});
		});
	}

}

