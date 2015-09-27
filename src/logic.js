'use strict';

const utils = require('./utils'),
      Entity = require('./entity'),
      Action = require('./action');

module.exports.evaluate = evaluate;

let filters = module.exports.filters = {
    '$and': and_filter,
    '$': and_filter,

    '$or': or_filter,

    '$fn': fn_filter,
    '$is': is_filter,
    '$lte': lte_filter,
    '$in': in_filter,
}

filters.$fn.resolveInContext = true;
filters.$is.resolveInContext = true;
filters.$lte.resolveInContext = true;
filters.$in.resolveInContext = true;

function evaluate(predicate, param, context, value) {
    if (predicate in filters) {
        let filter = filters[predicate];

        if (filter.resolveInContext && typeof param === 'string') {
            param = param[0] === ' '
                  ? param.substr(1)
                  : utils.resolveProp(context, param);
        }

        return filter(param, context, value);
    }
    
    var prop = utils.resolveProp(context, predicate);

    //console.log('--->', prop, '===', param);

    if (param instanceof Entity) {
        return prop instanceof param.Instance;
    }  else if (param instanceof Action) {
        return param === prop;
    } if (typeof param === 'object' && param instanceof Entity.Instance) {
        return param.$equals(prop);
    } else if (typeof prop === 'object' && prop instanceof Entity.Instance) {
        return prop.$equals(param);
    } else if (Array.isArray(param)) {
        return evaluate('$in', param, context, prop);
    } else if (typeof param === 'function' || typeof param === 'object') {
        return evaluate('$', param, context, prop)
    } else if (param === undefined) {
        return prop === undefined;
    }

    return prop !== undefined
        && prop === param;
}

function and_filter (param, context, value) {
    if (Array.isArray(param)) {
        return param.reduce(function (truthy, cond) {
            return truthy && evaluate('$and', cond, context, value);
        }, true);
    } else if (typeof param === 'object') {
        return Object.keys(param).reduce(function (truthy, prop) {
            return truthy && evaluate(prop, param[prop], context, value);
        }, true);
    } else if (typeof param === 'boolean') {
        return param;
    }

    throw 'Invalid value';
}

function or_filter (param, context, value) {
    if (!Array.isArray(param)) throw 'Invalid value';

    return param.reduce(function (truthy, cond) {
        return truthy || evaluate('$', cond, context, value);
    }, false);
}

function is_filter (param, context, value) {
    if (typeof param === 'object' && param instanceof Entity.Instance) {
        return param.$equals(value);
    } else if (typeof value === 'object' && value instanceof Entity.Instance) {
        return value.$equals(param);
    } else {
        return param !== undefined
            && value !== undefined
            && param === value;
    }
}

function fn_filter (param, context, value) {
    if (typeof param !== 'function') throw 'Invalid value';

    return !!param(value, context);
}

function in_filter (param, context, value) {
    if (!Array.isArray(param)) throw 'Invalid value';

    return param.indexOf(value) > -1;
}

function lte_filter (param, context, value) {
    if (typeof param === 'number') {
        return param !== undefined
            && value !== undefined
            && value <= param;
    }

    return false;
}

