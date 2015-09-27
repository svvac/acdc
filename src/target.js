'use strict';

const Entity = require('./entity'),
      Action = require('./action'),
      logic  = require('./logic');

class Target {
    constructor (config) {
        this.target = config;
    }

    isTargeted (request) {
        return logic.evaluate('$and', this.target, request);
    }

    resolve (request) {
        throw 'Target#resolve() must be implemented by subtypes';
    }
}

function _isDeepMatch (predicate, actual) {
    if (predicate instanceof Entity) {
        return actual instanceof predicate.Instance;
    }  else if (predicate instanceof Action) {
        return predicate === actual;
    } else if (Array.isArray(predicate)) {
        let res = predicate.reduce(function (match, pred) {
            return match || _isDeepMatch(pred, actual);
        }, false);
        return res;
    } else if (typeof predicate === 'object' && typeof actual === 'object') {
        let res = Object.keys(predicate).reduce(function (match, prop) {
            let pred = predicate[prop];
            return match
                && (
                    pred === undefined
                        && !(prop in actual)
                    || pred !== undefined
                        && prop in actual
                        && _isDeepMatch(predicate[prop], actual[prop])
                )
            ;
        }, true);
        return res;
    } else {
        return predicate === actual;
    }
}

module.exports = Target