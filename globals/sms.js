//TODO: number of modems
const Events = require('events');
const { spawnSync, spawn } = require ('child_process');
const Queue = require('./queue.js');
const fs = require('fs');

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
		//this.rules = JSON.parse(this.fs.readFileSync('modem-rules.json', 'utf8'));

		this.groupForwarders = {
			"MTN" : "SSH",
			"ORANGE" : "MMCLI",
			"NEXTEL" : "MMCLI"
		}
		this.forwardBindings = {}
		this.forwarderState = {};
		this.forwarderQueue = {};

		this.bindForwarders("SSH", this.sshSend);
		this.bindForwarders("MMCLI", this.mmcliSend);

		this.on("event", (type, request)=>{
			setImmediate(()=> {
				switch(type) {
					case "new request":
						let group = this.tools.getCMServiceProviders(request.phonenumber);
						if(typeof group != "undefined") {
							let forwarderName = this.groupForwarders[group];
							this.queueForForwarder(forwarderName, request, group);
							console.log("Modem.on.event=> forwarder requested (%s) for group (%s)", forwarderName, group);
						}
						else {
							console.log("Modem.on.event=> could not find group for (%s)", request.phonenumber);
						}
					break;
				}
			});
		})

		this.on("done", this.deQueueForForwarder);
		this.on("new queue", this.deQueueForForwarder);
	}

	bindForwarders(forwarderName, forwarderFunction) {
		this.forwardBindings[forwarderName] = forwarderFunction;
		this.forwarderQueue[forwarderName] = new Queue();
		this.forwarderState[forwarderName] = "!busy";
	}

	queueForForwarder(forwarderName, request, group) {
		this.forwarderQueue[forwarderName].insert(request);
		this.emit("new queue", forwarderName, group);
	}

	async deQueueForForwarder(forwarderName, group) {
		switch( this.forwarderState[forwarderName] ) {
			case "busy":
				console.log("Modem.deQueueForForwarder=> request made but (%s) is busy", forwarderName);
			break;

			case "!busy":
				try {
					let request = this.forwarderQueue[forwarderName].next();
					if(request !== undefined) {
						this.forwarderState[forwarderName] = "busy";
						await this.forwardBindings[forwarderName](request.message, request.phonenumber, group);
					}
					else {
						console.log("Modem.deQueueForForwarder=> queue done.");
						return true;
					}
				}
				catch( error ) {
					this.forwarderState[forwarderName] = "!busy";
					console.log("Modem.deQueueForForwarder:error=>", error.message);
				}
				this.forwarderState[forwarderName] = "!busy";
				this.emit("done", forwarderName);
			break;

			default:
				console.log("Modem.deQueue=> shit is happening here, unknown state of forwarder");
			break;
		}
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
			console.log("modem.sshSend at [%s]",new Date().toLocaleString() );
			//console.log("Modem.sshSend=> sending message details:",message,phonenumber);
			try {
				// XXX: this line here is for testing, it waits 10 seconds and then resolves, can simulate sending SMS, uncomment when needed
				/*let testFunction = new Promise((resolve)=> {
					require('./tools.js').sleep().then(()=>{
						resolve('done');
					})
				})
				testFunction.then(()=> { resolve("done sleeping thread") }); */	

				//XXX: this is the actual program, can work with the above line, but rather not
				let args = ["-T", "-o", "ConnectTimeout=20", "root@192.168.1.1", `sendsms '${phonenumber}' '${message}'`];
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
			console.log("modem.mmcliSend at [%s]",new Date().toLocaleString());
			//console.log("Modem.mmcliSend=> sending message details:",message,phonenumber);
			try{
				/* XXX: this line here is for testing, it waits 10 seconds and then resolves, can simulate sending SMS, uncomment when needed

				let testFunction = new Promise((resolve)=> {
					require('./tools.js').sleep().then(()=>{
						resolve('done');
					})
				})
				testFunction.then(()=> { resolve("done sleeping thread") });
				*/

				//XXX: this is the actual program, can work with the above line, but rather not
				let args = ["--send", "--number", phonenumber, "--message", message, "--group", group]
				const mmcliModemOutput = spawnSync("afsms", args, {"encoding": "utf8"})
				let output = mmcliModemOutput.stdout;
				let error = mmcliModemOutput.stderr;
				//console.log("Modem.mmcliSend=> output(%s) error(%s)", output, error);
				require('./tools.js').sleep().then(()=>{
					resolve( output );
				});
			}
			catch( error ) {
				reject("Modem.mmcliSend.error=>"+error.message);
			}
		});
	}
}

