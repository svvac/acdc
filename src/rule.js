'use strict';

const Target = require('./target'),
      utils  = require('./utils'),
      logic  = require('./logic');

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

    resolve (request) {
        if ('onActivation' in this.hooks) {
            this.hooks.onActivation(request);
        }

        var result = logic.evaluate('$', this.condition, request);

        if (result && this.allow || !result && this.deny) {
            if ('onApproval' in this.hooks) {
                this.hooks.onApproval(request);
            }

            return true;
        } else {
            if ('onDenial' in this.hooks) {
                this.hooks.onDenial(request);
            }

            return false;
        }
    }

    toString () {
        return '[Rule:' + this.config.id + ']';
    }
}

module.exports = Rule;