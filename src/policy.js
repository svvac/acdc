'use strict';

const Target = require('./target'),
      Rule = require('./rule');

class Policy extends Target {
    constructor (config) {
        config = config || {};

        super('target' in config ? config.target : {});
        
        this.targets = [];
        
        this.config = config;

        this.method = 'method' in this.config && this.config.method === 'allow'
                    ? 'allow' : 'deny';

        this.deny = this.method === 'deny';
        this.allow = this.method === 'allow';

        this.config.combinators
        this.combine('combinator' in this.config
            ? this.config.combinator
            : 'firstMatch');
    }

    combine(combinator) {
        if (typeof combinator === 'string') {
            this.config.combinator = Policy.Combinators[combinator];
        } else if (typeof combinator === 'function') {
            this.config.combinator = combinator;
        } else if (!combinator) {
            return this.config.combinator;
        } else {
            // Throw
        }

        return this;
    }

    rule (config) {
        var r = new Rule(config);

        this.targets.push(r);

        return this;
    }

    policy (config) {
        var p = new Policy(config);

        this.targets.push(p);

        return p;
    }

    resolve (request) {
        return this.config.combinator(this.targets, request, this.allow);
    }
}

Policy.Combinators = {
    firstMatch: function (targets, request, fallback) {
        let result = targets.reduce(function (prev, target) {
            return prev === null && target.isTargeted(request)
                   ? target.resolve(request)
                   : prev;
        }, null);

        return result === null ? fallback : result;
    },
    allMatch: function (targets, request, fallback) {
        let result = targets.reduce(function (prev, target) {
            return (prev === null || prev) && target.isTargeted(request)
                   ? target.resolve(request)
                   : prev;
        }, null);

        return result === null ? fallback : result;
    },
    anyMatch: function (targets, request, fallback) {
        let result = targets.reduce(function (prev, target) {
            return (prev === null || !prev) && target.isTargeted(request)
                   ? target.resolve(request)
                   : prev;
        }, null);

        return result === null ? fallback : result;
    },
}

module.exports = Policy;