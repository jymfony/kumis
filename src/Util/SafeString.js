/**
 * A SafeString object indicates that the string should not be
 * autoescaped. This happens magically because autoescaping only
 * occurs on primitive string objects.
 *
 * @memberOf Kumis.Util
 */
class SafeString extends String {
    constructor(val) {
        if (! isString(val)) {
            return val;
        }

        super(val);
        this.val = val;
    }

    /**
     * Returns the primitive value of the specified object.
     *
     * @returns {string}
     */
    valueOf() {
        return this.val;
    }

    /**
     * Returns a string representation of a string.
     *
     * @returns {string}
     */
    toString() {
        return this.val;
    }

    static markSafe(val) {
        if (isString(val)) {
            return new SafeString(val);
        } else if (! isFunction(val)) {
            return val;
        }

        return (...args) => {
            const ret = val.apply(this, args);

            if (isString(ret)) {
                return new SafeString(ret);
            }

            return ret;
        };
    }

    static copy(dest, target) {
        if (dest instanceof SafeString) {
            return new SafeString(target);
        }

        return target.toString();
    }
}

module.exports = SafeString;
