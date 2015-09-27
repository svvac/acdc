'use strict';

const Entity = require('./entity');

let _subjectCount = 0;

class Subject extends Entity {
	constructor (config) {
		config = config || {};

        config.id = config.id || 'subject' + (++_subjectCount);

        super(config);
	}

    toString () {
        let s = '[Subject:' + this.config.id + ']';
    }
}

Subject.DEFAULT_CONFIG = {

}

module.exports = Subject