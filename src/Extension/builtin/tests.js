'use strict';

const SafeString = Kumis.Util.SafeString;

/**
 * Returns `true` if the object is a function, otherwise `false`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function callable(value) {
    return isFunction(value);
}

/**
 * Returns `true` if the object is strictly not `undefined`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function defined(value) {
    return value !== undefined;
}

/**
 * Returns `true` if the operand (one) is divisble by the test's argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function divisibleby(one, two) {
    return 0 === (one % two);
}

/**
 * Returns true if the string has been escaped (i.e., is a SafeString).
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function escaped(value) {
    return value instanceof SafeString;
}

/**
 * Returns `true` if the arguments are strictly equal.
 *
 * @param {*} one
 * @param {*} two
 */
export function equalto(one, two) {
    return one === two;
}

// Aliases
export const eq = equalto;
export const sameas = equalto;

/**
 * Returns `true` if the value is evenly divisible by 2.
 *
 * @param {number} value
 *
 * @returns {boolean}
 */
export function even(value) {
    return 0 === value % 2;
}

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
export function falsy(value) {
    return !value;
}

/**
 * Returns `true` if the operand (one) is greater or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function ge(one, two) {
    return one >= two;
}

/**
 * Returns `true` if the operand (one) is greater than the test's argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function greaterthan(one, two) {
    return one > two;
}

// Alias
export const gt = greaterthan;

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function le(one, two) {
    return one <= two;
}

/**
 * Returns `true` if the operand (one) is less than the test's passed argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function lessthan(one, two) {
    return one < two;
}

// Alias
export const lt = lessthan;

/**
 * Returns `true` if the string is lowercased.
 *
 * @param {string} value
 *
 * @returns {boolean}
 */
export function lower(value) {
    return value.toLowerCase() === value;
}

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 *
 * @param {number} one
 * @param {number} two
 *
 * @returns {boolean}
 */
export function ne(one, two) {
    return one !== two;
}

/**
 * Returns true if the value is strictly equal to `null`.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function nullTest(value) {
    return null === value;
}

/**
 * Returns true if value is a number.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function number(value) {
    return isNumber(value);
}

/**
 * Returns `true` if the value is *not* evenly divisible by 2.
 *
 * @param {number} value
 *
 * @returns {boolean}
 */
export function odd(value) {
    return 1 === value % 2;
}

/**
 * Returns `true` if the value is a string, `false` if not.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function string(value) {
    return isString(value);
}

/**
 * Returns `true` if the value is not in the list of things considered falsy:
 * '', null, undefined, 0, NaN and false.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function truthy(value) {
    return !! value;
}

/**
 * Returns `true` if the value is undefined.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function undefinedTest(value) {
    return value === undefined;
}

/**
 * Returns `true` if the string is uppercased.
 *
 * @param {string} value
 *
 * @returns {boolean}
 */
export function upper(value) {
    return value.toUpperCase() === value;
}

/**
 * Returns `true` if the value implements the `Symbol.iterator` method.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function iterable(value) {
    return !! value[Symbol.iterator];
}

/**
 * Returns `true` if the value is an object hash or an ES6 Map.
 * Otherwise just return if it's an object hash.
 *
 * @param {*} value
 *
 * @returns {boolean}
 */
export function mapping(value) {
    return value instanceof Map || isObjectLiteral(value);
}
