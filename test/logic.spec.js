'use strict';

const expect = require('chai').expect;
const logic = require('../src/logic'),
      Entity = require('../src/entity');

describe('logic', function () {
    // We use the easy { $ } i.e. { '$': $ } to easily create new non-empty objects
    let $ = true;

    describe('filters', function () {
        let filters = logic.filters;

        it('should be a map', function () {
            expect(filters).to.be.an('object');
        });

        describe('$and()', function () {
            it('should accept an array param and return true if at least one value evaluate as truthy', function () {
                let context = {},
                    value = { };

                expect(filters.$and([ true, true, true ], context, value)).to.be.true;
                expect(filters.$and([ true, false, true ], context, value)).to.be.false;
                expect(filters.$and([ false ], context, value)).to.be.false;
                expect(filters.$and([ true ], context, value)).to.be.true;
                expect(filters.$and([ ], context, value)).to.be.false;
            });

            it('should accept boolean params and return their value', function () {
                let context = {},
                    value = { };

                expect(filters.$and(true, context, value)).to.be.true;
                expect(filters.$and(false, context, value)).to.be.false;
            });

            // Untested: object case
            it('should return false on empty objects', function () {
                expect(filters.$and({}, context, {})).to.be.false;
            });

            it('should return boolean evaluation of other types', function () {
                let context = {}, value = { };

                expect(filters.$and(undefined, context, value)).to.be.false;
                expect(filters.$and(null, context, value)).to.be.false;
                expect(filters.$and(0, context, value)).to.be.false;
                expect(filters.$and(21, context, value)).to.be.true;
                expect(filters.$and('hello', context, value)).to.be.true;
                expect(filters.$and(function () {}, context, value)).to.be.true;
            });
        });

        describe('$or()', function () {
            it('should accept an array and return true if any of its conditions is truthy', function () {
                expect(filters.$or([ false, true, false ], {}, { $ })).to.be.true;
                expect(filters.$or([ true, true, true ], {}, { $ })).to.be.true;
                expect(filters.$or([ false, false, false ], {}, { $ })).to.be.false;
                expect(filters.$or([ ], {}, { })).to.be.false;
            });

            it('should choke on non-array params', function () {
                expect(function () {
                    filters.$or(undefined, {}, { });
                }, 'undefined param').to.throw();

                expect(function () {
                    filters.$or(null, {}, { });
                }, 'null param').to.throw();

                expect(function () {
                    filters.$or(21, {}, { });
                }, 'number param').to.throw();

                expect(function () {
                    filters.$or('hello', {}, { });
                }, 'string param').to.throw();

                expect(function () {
                    filters.$or({ $ }, {}, { });
                }, 'object param').to.throw();

                expect(function () {
                    filters.$or(function () {}, {}, { });
                }, 'function param').to.throw();
            });
        });

        describe('$is()', function () {
            it('should return false if param or value is undefined, but not both', function () {
                expect(filters.$is(undefined, {}, { $ })).to.be.false;
                expect(filters.$is({ $ }, {}, undefined)).to.be.false;
                expect(filters.$is(undefined, {}, undefined)).to.be.true;
            });

            it('should return false if param or value is null, but not both', function () {
                expect(filters.$is(null, {}, { $ })).to.be.false;
                expect(filters.$is({ $ }, {}, null)).to.be.false;
                expect(filters.$is(null, {}, null)).to.be.true;
            });

            it('should return true if param is an entity and value one of its instances', function () {
                let e1 = new Entity({ attributes: [ 'id' ] }),
                    e2 = new Entity({ attributes: [ 'id' ] });

                let i11 = e1.from({ id: 1 }),
                    i12 = e1.from({ id: 2 }),
                    i21 = e2.from({ id: 1 });

                    expect(filters.$is(e1, {}, i11)).to.be.true;
                    expect(filters.$is(e1, {}, i12)).to.be.true;
                    expect(filters.$is(e1, {}, i21)).to.be.false;

                    expect(filters.$is(e2, {}, i11)).to.be.false;
                    expect(filters.$is(e2, {}, i12)).to.be.false;
                    expect(filters.$is(e2, {}, i21)).to.be.true;
            });

            it('should use Entity.Instance#$equals() when either param or value is an Entity.Instance', function () {
                let e1 = new Entity({ attributes: [ 'id' ] }),
                    e2 = new Entity({ attributes: [ 'id' ] });

                let i11 = e1.from({ id: 1 }),
                    i12 = e1.from({ id: 2 }),
                    i13 = e1.from({ id: 1 }),
                    i21 = e2.from({ id: 1 });

                expect(filters.$is(i11, {}, i11)).to.be.true;
                expect(filters.$is(i11, {}, i13)).to.be.true;
                expect(filters.$is(i11, {}, i13.$id)).to.be.true;
                expect(filters.$is(i11.$id, {}, i13)).to.be.true;

                expect(filters.$is(i11, {}, i21)).to.be.false;
                expect(filters.$is(i11, {}, i21.$id)).to.be.false;
            })

            it('should return true if param === value', function () {
                let guard = { $ };
                expect(filters.$is(guard, {}, guard)).to.be.true;
                expect(filters.$is('hello', {}, 'hello')).to.be.true;
                expect(filters.$is(42, {}, 42)).to.be.true;
                expect(filters.$is(null, {}, null)).to.be.true;
                expect(filters.$is(true, {}, true)).to.be.true;
                expect(filters.$is(false, {}, false)).to.be.true;
            });

            it('should return false if param !== value', function () {
                expect(filters.$is({ }, {}, { })).to.be.false;
                expect(filters.$is('hello', {}, 'hello2')).to.be.false;
                expect(filters.$is(42, {}, 41)).to.be.false;
                expect(filters.$is(false, {}, true)).to.be.false;
            });
        });

        describe('$fn()', function () {
            it('should accept a function param and use its return value', function () {
                let context = {},
                    value = { };
                let fn1 = function () {
                    return true;
                };
                let fn2 = function () {
                    return false;
                };
                let fn3 = function () {
                    return null;
                };

                expect(filters.$fn(fn1, context, value)).to.be.true;
                expect(filters.$fn(fn2, context, value)).to.be.false;
                expect(filters.$fn(fn3, context, value)).to.be.false;
            });

            it('should pass value and context to the function', function () {
                let context = {},
                    value = { };
                let fn = function (val, ctx) {
                    expect(val).to.equal(value);
                    expect(ctx).to.equal(context);
                    return true;
                };

                expect(function () {
                    filters.$fn(fn, context, value);
                }).not.to.throw();
            });

            it('should choke on non-function params', function () {
                expect(function () {
                    filters.$fn(undefined, {}, {});
                }, 'undefined param').to.throw();

                expect(function () {
                    filters.$fn(null, {}, {});
                }, 'null param').to.throw();

                expect(function () {
                    filters.$fn(21, {}, {});
                }, 'number param').to.throw();

                expect(function () {
                    filters.$fn('hello', {}, {});
                }, 'string param').to.throw();

                expect(function () {
                    filters.$fn({}, {}, {});
                }, 'object param').to.throw();

                expect(function () {
                    filters.$fn(true, {}, {});
                }, 'bool param').to.throw();
            })
        })

        describe('$in()', function () {
            it('should return true if value is found in param', function () {
                expect(filters.$in([ 1, 2, 3 ], {}, 2)).to.be.true;
                expect(filters.$in([ 1, 2, 3 ], {}, 4)).to.be.false;
                expect(filters.$in([ 'abc', 'def', 'ghi' ], {}, 'a')).to.be.false;
            });

            it('should choke on non-array params', function () {
                expect(function () {
                    filters.$or(undefined, {}, {});
                }, 'undefined param').to.throw();

                expect(function () {
                    filters.$or(null, {}, {});
                }, 'null param').to.throw();

                expect(function () {
                    filters.$or(21, {}, {});
                }, 'number param').to.throw();

                expect(function () {
                    filters.$or('hello', {}, {});
                }, 'string param').to.throw();

                expect(function () {
                    filters.$or({}, {}, {});
                }, 'object param').to.throw();

                expect(function () {
                    filters.$or(function () {}, {}, {});
                }, 'function param').to.throw();
            });
        });

        describe('$lte()', function () {
            it('should return value <= param for numbers', function () {
                expect(filters.$lte(50, {}, 10)).to.be.true;
                expect(filters.$lte(50, {}, -10)).to.be.true;
                expect(filters.$lte(50, {}, 50)).to.be.true;
                expect(filters.$lte(50, {}, 0)).to.be.true;
                expect(filters.$lte(0, {}, 0)).to.be.true;
                expect(filters.$lte(50, {}, 51)).to.be.false;
                expect(filters.$lte(-50, {}, 0)).to.be.false;
                expect(filters.$lte(-50, {}, -20)).to.be.false;
            });

            it('should return false if value or param is undefined', function () {
                expect(filters.$lte(undefined, {}, 10)).to.be.false;
                expect(filters.$lte(10, {}, undefined)).to.be.false;
                expect(filters.$lte(undefined, {}, undefined)).to.be.false;
                expect(filters.$lte(-50, {}, -20)).to.be.false;
            });
        });

    });

    describe('evaluate()', function () {
        let evaluate = logic.evaluate;
        it('should resolve non-filter keys as context variable name', function () {
            expect(evaluate('$', { 'var': 50 }, { 'var': 50 })).to.be.true;
        });

        it('should resolve string values as context variables for filters requesting so', function () {
            expect(evaluate('$',
                { 'var': { '$lte': 'maximum' } },
                { 'var': 50, maximum: 100 })
            ).to.be.true;

            expect(evaluate('$',
                { 'var': { '$is': 'ref' } },
                { 'var': 50, ref: 50 })
            ).to.be.true;

            expect(evaluate('$',
                { 'var': { '$is': ' hello' } },
                { 'var': 'hello' })
            ).to.be.true;
        });

        it('should allow composition of filters', function () {
            let cond = {
                var: { $or: [
                    { $is: 50 },
                    { $lte: 20 },
                    { $is: 'ref' },
                ] }
            };

            expect(evaluate('$', cond, { var: 50 })).to.be.true;
            expect(evaluate('$', cond, { var: 10 })).to.be.true;
            expect(evaluate('$', cond, { var: 8000, ref: 8000 })).to.be.true;
        })

        it('should iterpret array values as a shorthand for $in ', function () {
            let cond = {
                var: [ 1, 2, 3 ]
            };

            expect(evaluate('$', cond, { var: 1 })).to.be.true;
            expect(evaluate('$', cond, { var: 2 })).to.be.true;
            expect(evaluate('$', cond, { var: 15 })).to.be.false;
        })
    })
});
