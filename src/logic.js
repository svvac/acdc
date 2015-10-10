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
    '$in': in_filter,

    '$lte': lte_filter,
}

filters.$fn.resolveInContext = true;
filters.$is.resolveInContext = true;
filters.$lte.resolveInContext = true;
filters.$in.resolveInContext = true;

/**
 * Evaluates a conditional construct
 *
 * When the predicate is a filter, evaluate returns `filters[predicate](param,
 * context, value)`. Refer to the filter docs for a list of available filters
 * and their usage. If the filter function has a property `resolveInContext` set
 * to `true` and param is a string, the parameter passed to the filter is first
 * resolved from the local context. If the param starts with a space, it is then
 * considered as a string literal and is passed as-is to the filter, with the
 * leading space stripped.
 *
 *     context: { a: 'a value' }
 *     "a" => "a value"
 *     " a" => "a"
 *     "  a" => " a"
 *
 * Otherwise, `evaluate` attempts to resolve the predicate as a variable name in
 * the context, before returning the following test:
 *
 *   - If the resolution failed (returns undefined), return false unless the
 *     parameter is also undefined;
 *   - If the parameter is undefined, return false unless the resolution failed
 *     (returned undefined);
 *   - If parameter is an Entity, check if the predicate resolved to an instance
 *     of this entity;
 *   - If parameter is an Action, check if the predicate resolved to the same
 *     Action (strict equality);
 *   - If the parameter or the predicate resolved to an Entity.Instance instance,
 *     check if both are equal by using `Entity.Instance.$equals()`;
 *   - If the parameter is an array, apply a `$or` filter with the values
 * 
 * @param  {String} predicate Either a filter defined in `logic.filters` or a
 * variable name to resolve in context
 * @param  {*}      [param]   A parameter for the filter, or a value to match
 * against the varname
 * @param  {Object} [context] The context variables
 * @param  {*}      [value]   The value to be matched against (if any)
 * @return {boolean} Whether the condition evaluated to true          
 */
function evaluate(predicate, param, context, value, debug) {
    if (!(predicate in filters)) {
        let res = utils.resolveProp(context, predicate);
        if (debug) console.log(debug, predicate.white, ('(' + (res ? res.toString() : res) + ')').grey, 'is'.cyan, param.toString());

        value = res;
        predicate = '$is';
    } else {
        if (debug) console.log(debug, predicate.cyan, param.toString(), value ? value.toString() : '-'.grey);
    }


    let filter = filters[predicate];

    if (filter.resolveInContext && typeof param === 'string') {
        param = param[0] === ' '
              ? param.substr(1)
              : utils.resolveProp(context, param);
    }

    let ret = filter(param, context, value, debug);

    if (debug) console.log(debug, '=>', ret ? 'true'.green : 'false'.red);

    return ret;
}

function and_filter (param, context, value, debug) {
    if (!param) {
        return false;
    } if (Array.isArray(param)) {
        return true === param.reduce(function (truthy, cond) {
            if (truthy === true || truthy === null) {
                return and_filter(cond, context, value, debug ? debug + ' | '.black : false);
            } else {
                return false;
            }
        }, null);
    } else if (typeof param === 'object') {
        return true === Object.keys(param).reduce(function (truthy, prop) {
            if (truthy === true || truthy === null) {
                return evaluate(prop, param[prop], context, value, debug ? debug + ' | '.black : false);
            } else {
                return false;
            }
        }, null);
    }

    return true;
}

function or_filter (param, context, value, debug) {
    if (!Array.isArray(param)) throw 'Invalid value';

    return param.reduce(function (truthy, cond) {
        return truthy || and_filter(cond, context, value);
    }, false);
}

const PRIMITIVE_TYPES = [ 'boolean', 'number', 'undefined' ];

function is_filter (param, context, value, debug) {
    // If unresolved, return false unless param is undefined
    if (value === undefined || param === undefined
     || value === null      || param === null) {
        return param === value;

    // If matching against an entity, check if it resolved to an instance of
    // this entity (Entity = Subject | Ressource)
    } else if (param instanceof Entity) {
        return value instanceof param.Instance;

    // If matching against an action, check if it resolved to the same one
    }  else if (param instanceof Action) {
        return param === value;

    // If we resolved to an Entity.Instance, or if matching against one,
    // delegate the equality check to Entity.Instance.$equals()
    } else if (typeof param === 'object' && param instanceof Entity.Instance) {
        return param.$equals(value);
    } else if (typeof value === 'object' && value instanceof Entity.Instance) {
        return value.$equals(param);

    // If matching against an Array, its a shorthand for `$in: param`
    } else if (Array.isArray(param)) {
        return in_filter(param, context, value);

    // If matching against an object, use $and
    } else if (typeof param === 'object') {
        return and_filter(param, context, value);

    // If matching against a function, use $fn
    } else if (typeof param === 'function') {
        return fn_filter(param, context, value);
    }

    // All that to fallback to strict equality
    return param === value;
}

function fn_filter (param, context, value, debug) {
    if (typeof param !== 'function') throw 'Invalid value';

    return !!param(value, context);
}

function in_filter (param, context, value, debug) {
    if (!Array.isArray(param)) throw 'Invalid value';

    let cond = param.map(function (v) { return { '$is': v } });

    return or_filter(cond, context, value);
}

function lte_filter (param, context, value, debug) {
    if (typeof param === 'number') {
        return param !== undefined
            && value !== undefined
            && value <= param;
    }

    return false;
}

