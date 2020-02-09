//TODO: Make request for SMS
//TODO: Retrieve stored request for SMS

let CONFIGS = readConfigs('system_configs');
let RETURN_VALUES = readConfigs('return_values');


var component = CONFIGS['COMPONENT'];
app.post(component, (req, res)=>{
	let __BODY__ = req.body;

	console.log(__BODY__);

	let __CLIENT__ = __BODY__.__CLIENT__;
	let __ID__ = __CLIENT__.__ID__;
	let __TOKEN__ = __CLIENT__.__TOKEN__;

	//Let's validate this client
	if( await !DBClient.validate(__ID__, __TOKEN__) ) {}
	
	//Now let's validate the request
	let __REQUEST__ = __BODY__.__REQUEST__;
	let __SMS__ = __REQUEST__.__SMS__;

	let __MESSAGE__ = __SMS__.__MESSAGE__;
	let __PHONENUMBER__ = __SMS__.__PHONENUMBER__;

	//They should be some open socket it wants to send information to
	let __SOCKET__ = SocketCollection.find(__ID__, __TOKEN__);
	if( !__SOCKET__.transmit( __MESSAGE__, __PHONENUMBER__ ) ){
		res.status(__SOCKET__.getErrorCode() );
		res.end();
	}
	
	res.status( RETURN_VALUES['SUCCESS'] );
	res.end();
});

app.get(component + "/:id", (req, res)=>{

});
