'use strict';

var CST = require('./src/constants');

module.exports = {
    Engine: require('./src/engine'),
    Action: require('./src/action'),
    Ressource: require('./src/ressource'),
    Subject: require('./src/subject'),
    Entity: require('./src/entity'),
    Policy: require('./src/policy'),
    logic: require('./src/logic'),

    ALLOW:          CST.ALLOW,
    DENY:           CST.DENY,
    NOT_APPLICABLE: CST.NOT_APPLICABLE,
    UNDETERMINED:   CST.UNDETERMINED,
};