module.exports =
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

	deQueueFor( forwarder, group ) {
		let request = this.groupQueueContainer[group].next()
		let forward = this.forwardBindings[forwarder]; //sshSend or mmcliSend */

		this.toggleForwarderState(forward, "busy");
		this.forwardBindings[forwarder](request.message, request.phonenumber, group).then(( resolve )=>{
			console.log("SMS.deQueueFor=>", resolve);
			this.toggleForwarderState(forward, "!busy");
		}).catch(( reject )=>{
			console.log("SMS.deQueueFor.error=>", reject);
			this.toggleForwarderState(forward, "!busy");
		});
		//this.emit("event", "new request", group);
	}

	queueFor(group, request) {
		//console.log("SMS:queueFor=>", group);
		this.groupQueueContainer[group].insert(request);
		this.emit("event", "new request", group);
		console.end();
		console.log("SMS.queueFor=> done queueing...");
	}

	queueLog() {
		for(let i in this.queueGroupContainer) {
			console.log(i, this.queueGroupContainer[i].size());
		}
	}

	sendSMS(message, phonenumber) {
		//TODO: Assumption which I can live with, there are only 2 modems and this modems have to handle the workload
		return new Promise((resolve, reject)=> {
			let request = {phonenumber: phonenumber, message : message };
			//let's sanitize the input
			for(let i in request)
				if(i=== undefined || request[i] === undefined){
					reject("SMS.sendSMS=> invalid request")
				}
			//this.queueFor(group, request);
			this.emit("event", "new request", request);
			console.log("SMS.sendSMS=> done notifying of new request");
			resolve();
		});
	}

	sendBulkSMS( request) {
		//console.log(request);
		return new Promise(async(resolve, reject)=> {
			console.log("SMS.sendBulkSMS=> number of sms to send: ", request.length);
			let requestContainerDump = []; //This container takes a list of request and dumps to file
			for(let i in request) {
				//console.log("SMS.sendBulkSMS=> sending message: %d of %d",parseInt(i)+1,request.length);
				//request[i].hasOwnProperty("number") ? await this.sendSMS(request[i].message, request[i].number) : await this.sendSMS(request[i].message, request[i].phonenumber)
				let simpleRequest;
				if( request[i].hasOwnProperty("number") ) {
					//requestContainerDump.push( request[i] );
					simpleRequest = "number=" + request[i].number + ",message=\"" + request[i].message + "\"";
				}
				else if(request[i].hasOwnProperty("phonenumber") ) {
					simpleRequest = "number=" + request[i].phonenumber + ",message=\"" + request[i].message + "\"";
				}
				requestContainerDump.push(simpleRequest);
				//console.log(simpleRequest);
			}
			console.log(requestContainerDump.join('\n'));
			let HOME = process.env.HOME;
			fs.appendFileSync(`${HOME}/deku/request_queue.dat`, requestContainerDump.join('\n'));
			resolve("SMS.sendBulkSMS=> done.");
		});
	}
}

//TODO: Each modem is bound to a sender and it manages it sender
/*
let modems = new Modem;
let data = [
	{
		phonenumber : "676850491", //MTN
		message : new Date().toLocaleString()
	},
	{
		phonenumber : "652156811", //MTN
		message : new Date().toLocaleString()
	},
	{
		phonenumber : "691979004", //ORANGE
		message : new Date().toLocaleString()
	},
	{
		phonenumber : "698403801", //ORANGE
		message : new Date().toLocaleString()
	}
]

let assert = require('assert');
try {
	const SMS = require('./sms.js');
	var sms = new SMS;

	sms.on("sms.ready", ()=>{
		console.log("sms ready...");
		sms.sendBulkSMS( data ).then((resolve)=>{
			console.log(resolve);
		}).catch((reject)=>{ console.log(reject)})
		/*sms.sendSMS(data[1].message, data[0].phonenumber).then((resolve)=>{
			console.log(resolve);
		}).catch((reject)=>{ console.log(reject)})
		sms.queueLog(); *//*
	});
}
catch(error) {
	console.log(error.message)
}
*/

//TODO: which modem group does this message relate to?
//TODO: which modems in that group execute this command
