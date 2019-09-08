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
		this.tools = require('./tools.js');
		this.fs = require('fs');
		this.rules = JSON.parse(this.fs.readFileSync('modem-rules.json', 'utf8'));

		this.groupForwarders = {
			"MTN" : "SSH",
			"ORANGE" : "MMCLI",
			"NEXTEL" : "MMCLI"
		}
		this.forwardBindings = {}
		this.forwardBindings["SSH"] = this.sshSend;
		this.forwardBindings["MMCLI"] = this.mmcliSend;
		this.state = {
			"SSH" : "!busy",
			"MMCLI" : "!busy"
		}

		this.on("event", (type, group)=>{
			switch(type) {
				case "new request":
					let forwarder = this.groupForwarders[group];
					if(this.stateOfForwarder(forwarder) == "!busy") {
						//console.log("Modem:event:new_request=> state= !busy")
						this.emit("need_job", forwarder, group);
					}
					else if(this.stateOfForwarder(forwarder) == "busdy") {
						//console.log("Modem:event:new_request=> state = busy");
						break;
					}
				break;
			}
		})
	}

	stateOfForwarder( forwarder ) {
		return this.state[forwarder]
	}


	getRequestGroup( value ) {
		var groups = this.rules.group;
		for(let n in groups) {
			let group = groups[n];

			for(let i=0;i<Object.keys(value).length;++i) {
				let key = Object.keys(value)[i];
				let isDeterminer = group.determiners.hasOwnProperty(key);
				
				if( isDeterminer ) {
					let determinerRegex = group.determiners[key]
					let regex = RegExp(determinerRegex);
					if( regex.test(value[key]) ) { 
						return group.name;
					}
					
				}
			}
		}
	}

	toggleForwarderState(forwarder, state) {
		switch(state) {
			case "busy":
				this.state[forwarder] = "busy";
			break;

			case "!busy":
				this.state[forwarder] = "!busy";
			break;

			default:
				this.state[forwarder] = this.state[forwarder] == "busy" ? "!busy" : "busy"
				throw new Error("modem:toggerForwarderState=> invalid state toggle");
			break;
		}
	}


	sshSend(message, phonenumber) {
		return new Promise((resolve, reject)=> {
			console.log("Modem.sshSend=> sending message details:",message,phonenumber);
			let args = ["-T", "root@192.168.1.1", `sendsms '${phonenumber}' '${message}'`];
			//let args = ["-t", "root@192.168.1.1", "ls /"]
			try {
				const vodafoneRouterOutput = spawnSync("ssh", args, {"encoding" : "utf8"});
				let output = vodafoneRouterOutput.stdout;
				let error = vodafoneRouterOutput.stderr;
				console.log("Modem.sshSend=> output(%s) error(%s)", output, error);
				require('./tools.js').sleep().then(()=>{
					resolve( output );
				});
			}
			catch( error ) {
				reject("Modem.sshSend.error=> " + error.message);
			}
		});
	}

	mmcliSend(message, phonenumber, group) {
		return new Promise((resolve, reject)=> {
			console.log("Modem.mmcliSend=> sending message details:",message,phonenumber);
			let args = ["--send", "--number", phonenumber, "--message", message, "--group", group]
			try{
				const mmcliModemOutput = spawnSync("afsms", args, {"encoding": "utf8"})
				let output = mmcliModemOutput.stdout;
				let error = mmcliModemOutput.stderr;
				console.log("Modem.mmcliSend=> output(%s) error(%s)", output, error);
				require('./tools.js').sleep().then(()=>{
					resolve( output );
				});
				resolve("Modem.mmcliSend.demo.output");
			}
			catch( error ) {
				reject("Modem.mmcliSend.error=>"+error.message);
			}
		});
	}
}
class SMS extends Modem{
	constructor( ) {
		//TODO: read files to get this rules
		//TODO: in case of update and hard reload... how to get continue memory
		super();
		this.groupQueueContainer = {}
		this.initializeQueues().then(()=>{
			this.emit("sms.ready");
		});

		this.on("need_job", this.deQueueFor);
	}

	initializeQueues() {
		return new Promise( resolve=> {
			for(let i in this.groupForwarders) this.groupQueueContainer[i] = new Queue();
			resolve();
		});
	}

	async deQueueFor( forwarder, group ) {
		let request = this.groupQueueContainer[group].next()
		let forward = this.forwardBindings[forwarder]; //sshSend or mmcliSend */

		this.toggleForwarderState(forward, "busy");
		this.forwardBindings[forwarder](request.message, request.phonenumber, group).then(( resolve )=>{
			console.log("SMS.deQueueFor=>", resolve);
		}).catch(( reject )=>{
			console.log("SMS.deQueueFor.error=>", reject);
		});
		this.toggleForwarderState(forward, "!busy");
		//this.emit("event", "new request", group);
	}

	queueFor(group, request) {
		//console.log("SMS:queueFor=>", group);
		this.groupQueueContainer[group].insert(request);
		this.emit("event", "new request", group);
	}

	queueLog() {
		for(let i in this.queueGroupContainer) {
			console.log(i, this.queueGroupContainer[i].size());
		}
	}

	sendSMS(message, phonenumber) {
		//TODO: Assumption which I can live with, there are only 2 modems and this modems have to handle the workload
		return new Promise( async (resolve, reject )=> {
			let request = {phonenumber: phonenumber, message : message };
			//let's sanitize the input
			for(let i in request)
				if(i=== undefined || request[i] === undefined){
					reject("SMS.sendSMS=> invalid request")
				}
			let group = this.tools.getCMServiceProviders(phonenumber)
			if(typeof group == "undefined") {
				reject("SMS.sendSMS=> invalid group")
			}
			else {
				//console.log("SMS:sendSMS=> ack group:", group)
				this.queueFor(group, request);
				//await this.queue.hardInsert( request );
				resolve("SMS.sendSMS=> done.");
			}

			reject();
		});
	}

	sendBulkSMS( request) {
		return new Promise(async(resolve, reject)=> {
			console.log("SMS.sendBulkSMS=> number of sms to send: ", request.length);
			for(let i in request) {
				console.log("SMS.sendBulkSMS=> sending message: %d of %d",i,request.length);
				this.sendSMS(request[i].message, request[i].phonenumber).then((resolve)=>{ 
					console.log(resolve) 
				}).catch((reject)=>{ 
					console.log(reject)
				});
			}
			resolve("SMS.sendBulkSMS=> done.");
		});
	}
}

//TODO: Each modem is bound to a sender and it manages it sender

let modems = new Modem;
let data = [
	{
		phonenumber : "652156811", //MTN
		message : new Date().toLocaleString()
	},
	{
		phonenumber : "696011944", //ORANGE
		message : new Date().toLocaleString()
	},
	{
		phonenumber : "0000000", //ERROR
		message : new Date()
	}
]

let assert = require('assert');
try {
	var sms = new SMS;

	sms.on("sms.ready", ()=>{
		console.log("sms ready...");
		/*sms.sendBulkSMS( data ).then((resolve)=>{
			console.log(resolve);
		}).catch((reject)=>{ console.log(reject)})*/
		sms.sendSMS(data[1].message, data[0].phonenumber).then((resolve)=>{
			console.log(resolve);
		}).catch((reject)=>{ console.log(reject)}) 
		sms.queueLog();
	});
}
catch(error) {
	console.log(error.message)
}

//TODO: which modem group does this message relate to?
//TODO: which modems in that group execute this command
