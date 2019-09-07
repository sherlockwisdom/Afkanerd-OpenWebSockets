//TODO: number of modems
const Events = require('events');
const { spawnSync, spawn } = require ('child_process');
const Queue = require('./queue.js');


//TODO: SOC
/* 
- Multiple hardwares on a single machine -> route sms message to modem
ROUTE: 
	- conditions = matching the modem required specifications (service provider)
	- conditions = has the least amount of pending work (load balancig, making sure they always have the same amount of work


*/

'use strict'

class Modem extends Events {
	constructor () {
		super();
		this.fs = require('fs');
		this.rules = JSON.parse(this.fs.readFileSync('modem-rules.json', 'utf8'));

		this.groupForwarders = {
			"MTN" : "SSH",
			"ORANGE" : "MMCLI"
		}
		this.forwardBindings = {}
		this.forwardBindings["SSH"] = this.sshSend;
		this.forwardBindings["MMCLI"] = this.mmcliSend;

		this.on("event", (type, group)=>{
			switch(type) {
				case "new request":
					let forwarder = this.groupForwarders[group];
					if(this.stateOf(forwarder) != "busy") {
						this.emit("need_job", this.forwardBindings[forwarder]);
					}
					else {
						console.log("Modem:event:new_request=> state = busy");
						break;
					}
				break;
			}
		})
		this.on("ssh_done", ()=>{
			console.log("Should request for more ssh...");
			this.emit("need_job", this.forwardBindings["SSH"]);
		})

		this.on("mmcli_done", ()=> {
			console.log("Should request for more mmcli...");
			this.emit("need_job", this.forwardBindings["MMCLI"]);
		})
	}

	stateOf( forwarder ) {
		return "busy"
	}


	getRequestGroup( value ) {
		var groups = this.rules.group;
		for(let n in groups) {
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


	sshSend(message, phonenumber) {
		return new Promise((resolve)=> {
			console.log("SMS.sshSend=> sending message details:",message,phonenumber);
			this.emit("ssh_done");
			resolve("SMS.sshSend.demo.output");
		});
	}

	mmcliSend(message, phonenumber) {
		return new Promise((resolve)=> {
			console.log("SMS.mmcliSend=> sending message details:",message,phonenumber);
			this.emit("mmcli_done");
			resolve("SMS.mmcliSend.demo.output");
		});
	}
}
class SMS extends Modem{
	constructor( ) {
		//TODO: read files to get this rules
		super();
		this.groupQueueContainer = {}
		this.initializeQueues().then(()=>{
		});
	}

	initializeQueues() {
		return new Promise( resolve=> {
			for(let i in this.groupForwarders) this.groupQueueContainer[i] = new Queue();
			resolve();
		});
	}

	deQueueFor(group) {
		let request = this.groupQueueContainer[group].next()
		this.execEnv = this.forwardBindings[this.groupForwarders[group]](request.message, request.phonenumber);
	}

	queueFor(group, request) {
		this.groupQueueContainer[group].insert(request);
		this.emit("event", "new request", group);
	}

	queueLog() {
		for(let i in this.queueGroupContainer) {
			console.log(i, this.queueGroupContainer[i].size());
		}
	}

	sendSMS(message, phonenumber) {
		return new Promise( async (resolve, reject )=> {
			let request = {phonenumber: phonenumber, message : message };
			//let's sanitize the input
			for(let i in request)
				if(i=== undefined || request[i] === undefined){
					reject(new Error("invalid request"))
					return;
				}
			let group = this.getRequestGroup(request)
			this.queueFor(group, request);
			resolve("done");
		});
	}
}

//TODO: Each modem is bound to a sender and it manages it sender

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
	sms.sendSMS(data[0].message, data[0].phonenumber);
	sms.queueLog();
}
catch(error) {
	console.log(error.message)
}

//TODO: which modem group does this message relate to?
//TODO: which modems in that group execute this command
