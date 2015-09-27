'use strict';

const Target = require('./target'),
      Rule = require('./rule');

let _policyCount = 0;

class Policy extends Target {
    constructor (config) {
        config = config || {};

        config.id = config.id || 'policy' + (++_policyCount);

        super('target' in config ? config.target : {});
        
        this.targets = [];
        
        this.config = config;

        this.method = 'method' in this.config && this.config.method === 'allow'
                    ? 'allow' : 'deny';

        this.deny = this.method === 'deny';
        this.allow = this.method === 'allow';

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

    rule (rul) {
        if (!(rul instanceof Rule)) {
            rul = new Rule(rul);
        }

        this.targets.push(rul);

        return this;
    }

    policy (pol) {
        if (!(pol instanceof Policy)) {
            pol = new Policy(pol);
        }

        this.targets.push(pol);

        return pol;
    }

    resolve (request, debug) {
        if (debug) {
            console.log(debug,
                'resolving'.white, this.toString(),
                'with combinator', this.config.combinator.name.blue);
        }
        
        let ret = this.config.combinator(this.targets, request, this.allow, debug ? debug + '  ' : false);
    
        if (debug) {
            console.log(debug,
                '=>', ret ? 'allowed'.green : 'denied'.red);
        }

        return ret;
    }

    toString () {
        return '[Policy:' + this.config.id + ']';
    }
}

Policy.Combinators = {
    firstMatch: function firstMatch (targets, request, fallback, debug) {
        let result = targets.reduce(function (prev, target, i) {
            let dbg = debug;
            if (prev !== null) {
                if (dbg) console.log(dbg, '(' + i + ')', target.toString());
                return prev;
            }

            if (dbg) {
                console.log(dbg, ' ' + i + '.', target.toString());
                dbg += '    '
            }

            if (target.isTargeted(request, dbg)) {
                if (dbg) console.log(dbg, '=>', 'targeted'.white);
                let ret = target.resolve(request, dbg);
                if (dbg) console.log(dbg, '=>', ret ? 'allowed'.green : 'denied'.red);
                return ret;
            }

            if (dbg) console.log(dbg, '=>', 'not a target');

            return null;
        }, null);

        return result === null ? fallback : result;
    },
    allMatch: function allMatch (targets, request, fallback, debug) {
        let result = targets.reduce(function (prev, target) {
            return (prev === null || prev) && target.isTargeted(request)
                   ? target.resolve(request)
                   : prev;
        }, null);

        return result === null ? fallback : result;
    },
    anyMatch: function anyMatch (targets, request, fallback, debug) {
        let result = targets.reduce(function (prev, target) {
            return (prev === null || !prev) && target.isTargeted(request)
                   ? target.resolve(request)
                   : prev;
        }, null);

        return result === null ? fallback : result;
    },
}

module.exports = Policy;