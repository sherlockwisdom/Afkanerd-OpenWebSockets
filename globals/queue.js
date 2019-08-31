

class Queue {
	constructor() {
		this.element_container = [];
	}

	insert ( element ) {
		this.element_container.push( element );
	}

	back() {
		return this.element_container[ 0 ];
	}

	//Return first element and removes from array
	shift() {
		return this.element_container.shift();
	}

	//Returns last element and removes from array
	pop() {
		return this.element_container.pop();
	}

	size() {
		return this.element_container.length;
	}

	at( index ) {
		return this.element_container[ index ];
	}

	next() {
		return this.shift();
	}
}


