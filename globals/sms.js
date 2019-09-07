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
		let groups = this.rules.group;
		for(let i in groups) {
			let group = groups[i];
			for(i in value ) {
				if(group.determiners.hasOwnProperty(i)) {
					let determinerRegex = group.determiners[i];
					let regex = RegExp(determinerRegex);
					if( regex.test(value[i]) ) 
						return group.name;
				}
			}
		}
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
var type = modems.getRequestGroup(data[0]);
try {
	assert.strictEqual(type, "MTN");
}
catch(error) {
	console.log(error.message)
}

//TODO: which modem group does this message relate to?
