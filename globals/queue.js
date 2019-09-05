const mysql = require('./tools');

class Persist {
	constructor( mysqlConnection ) {
		this.mysqlConnection = mysqlConnection;
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
					console.log("queue:persist() => ", error.message);
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
					console.log("queue:load() => ", error.message);
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
	constructor( mysqlConnection ) {
		super( mysqlConnection );
		this.elementContainer = [];
		this.mysqlConnection = mysqlConnection;
	}

	insert ( element ) {
		let e = [JSON.stringify(element)];
		this.elementContainer.push( e );
	}

	back() {
		let e = this.pop();
		return e.pop();
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
		let e = this.shift();
		return e.pop();
	}

	empty() {
		this.elementContainer = [];
	}

	async hardEmpty() {
		await this.clearPersist();
	}

	async save() {
		this.insertForPersist(this.elementContainer);
		await this.persist();
	}

	async load() {
		let e = await this.getPersist();
		for(let i in e) e[i] = [JSON.stringify( e[i].element )];
		this.elementContainer = this.elementContainer.length > 0 ? this.elementContainer.concat(e) : e;
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
			assert.strictEqual(q.size(), 2000);
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


mysqlConnection( test );

