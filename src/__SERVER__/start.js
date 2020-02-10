const express = require('express');
const bodyParser = require('body-parser')
const READCONFIGS = require('./start_routines.js');

//===============
'use strict';
//===============


//================================================
var app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
//================================================


//=======================================================
let CONFIGS = READCONFIGS('system_configs');
let RETURN_VALUES = READCONFIGS('return_values');
var COMPONENT = CONFIGS['COMPONENT'];

if(typeof CONFIGS["__DEFAULT__"] == "undefined") {
	console.error("=> CONFIGS NOT PROPERLY LOADED");
	return;
}
//=======================================================

/*/=======================================================
console.log( CONFIGS );
console.log("===============================");
console.log( RETURN_VALUES );
console.log("===============================");
console.log( component );
/*///=======================================================


//=================================
let options = {
	port : 3000
}

app.listen(options, ()=>{
	console.log("=> RECEIVING API BEGAN, RUNNING ON PORT [%d]", options.port);
});
//=================================

app.post(COMPONENT, (req, res)=>{
	let __BODY__ = req.body;

	console.log(__BODY__);

	let __CLIENT__ = __BODY__.__CLIENT__;

	if(
		!__CLIENT__.hasAttribute("__ID__") ||
		!__CLIENT__.hasAttribute("__TOKEN__")
	) {
		console.log("-- Invalid request made --");
		res.status( RETURN_VALUES['INVALID_REQUEST'] );
		res.end();
		
		return;
	}

	/*
		
	let __ID__ = __CLIENT__.__ID__;
	let __TOKEN__ = __CLIENT__.__TOKEN__;

	//Let's validate this client
	if( await !DBClient.validate(__ID__, __TOKEN__) ) {
		res.status( RETURN_VALUES['NOT_AUTHORIZED'] );
		res.end();

		return;
	}
	
	//Now let's validate the request
	let __REQUEST__ = __BODY__.__REQUEST__;
	let __SMS__ = __REQUEST__.__SMS__;

	let __MESSAGE__ = __SMS__.__MESSAGE__;
	let __PHONENUMBER__ = __SMS__.__PHONENUMBER__;

	//They should be some open socket it wants to send information to
	let __SOCKET__ = await socketCollection.find(__ID__, __TOKEN__);
	if( !__SOCKET__.transmit( __MESSAGE__, __PHONENUMBER__ ) ){
		res.status(__SOCKET__.getErrorCode() );
		res.end();

		return;
	}
	*/
	res.status( RETURN_VALUES['SUCCESS'] );
	res.end();
});

/*
app.get(COMPONENT + "/user/:token/request/:id", (req, res)=>{
	let __ID__ = req.id;

	let __TOKEN__ = req.token;

	if( await !DBClient.validateTokenOnly( __TOKEN__ ) ) {}

	//Get request data
	let __REQUEST__ = await requestCollection.find( __ID__ );
	if( !__REQUEST__.valid() ) {
		res.status(__REQUEST__.getErrorCode() );
		res.end();

		return;
	}

	res.status( RETURN_VALUES['SUCCESS'] );
	res.send( __REQUEST__.data() );
});

*/
