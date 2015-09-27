'use strict';

const Entity = require('./entity');

class Ressource extends Entity {
    toString () {
        return 'Resource:' + this.config.id;
    }
}

Ressource.DEFAULT_CONFIG = {

}

module.exports = Ressource