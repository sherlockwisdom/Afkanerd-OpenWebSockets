const Events = require('events');
module.exports = 
class Sebastian extends Events {
	constructor() {
		super();
		this.eventList = {}
		this.on('event', this.execute);
	}

	execute(eventName) {
		console.log("(-_-) Ciel: ", eventName, " Sebastian: yes master!");
		this.eventList[eventName](this)
	}

	watch(eventName, eventFunction) {
		this.eventList[eventName] = eventFunction
	}
}
