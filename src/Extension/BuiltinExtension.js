import * as builtinFilters from './builtin/filters';
import * as builtinTests from './builtin/tests';

const AbstractExtension = Kumis.Extension.AbstractExtension;
const { default_ } = builtinFilters;
const { nullTest, undefinedTest } = builtinTests;

const filters = {};
Object.assign(filters, builtinFilters);
delete filters.default_;
filters['default'] = default_;

const tests = {};
Object.assign(tests, builtinTests);
delete tests.nullTest;
delete tests.undefinedTest;
tests['null'] = nullTest;
tests['undefined'] = undefinedTest;

/**
 * This includes all the builtin globals, filters and tests.
 *
 * @memberOf Kumis.Extension
 */
export default class BuiltinExtension extends AbstractExtension {
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
