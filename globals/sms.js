//TODO: number of modems

const { spawnSync, spawn } = require ('child_process');

const PATH_TO_SCRIPT = "../scripts/modem_information_extraction.sh";

class Modem{
	constructor( index ) {
		this.index = typeof index == "undefined" ? "-1" : index;
	}

	is_modem() { return this.index != -1; }

	
	get_modem_indexes() {
		let args = [ "list" ];
		let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } )
		return std_out.stdout.split( '\n' );
	}

	get_modem( ) {
		
		let args = [ "extract", this.index ];
		let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
		
		let info = std_out.stdout.split( '\n' );
		let info_container = []
		for( let i in info ) {
			let key = info[i].split(':')[0];
			let value = info[i].split(':')[1];

			let container = { }
			container[key] = value;
			info_container.push( container );
		}
		return info_container;
	}

	get_modems() {
			
		let modem_containers = [];
		let modem_indexes = this.get_modem_indexes();
		for( let i in modem_indexes) {
			//console.log( modem_indexes[i] );
			modem_containers.push ( new Modem ( modem_indexes[i] ) )
		}
		
		return modem_containers;
	}

	get_info() {
		return {
			index : this.index,
			info : this.get_modem()
		}
	}
}



function get_sms_indexes( modem_index ) {
	
	let args = [ "sms", "all", modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	
	return std_out.stdout.split( '\n' );
}


function get_sms( modem_index, index ) {

	let args = [ "sms", "read_sms", index, modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	std_out = std_out.stdout.split( '\n' );
	
	return std_out;
}


function send_sms( modem_index, message, phonenumber ) {
	let args = [ "sms", "send", message, phonenumber, modem_index ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
	
	return std_out.stdout.length < 1 ? std_out.stderr : std_out.stdout;
}

let modems = new Modem().get_modems();

for(let i in modems) console.log( modems[i].get_info() );
