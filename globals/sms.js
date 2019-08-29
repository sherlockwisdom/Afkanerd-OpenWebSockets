//TODO: number of modems

const { spawnSync, spawn } = require ('child_process');

const PATH_TO_SCRIPT = "../scripts/modem_information_extraction.sh";

function get_modems() {
	let args = [ "list" ];
	let std_out = spawnSync (PATH_TO_SCRIPT, args, { "encoding" : "utf8" } )
	return std_out.stdout.split( '\n' );
}


console.log( get_modems() );
