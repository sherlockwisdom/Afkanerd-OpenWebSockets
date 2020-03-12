### Development Notes

#### DBClient.js
 `DBClient = new DBCLIENT( mysqlConnection, string, string)`\
 `DBClient.validate( string, string )`\
 `DBClient.validateTokenOnly( string )`
 
#### DBRequest.js
`DBRequest = new DBREQUEST( mysqlConnection, string)`\
`DBRequest.valid([array])`\
`DBRequest.insert(string, [array])`

#### DBRequest.js
`Socket = new SOCKETS(mysqConnection, string, string)`\
`Socket.transmit( string, string, string )`\
`Socket.find( string, string )`\
`Socket.startSockets() | return new Promise`\
`Socket.connect( string, string) | return new Promise`
