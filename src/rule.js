'use strict';

const Target = require('./target'),
      utils  = require('./utils'),
      logic  = require('./logic'),
      CST    = require('./constants');

let _ruleCount = 0;

class Rule extends Target {
    constructor (config) {
        config = config || {};

        config.id = config.id || 'rule' + (++_ruleCount);

        super(config.target);

        this.config = config;

        this.hooks = this.config.hooks || {};

        this.method = 'method' in this.config
                      && this.config.method === 'deny'
                    ? 'deny' : 'allow';

        this.deny  = this.method === 'deny'
        this.allow = this.method === 'allow';

        this.condition = this.config.condition || {};
    }

    resolve (request, debug) {
        if (!this.isTargeted(request, debug)) {
            if (debug) console.log(debug, '=>', utils.logVerdict(CST.NOT_APPLICABLE));
            return CST.NOT_APPLICABLE;
        }

        if (debug) console.log(debug, 'resolving'.white, this.toString(), 'with method',
            (this.allow ? 'Allow' : 'Deny').blue);

        if ('onActivation' in this.hooks) {
            this.hooks.onActivation(request);
        }

        var result = logic.evaluate(
            '$and',
            this.condition,
            request,
            undefined,
            debug ? debug + ' | '.black : false
        );

        if (result && this.allow || !result && this.deny) {
            if (debug) console.log(debug, '=>', utils.logVerdict(CST.ALLOW));

            if ('onApproval' in this.hooks) {
                this.hooks.onApproval(request);
            }

            return CST.ALLOW;
        } else {
            if (debug) console.log(debug, '=>', utils.logVerdict(CST.DENY));

            if ('onDenial' in this.hooks) {
                this.hooks.onDenial(request);
            }

            return CST.DENY;
        }
    }

    toString () {
        return '[Rule:' + this.config.id + ']';
    }
}

module.exports = Rule;