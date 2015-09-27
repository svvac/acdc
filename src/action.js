'use strict';

class Action {
    constructor (config) {
        this.config = config;
    }

    toString () {
        return 'Action:' + this.config.id;
    }
}

module.exports = Action