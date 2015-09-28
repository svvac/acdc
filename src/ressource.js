'use strict';

const Entity = require('./entity');

let _ressourceCount = 0;

class Ressource extends Entity {
    constructor (config) {
        config = config || {};

        config.id = config.id || 'ressource' + (++_ressourceCount);

        super(config);
    }

    toString () {
        return '[Ressource:' + this.config.id + ']';
    }
}

Ressource.DEFAULT_CONFIG = {

}

module.exports = Ressource