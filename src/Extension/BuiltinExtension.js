const AbstractExtension = Kumis.Extension.AbstractExtension;

const filters = require('./builtin/filters');
const tests = require('./builtin/tests');

/**
 * This includes all the builtin globals, filters and tests.
 *
 * @memberOf Kumis.Extension
 */
class BuiltinExtension extends AbstractExtension {
    /**
     * @inheritDoc
     */
    get globals() {
        return {
            range(start, stop = undefined, step = 1) {
                if (undefined === stop) {
                    stop = start;
                    start = 0;
                }

                const arr = [];
                if (0 < step) {
                    for (let i = start; i < stop; i += step) {
                        arr.push(i);
                    }
                } else {
                    for (let i = start; i > stop; i += step) { // eslint-disable-line for-direction
                        arr.push(i);
                    }
                }
                return arr;
            },

            cycler(...args) {
                let index = -1;

                return {
                    current: null,
                    reset() {
                        index = -1;
                        this.current = null;
                    },

                    next() {
                        index++;
                        if (index >= args.length) {
                            index = 0;
                        }

                        this.current = args[index];
                        return this.current;
                    },
                };
            },

            joiner(sep = ',') {
                let first = true;

                return () => {
                    const val = first ? '' : sep;
                    first = false;

                    return val;
                };
            },
        };
    }

    /**
     * @inheritDoc
     */
    get filters() {
        return filters;
    }

    /**
     * @inheritDoc
     */
    get tests() {
        return tests;
    }
}

module.exports = BuiltinExtension;
