'use strict';

const SafeString = Kumis.Util.SafeString;

/**
 * Returns `true` if the object is a function, otherwise `false`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function callable(value) {
    return isFunction(value);
}

exports.callable = callable;

/**
 * Returns `true` if the object is strictly not `undefined`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function defined(value) {
    return value !== undefined;
}

exports.defined = defined;

/**
 * Returns `true` if the operand (one) is divisble by the test's argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function divisibleby(one, two) {
    return 0 === (one % two);
}

exports.divisibleby = divisibleby;

/**
 * Returns true if the string has been escaped (i.e., is a SafeString).
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function escaped(value) {
    return value instanceof SafeString;
}

exports.escaped = escaped;

/**
 * Returns `true` if the arguments are strictly equal.
 *
 * @param {*} one
 * @param {*} two
 */
function equalto(one, two) {
    return one === two;
}

exports.equalto = equalto;

// Aliases
exports.eq = exports.equalto;
exports.sameas = exports.equalto;

/**
 * Returns `true` if the value is evenly divisible by 2.
 *
 * @param {number} value
 *
 * @returns {boolean}
 */
function even(value) {
    return 0 === value % 2;
}

exports.even = even;

/**
 * Returns `true` if the value is falsy - if I recall correctly, '', 0, false,
 * undefined, NaN or null. I don't know if we should stick to the default JS
 * behavior or attempt to replicate what Python believes should be falsy (i.e.,
 * empty arrays, empty dicts, not 0...).
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function falsy(value) {
    return !value;
}

exports.falsy = falsy;

/**
 * Returns `true` if the operand (one) is greater or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function ge(one, two) {
    return one >= two;
}

exports.ge = ge;

/**
 * Returns `true` if the operand (one) is greater than the test's argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function greaterthan(one, two) {
    return one > two;
}

exports.greaterthan = greaterthan;

// Alias
exports.gt = exports.greaterthan;

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function le(one, two) {
    return one <= two;
}

exports.le = le;

/**
 * Returns `true` if the operand (one) is less than the test's passed argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function lessthan(one, two) {
    return one < two;
}

exports.lessthan = lessthan;

// Alias
exports.lt = exports.lessthan;

/**
 * Returns `true` if the string is lowercased.
 *
 * @param {string} value
 *
 * @returns {boolean}
 */
function lower(value) {
    return value.toLowerCase() === value;
}

exports.lower = lower;

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
function ne(one, two) {
    return one !== two;
}

exports.ne = ne;

/**
 * Returns true if the value is strictly equal to `null`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function nullTest(value) {
    return null === value;
}

exports.null = nullTest;

/**
 * Returns true if value is a number.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function number(value) {
    return isNumber(value);
}

exports.number = number;

/**
 * Returns `true` if the value is *not* evenly divisible by 2.
 *
 * @param {number} value
 *
 * @returns {boolean}
 */
function odd(value) {
    return 1 === value % 2;
}

exports.odd = odd;

/**
 * Returns `true` if the value is a string, `false` if not.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function string(value) {
    return isString(value);
}

exports.string = string;

/**
 * Returns `true` if the value is not in the list of things considered falsy:
 * '', null, undefined, 0, NaN and false.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function truthy(value) {
    return !! value;
}

exports.truthy = truthy;

/**
 * Returns `true` if the value is undefined.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function undefinedTest(value) {
    return value === undefined;
}

exports.undefined = undefinedTest;

/**
 * Returns `true` if the string is uppercased.
 *
 * @param {string} value
 *
 * @returns {boolean}
 */
function upper(value) {
    return value.toUpperCase() === value;
}

exports.upper = upper;

/**
 * Returns `true` if the value implements the `Symbol.iterator` method.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function iterable(value) {
    return !! value[Symbol.iterator];
}

exports.iterable = iterable;

/**
 * Returns `true` if the value is an object hash or an ES6 Map.
 * Otherwise just return if it's an object hash.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
function mapping(value) {
    return value instanceof Map || isObjectLiteral(value);
}

exports.mapping = mapping;
