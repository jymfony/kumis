/**
 * Frames keep track of scoping both at compile-time and run-time so
 * we know how to access variables. Block tags can introduce special
 * variables, for example.
 *
 * @memberOf Kumis.Util
 */
export default class Frame {
    /**
     * Constructor.
     *
     * @param {Kumis.Util.Frame} parent
     * @param {boolean} isolateWrites
     */
    __construct(parent, isolateWrites) {
        this.variables = Object.create(null);

        /**
         * @type {Kumis.Util.Frame}
         */
        this.parent = parent;

        this.topLevel = false;
        // If this is true, writes (set) should never propagate upwards past
        // This frame to its parent (though reads may).
        this.isolateWrites = isolateWrites;
    }

    /**
     * Sets a variable.
     *
     * @param {string} name
     * @param {*} val
     * @param {boolean} [resolveUp = false]
     */
    set(name, val, resolveUp = false) {
        // Allow variables with dots by automatically creating the
        // Nested structure
        const parts = name.split('.');
        let obj = this.variables;
        let frame = this;

        if (resolveUp) {
            if ((frame = this.resolve(parts[0], true))) {
                frame.set(name, val);

                return;
            }
        }

        for (let i = 0; i < parts.length - 1; i++) {
            const id = parts[i];

            if (!obj[id]) {
                obj[id] = {};
            }

            obj = obj[id];
        }

        obj[parts[parts.length - 1]] = val;
    }

    /**
     * Gets a variable from current frame.
     *
     * @param {string} name
     *
     * @returns {any}
     */
    get(name) {
        const val = this.variables[name];
        if (val !== undefined) {
            return val;
        }

        return null;
    }

    /**
     * Whether the frame has defined the given variable.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    has(name) {
        if (name in this.variables) {
            return true;
        }

        return this.parent ? this.parent.has(name) : false;
    }

    /**
     * Looks up a variable with given name recursively
     * to parent frames.
     *
     * @param {string} name
     *
     * @returns {*}
     */
    lookup(name) {
        return undefined !== this.variables[name] ?
            this.variables[name] :
            this.parent && this.parent.lookup(name);
    }

    /**
     * Resolves a frame for the variable with the given name.
     *
     * @param {string} name
     * @param {boolean} forWrite
     *
     * @returns {Kumis.Util.Frame}
     */
    resolve(name, forWrite) {
        if (this.variables[name] !== undefined) {
            return this;
        }

        const p = (forWrite && this.isolateWrites) ? undefined : this.parent;
        return p && p.resolve(name);
    }

    /**
     * Creates and gets a new frame child of this frame.
     *
     * @param {boolean} isolateWrites
     *
     * @returns {Kumis.Util.Frame}
     */
    push(isolateWrites) {
        return new __self(this, isolateWrites);
    }

    /**
     * Pops out the parent frame.
     *
     * @returns {Kumis.Util.Frame}
     */
    pop() {
        return this.parent;
    }
}
