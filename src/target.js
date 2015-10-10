'use strict';

const Entity = require('./entity'),
      Action = require('./action'),
      logic  = require('./logic'),
      CST = require('./constants');

class Target {
    constructor (config) {
        this.target = config;
    }

    isTargeted (request, debug) {
        if (debug) {
            console.log(debug, 'target check');
            debug += ' | '.black;
        }

        return logic.evaluate('$and', this.target, request, undefined, debug);
    }

    resolve (request, debug) {
        return this.isTargeted(request, debug) ? CST.UNDETERMINED : CST.NOT_APPLICABLE;
    }
}

module.exports = Target