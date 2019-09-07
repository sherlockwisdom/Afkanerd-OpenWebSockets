//TODO: number of modems
const Events = require('events');
const { spawnSync, spawn } = require ('child_process');



//TODO: SOC
/* 
- Multiple hardwares on a single machine -> route sms message to modem
ROUTE: 
	- conditions = matching the modem required specifications (service provider)
	- conditions = has the least amount of pending work (load balancig, making sure they always have the same amount of work


*/

class Modem {
	constructor () {
		this.fs = require('fs');
		this.rules = JSON.parse(this.fs.readFileSync('modem-rules.json', 'utf8'));
	}

	getRequestGroup( value ) {
		var groups = this.rules.group;
		for(let n in groups) {
			console.log(n);
			let group = groups[n];

			for(let i=0;i<Object.keys(value).length;++i) {
				let key = Object.keys(value)[i];
				let isDeterminer = group.determiners.hasOwnProperty(key);
				
				if( isDeterminer ) {
					let determinerRegex = group.determiners.key;
					let regex = RegExp(determinerRegex);
					if( regex.test(value[i]) ) { 
						return group.name;
					}
					
				}
			}
		}
	}

}
class SMS {
	constructor( ) {
		//TODO: read files to get this rules
		this.modem = new Modem;
		this.rules = {
			"MTN" : "SSH",
			"ORANGE" : "MMCLI"
		}
		this.groupBindings = {}
		this.groupBindings["SSH"] = this.sshSend;
		this.groupBindings["MMCLI"] = this.mmcliSend;
	}

	sshSend(message, phonenumber) {
		return new Promise((resolve)=> {
			console.log("SMS.sshSend=> sending message details:",message,phonenumber);
			resolve("SMS.sshSend.demo.output");
		});
	}

	mmcliSend(message, phonenumber) {
		return new Promise((resolve)=> {
			console.log("SMS.mmcliSend=> sending message details:",message,phonenumber);
			resolve("SMS.mmcliSend.demo.output");
		});
	}

	sendSMS(message, phonenumber) {
		return new Promise( async (resolve)=> {
			let request = {phonenumber: phonenumber, message : message };
			console.log("sms:sendSMS=> requesting", request);
			let group = this.modem.getRequestGroup(request)
			let output = await this.groupBindings[this.rules[group]](message, phonenumber);
			resolve( output );
		});
	}
}


let modems = new Modem;
let data = [
	{
		phonenumber : "652156811",
		message : new Date()
	},
	{
		phonenumber : "0000000",
		message : new Date()
	}
]

let assert = require('assert');
try {
	var sms = new SMS;
	sms.sendSMS(data[0].message, data[0].phonenumber);
}
catch(error) {
	console.log(error.message)
}

//TODO: which modem group does this message relate to?
//TODO: which modems in that group execute this command
