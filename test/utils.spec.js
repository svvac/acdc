'use strict';

const expect = require('chai').expect;
const utils = require('../src/utils');

describe('utils', function () {

    describe('resolveProp()', function () {
        let resolveProp = utils.resolveProp;

        it('should resolve keys of a dict/map', function () {
            let obj = { hello: 'world' };

            expect(resolveProp(obj, 'hello')).to.equal('world');
        });

        it('should deep resolve keys of a dict/map', function () {
            let obj = { hello: 'world', a: { b: { c: true, c2: new Date() } } };

            expect(resolveProp(obj, 'a.b.c')).to.be.true;
            expect(resolveProp(obj, 'a.b.c2')).to.equal(obj.a.b.c2);
        });

        it('should should accept an array as key path', function () {
            let obj = { hello: 'world', a: { 'hello.world': true } };

            expect(resolveProp(obj, [ 'a', 'hello.world' ])).to.be.true;
        });

        it('should return `defaultValue` when the key doesn\'t exist', function () {
            let obj = { hello: 'world' };

            expect(resolveProp(obj, 'no.such.key')).to.be.undefined;

            let guard = {};
            expect(resolveProp(obj, 'no.such.key', guard)).to.equal(guard);
        });
    });

});
