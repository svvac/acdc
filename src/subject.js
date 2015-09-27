'use strict';

const Entity = require('./entity');

class Subject extends Entity {
    toString () {
        return 'Subject:' + this.config.id;
    }
}

Subject.DEFAULT_CONFIG = {

}

module.exports = Subject