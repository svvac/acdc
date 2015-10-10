'use strict';

const Target = require('./target'),
      Rule = require('./rule'),
      utils = require('./utils'),
      CST = require('./constants');

let _policyCount = 0;

class Policy extends Target {
    constructor (config) {
        config = config || {};

        config.id = config.id || 'policy' + (++_policyCount);

        super('target' in config ? config.target : {});
        
        this.targets = [];
        
        this.config = config;

        this.combine('combinator' in this.config
            ? this.config.combinator
            : 'FirstMatch');
    }

    combine(combinator) {
        if (typeof combinator === 'string') {
            this.config.combinator = Policy.Combinators[combinator];
            this.config.combinatorName = combinator;
        } else if (typeof combinator === 'function') {
            this.config.combinator = combinator;
            this.config.combinatorName = combinator.name || 'custom'
        } else if (typeof combinator === 'object') {
            this.config.combinator = Policy.Combinators.$compile(combinator);
            this.config.combinatorName = 'custom';
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
        if (!this.isTargeted(request, debug)) {
            if (debug) console.log(debug, '=>', utils.logVerdict(CST.NOT_APPLICABLE));
            
            return CST.NOT_APPLICABLE;
        }

        if (debug) {
            console.log(debug,
                'resolving'.white, this.toString(),
                'with combinator', this.config.combinatorName.blue);
        }

        let ret = this.config.combinator(this.targets, request, debug ? debug + ' |'.black : false);
    
        if (debug) {
            console.log(debug,
                '=>', utils.logVerdict(ret));
        }

        return ret;
    }

    toString () {
        return '[Policy:' + this.config.id + ']';
    }
}


Policy.Combinators = (function () {
    let A = CST.ALLOW,
        D = CST.DENY,
        N = CST.NOT_APPLICABLE,
        U = CST.UNDETERMINED;

    let indexes = {}
    indexes[A] = 0;
    indexes[D] = 1;
    indexes[N] = 2;
    indexes[U] = 3;

    let tables = {};

    tables.FirstMatch =
        [     A,
              D, 
         [         ],
              U     ];


    tables.AllowOverrides = 
        [[ A, A, A, U ],
         [ A, D, D, U ],
         [ A, D, N, U ],
         [ A, U, U, U ]];


    tables.DenyOverrides = 
        [[ A, D, A, U ],
         [ D, D, D, U ],
         [            ],
         [ U, D, U, U ]];


    tables.OnlyOneMatch =
        [[ U, U, A, U ],
         [ U, U, D, U ],
         [            ],
                U      ];


    let combinators = {};
    Object.keys(tables).forEach(function (cmb) {
        combinators[cmb] = compileCombinator(tables[cmb], cmb);
    });

    combinators.$compile = compileCombinator;

    console.log(combinators);

    return combinators;


    function compileCombinator (truthTable, name) {
        let combinator = function (targets, request, debug) {
            return targets.reduce(function (prev, target, i) {
                let dbg = debug;

                let rule = truthTable[indexes[prev]];

                // If the rule is unconditional, i.e. if it doesn't depend on the
                // evaluation of the current rule, skip
                if (!Array.isArray(rule)) {
                    if (dbg) {
                        console.log(dbg, ('(' + (i+1) + ') ' + target.toString() +
                            ' (skipped)').grey);
                        console.log(dbg, ' =>', utils.logVerdict(prev));
                    }

                    return rule;
                }

                if (dbg) {
                    console.log(dbg, ' ' + (i+1) + '.', target.toString());
                    dbg += ' ';
                }

                let resolution = target.resolve(request,
                    dbg ? dbg + ' | '.black : false);

                if (rule.length > 0) {
                    resolution = rule[indexes[resolution]];
                }

                if (dbg) console.log(dbg, '=>', utils.logVerdict(resolution));
                
                return resolution;
            }, null);
        };

        return combinator;
    }
})();

module.exports = Policy;