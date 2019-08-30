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
		let info_container = {};
		for( let i in info ) {
			let key = info[i].split(':')[0];
			let value = info[i].split(':')[1];

			let container = { }
			info_container[key] = value;
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
		let args = [ "sms", "send", message, phonenumber, this.index ];
		let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } );
		
		return std_out.stdout.length < 1 ? std_out.stderr : std_out.stdout;
	}
}




let modems = new Modem().get_modems();

for(let i in modems) {
	console.log( modems[i].get_info() );
	console.log( modems[i].send_sms( new Date(), "652156811" ) )
	console.log('\n');
}
