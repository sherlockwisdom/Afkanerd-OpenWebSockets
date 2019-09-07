//TODO: number of modems
const Events = require('events');
const { spawnSync, spawn } = require ('child_process');

const PATH_TO_SCRIPT = "../scripts/modem_information_extraction.sh";

//TODO: set event listener checking for changes in modem and creating events

class HardwareAbstractionLayer extends Events {
	constructor() {
		super()
	}

	getUSBModems() {}

	getSSHModems() {}

	getModemsFromPaht( path ) {}

	getModemState() {}
}

class Modem extends Events {
	constructor( index ) {
		super();
		this.index = typeof index == "undefined" ? "-1" : index;
		this.tools = require("./../globals/tools.js");
		this.enlistedPaths = {
			"MTN" : "SSH",
			"ORANGE": "USB"
		}
	}

	is_modem() { return this.index != -1; }

	get_modem_indexes() {
		let args = [ "list" ];
		let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } )
		return std_out.stdout.split( '\n' );
	}

	getModems( ) {
		
		return
		new Promise( resolve=> {
			let args = [ "extract", this.index ];
			let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
			
			let info = std_out.stdout.split( '\n' );
			let info_container = {};
			for( let i in info ) {
				let key = info[i].split(':')[0];
				let value = info[i].split(':')[1];

				let container = { }
				info_container[key] = value;
			}
			resolve( info_container );
		});
	}

	get_info() {
		return {
			index : this.index,
			info : this.get_modem(),
			sms : this.get_sms()
		}
	}

	get_sms_indexes( ) {
		
		let args = [ "sms", "all", this.index ];
		let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
		
		return std_out.stdout.split( '\n' );
	}


	get_sms( ) {

		let sms_indexes = this.get_sms_indexes();
		let container_list = {}
		for(let i in sms_indexes ) {
			
			let args = [ "sms", "read_sms", sms_indexes[i], this.modem_index ];
			let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
			std_out = std_out.stdout.split( '\n' );
			
			//let container = {}
			//for(let j in std_out) container[j] = std_out[j];

			container_list[i] = JSON.parse ( JSON.stringify( std_out) );
		}
		
		return container_list;
	}

	send_sms( message, phonenumber ) {
		return new Promise( (resolve, reject)=> {
			let args = [ "sms", "send", message, phonenumber, this.index ];
			let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
			resolve( std_out.stdout.length < 1 ? std_out.stderr : std_out.stdout );
		});
	}

	modemRouter( group ) {
		return
		new Promise( async (resolve) => {
			//get path to check ( group )
			this.path = this.enlistedPaths[ group ];
			console.log("modem:modemRouter=> path for group: ", path);

			//get modems at that path
			switch (path ) {
				case "USB":
					let modems = await getModems();
					console.log ("modems:modemRouter=> list of usb modems", modems);
					resolve( modems );
				break;

				case "SSH":
					console.log("modems::modemRouter=> going all SSH on you" );
					resolve( "SSH MODEMS COMING SOON...");
				break;

				default:
					throw new Error("invalid modem router paht");
				break;
			}
		});
	}

	async requestSMS( data ) {
		console.log("Modem::requestSMS=> new SMS request made...");
		//deduce required hardware
		if( !data instanceof Array ) {
			
			this.emit("failed", new Error("invalid data type"));
		}

		else {
			for(let i in data ) {
				let request = data[i];
				let phonenumber = request.phonenumber;
				let message = request.message;
				try {
					let serviceProvider = this.tools.getCMServiceProviders( phonenumber );
					console.log("modem:requestSMS=> service provider: ", serviceProvider);
					//only 2 types of modems (SSH and USB, third = miracle)
					let modem = await this.modemRouter( serviceProvider );
					console.log("modem:requestSMS=> modemRouter: ", modem);
					//modem.sendSMS ( message, phonenumber );
				}
				catch( error ) {
					console.log("modem:requestSMS:error=>", error.message);
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
modems.requestSMS( data );

modems.on("sent", ( data )=> { console.log("sms::test::results=> ", data) })
