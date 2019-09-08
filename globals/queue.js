const mysql = require('./tools.js');

class Persist {
	constructor( mysqlConnection ) {
		if(typeof mysqlConnection == "undefined") {
			console.log("Persist.constructor=> no myqlConnection provided...");
			this.getConnection();
		}
		else
		this.mysqlConnection = mysqlConnection;
	}

	async getConnection() {
		this.mysqlConnection = await mysql.mysql_connection()
	}

	insertForPersist( elements ) {
		this.elementContainer = elements;
	}


	persist() {
		if(typeof this.mysqlConnection == "undefined" || this.mysqlConnection === null) {
			console.log("Error | Can't persist, no mysqlConnection");
			return;
		}

		return new Promise( ( resolve, reject)=> {
			let INSERT_QUERY = "INSERT INTO Queue (element) VALUES ?"
			//let CONTAINER =[{element: JSON.stringify( this.elementContainer )}];
			this.mysqlConnection.query( INSERT_QUERY, [this.elementContainer], ( error, results)=> {
				if(error) {
					console.log("persist:persist() => ", error.message);
					reject();
				}

				else {
					resolve( results );
				}
			});
		});
	}

	getPersist() {
		if(typeof this.mysqlConnection == "undefined" || this.mysqlConnection === null) {
			console.log("Error | Can't persist, no mysqlConnection");
			return;
		}

		return new Promise( (resolve, reject) => {
			let FETCH_QUERY = "SELECT element FROM Queue";
			this.mysqlConnection.query(FETCH_QUERY, (error, results)=> {
				if(error) {
					console.log("persist:load() => ", error.message);
					reject();
				}

				else {
					for(let i in results) {
						let e = JSON.parse (results[i].element);
						results[i].element = e;
					}

					resolve( results );
				}
			});
		});
	}


	clearPersist() {
		if(typeof this.mysqlConnection == "undefined" || this.mysqlConnection === null) {
			console.log("Error | Can't persist, no mysqlConnection");
			return;
		}

		return new Promise ( (resolve, reject)=> {
			let DELETE_QUERY = "DELETE FROM Queue";
			this.mysqlConnection.query(DELETE_QUERY, (error, results)=> {
				if(error) {
					console.log("persist:delete() => ", error.message);
					reject();
				}
				else {
					resolve( results );
				}
			});
		});
	}
}


module.exports = 
class Queue extends Persist {

	//TODO: Add a state which changes with every change to this.elementContainer
	//TODO: On save, checks if state ids are the same unless --force is added
	//TODO: On load, checks if state ids are the same unless --force is added
	//TODO: Add version controlling methods to this (brain-storming needed);
	 constructor( mysqlConnection ) {
		super( mysqlConnection );
		this.elementContainer = [];
	}

	insert ( element ) {
		let e = [JSON.stringify(element)];
		this.elementContainer.push( e );
	}

	back() {
		return this.elementContainer.length > 0 ? JSON.parse( this.pop()[0] ) : undefined
	}

	//Return first element and removes from array
	shift() {
		return this.elementContainer.shift();
	}

	//Returns last element and removes from array
	pop() {
		return this.elementContainer.pop();
	}

	size() {
		return this.elementContainer.length;
	}

	at( index ) {
		return this.elementContainer[ index ];
	}

	next() {
		return this.elementContainer.length > 0 ? JSON.parse( this.shift()[0] ) : undefined
	}

	getNext() {
		return this.elementContainer.length > 0 ? JSON.parse( this.elementContainer[0][0] ) : undefined;
	}

	empty() {
		this.elementContainer = [];
	}


	async save() {
		this.insertForPersist(this.elementContainer);
		await this.persist();
	}

	async append() {
		let e = await this.getPersist();
		for(let i in e) e[i] = [JSON.stringify( e[i].element )];
		this.elementContainer = this.elementContainer.concat(e);
	}

	async load() {
		this.empty();
		this.append();
	}

	// Every with hard effects the persistent layer
	async hardEmpty() {
		await this.clearPersist();
	}

	async hardInsert( element ) {
		//element = [element, this.accessToken];
		//console.log(JSON.stringify(element));
		let e = [JSON.stringify(element)];
		this.insertForPersist( [e] );
		await this.persist();
	}
}


'use strict';

let mysqlConnection = async function( callback ) {
	let connection = await mysql.mysql_connection();
	callback (connection);
}

function test( mysqlConnection ) {

	let q = require('./queue');
	let assert = require('assert');
	q = new q(mysqlConnection);
	let chalk = require('chalk');

	let q_insert = new Promise( function(resolve) {
		for(let i=0;i<1000;i++) {
			let js = {};
			js[i] = "Hello world";
			q.insert(js);
		}
		resolve();
	}).then(async ()=>{ 
		let passed = "PASSED!";
		let tPersist = new Persist(mysqlConnection);
		await tPersist.clearPersist();
		try {
			assert.strictEqual(q.size(), 1000, passed);
			
			//keeps in both places
			console.log(chalk.green("Testing=>"), "save()");
			await q.save();
			let persistResults = await tPersist.getPersist();
			assert.strictEqual(persistResults.length, 1000);
			assert.strictEqual(q.size(), persistResults.length);
			//tPersist.clearPersist();

			
			//add buffer
			console.log(chalk.green("Testing=>"), "load()");
			await q.load();
			persistResults = await tPersist.getPersist();
			assert.strictEqual(q.size(), 1000);
			assert.strictEqual(persistResults.length, 1000);


			//clears persist
			console.log(chalk.green("Testing=>"), "hardempty()");
			await q.hardEmpty();
			persistResults = await tPersist.getPersist();
			assert.strictEqual(persistResults.length, 0);


			//clears buffer
			console.log(chalk.green("Testing=>"), "empty()");
			q.empty();
			assert.strictEqual(q.size(), 0);

			console.log(chalk.bgBlue("PASSED ALL TEST"));
		}
		catch( error ) {
			console.log(error.message );
		}


		process.exit(1);
	})
}


//mysqlConnection( test );

