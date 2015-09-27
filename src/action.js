'use strict';

let _actionCount = 0;
class Action {
    constructor (config) {
        this.config = config;

        this.config.id = this.config.id || 'action' + (++_actionCount);


    }

    toString () {
        return '@' + this.config.id;
    }
}

module.exports = Action