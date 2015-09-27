'use strict';

module.exports.resolveProp = resolveProp;

/**
 * Deep lookup a key in an object
 *
 * @example
 
 let obj = { a: 1, b: { c: { d: true } } }
 resolveProp(obj, 'b.c.d') // true
 resolveProp(obj, ['b', 'c']) // { d: true }
 resolveProp(obj, 'a.x.y', '<unset>') // '<unset>'

 * @param  {*} obj The object to search in
 * @param  {String|Array<String>} key A dot-separated key path or an array of keys
 * @param  {*} [defaultValue] The value to return if the key doesn't exist in obj (default: undefined)
 * @return {*} The key from obj, or defaultValue if it doesnt exist
 */
function resolveProp (obj, key, defaultValue) {
    if (!Array.isArray(key)) {
        key = key.split('.');
    } else {
        key = key.slice(0);
    }

    let firstkey = key.shift();

    if (typeof obj === 'object' && firstkey in obj) {
        return key.length
            ? resolveProp(obj[firstkey], key, defaultValue)
            : obj[firstkey]
        ;
    } else {
        return defaultValue;
    }
}