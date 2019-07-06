/**
 * Frames keep track of scoping both at compile-time and run-time so
 * we know how to access variables. Block tags can introduce special
 * variables, for example.
 *
 * @memberOf Kumis.Util
 */
class Frame {
    __construct(parent, isolateWrites) {
        this.variables = {};
        this.parent = parent;
        this.topLevel = false;
        // If this is true, writes (set) should never propagate upwards past
        // This frame to its parent (though reads may).
        this.isolateWrites = isolateWrites;
    }

    set(name, val, resolveUp) {
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

    get(name) {
        const val = this.variables[name];
        if (val !== undefined) {
            return val;
        }
        return null;
    }

    lookup(name) {
        const p = this.parent;
        const val = this.variables[name];
        if (val !== undefined) {
            return val;
        }
        return p && p.lookup(name);
    }

    resolve(name, forWrite) {
        const p = (forWrite && this.isolateWrites) ? undefined : this.parent;
        const val = this.variables[name];
        if (val !== undefined) {
            return this;
        }

        return p && p.resolve(name);
    }

    push(isolateWrites) {
        return new __self(this, isolateWrites);
    }

    pop() {
        return this.parent;
    }
}

module.exports = Frame;
