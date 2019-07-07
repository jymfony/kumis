const TemplateError = Kumis.Exception.TemplateError;
const UndefinedVariableError = Kumis.Exception.UndefinedVariableError;
const SafeString = Kumis.Util.SafeString;

const kwArgsSymbol = Symbol('keywordArgs');

/**
 * @memberOf Kumis
 */
class Runtime {
    static makeMacro(argNames, kwargNames, func) {
        return (...macroArgs) => {
            const argCount = __self.numArgs(macroArgs);
            let args;
            const kwargs = __self.getKeywordArgs(macroArgs);

            if (argCount > argNames.length) {
                args = macroArgs.slice(0, argNames.length);

                // Positional arguments that should be passed in as
                // Keyword arguments (essentially default values)
                macroArgs.slice(args.length, argCount).forEach((val, i) => {
                    if (i < kwargNames.length) {
                        kwargs[kwargNames[i]] = val;
                    }
                });
                args.push(kwargs);
            } else if (argCount < argNames.length) {
                args = macroArgs.slice(0, argCount);

                for (let i = argCount; i < argNames.length; i++) {
                    const arg = argNames[i];

                    // Keyword arguments that should be passed as
                    // Positional arguments, i.e. the caller explicitly
                    // Used the name of a positional arg
                    args.push(kwargs[arg]);
                    delete kwargs[arg];
                }
                args.push(kwargs);
            } else {
                args = macroArgs;
            }

            return func.apply(this, args);
        };
    }

    static makeKeywordArgs(obj) {
        obj[kwArgsSymbol] = true;
        return obj;
    }

    static isKeywordArgs(obj) {
        return obj && Object.prototype.hasOwnProperty.call(obj, kwArgsSymbol);
    }

    static getKeywordArgs(args) {
        const len = args.length;
        if (len) {
            const lastArg = args[len - 1];
            if (__self.isKeywordArgs(lastArg)) {
                return lastArg;
            }
        }

        return {};
    }

    static numArgs(args) {
        const len = args.length;
        if (0 === len) {
            return 0;
        }

        const lastArg = args[len - 1];
        if (__self.isKeywordArgs(lastArg)) {
            return len - 1;
        }

        return len;
    }

    static suppressValue(val, autoescape) {
        val = (val !== undefined && null !== val) ? val : '';

        if (autoescape && !(val instanceof SafeString)) {
            val = __jymfony.htmlentities(val.toString(), 'ENT_QUOTES');
        }

        return val;
    }

    static memberLookup(obj, val) {
        if (obj === undefined || null === obj) {
            return undefined;
        }

        if (isFunction(obj[val])) {
            return (...args) => obj[val](...args);
        }

        return obj[val];
    }

    static callWrap(obj, name, context, args) {
        if (! obj) {
            throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
        } else if (! isFunction(obj)) {
            throw new Error('Unable to call `' + name + '`, which is not a function');
        }

        return obj.apply(context, args);
    }

    /**
     * Lookup in frame, context and globals for a given variable.
     *
     * @param {Kumis.Context} context
     * @param {Kumis.Util.Frame} frame
     * @param {string} name
     * @param {boolean} suppressUndefined
     *
     * @returns {*}
     */
    static contextOrFrameLookup(context, frame, name, suppressUndefined = false) {
        if (frame.has(name)) {
            return frame.lookup(name);
        }

        if (suppressUndefined) {
            try {
                return context.lookup(name);
            } catch (e) {
                if (! (e instanceof UndefinedVariableError)) {
                    throw e;
                }

                return undefined;
            }
        }

        return context.lookup(name);
    }

    static handleError(error, lineno, colno) {
        if (error instanceof TemplateError) {
            if (error.lineno === undefined && error.colno === undefined) {
                error.lineno = lineno;
                error.colno = colno;
            }

            return error;
        }

        return new TemplateError(error, lineno, colno);
    }

    static fromIterator(arr) {
        if ('object' !== typeof arr || null === arr || isArray(arr)) {
            return arr;
        } else if (Symbol.iterator in arr) {
            return Array.from(arr);
        }

        return arr;
    }

    static inOperator(key, val) {
        if (isArray(val) || isString(val)) {
            return -1 !== val.indexOf(key);
        } else if (isObject(val)) {
            return key in val;
        }

        throw new Error('Cannot use "in" operator to search for "' + key + '" in unexpected types.');
    }
}

module.exports = Runtime;
