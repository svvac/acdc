'use strict';

const Entity = require('./entity'),
      Action = require('./action'),
      logic  = require('./logic');

class Target {
    constructor (config) {
        this.target = config;
    }

    isTargeted (request, debug) {
        if (debug) {
            console.log(debug, '=> target check')
        }
        return logic.evaluate('$and', this.target, request, debug);
    }

    resolve (request) {
        throw 'Target#resolve() must be implemented by subtypes';
    }
}

module.exports = Target