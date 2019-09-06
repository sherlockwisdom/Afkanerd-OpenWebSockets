const Events = require('events');
const {spawn,spawnSync,fork} = require('child_process');


module.exports = 
class Sebastian extends Events {
	constructor() {
		super();

		this.pm2 = require('pm2');
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

		newProcess = spawnSync(data.type, data.payload, {"encoding":"utf8"});
		
		outputs = newProcess.stdout;
		stderrs = newProcess.stderr;

		console.log("Sebastian:update=> outputs:", outputs)
		console.log("Sebastian:update=> stderrs:", stderrs);

		this.pm2.connect(()=>{
			
			/*this.pm2.gracefulReload("all", (err, proc)=> {
				if( error ) {
					console.log("Sebastian:update:error=>", err.message);
				}
				else {
					console.log("Sebastian:update:xxx=>", proc.name);
				}
			})*/

			this.pm2.restart("all", (err, list) => {
				console.log(list);
			});
		});
	}

}

/*
const Sebastian = require('./sebastian.js');
var sebastian = new Sebastian();
sebastian.update();
*/
