const UndefinedVariableError = Kumis.Exception.UndefinedVariableError;

/**
 * @memberOf Kumis
 */
export default class Context {
    /**
     * Constructor.
     *
     * @param {Object} ctx
     * @param {Object.<string, *>} blocks
     * @param {Kumis.Environment} env
     */
    __construct(ctx, blocks, env) {
        // Has to be tied to an environment so we can tap into its globals.
        this.env = env;

        // Make a duplicate of ctx
        this.ctx = { ...ctx };

        this.blocks = {};
        this.exported = [];

        __jymfony.keys(blocks).forEach(name => {
            this.addBlock(name, blocks[name]);
        });
    }

    lookup(name) {
        const inContext = Object.prototype.hasOwnProperty.call(this.ctx, name);

        // This is one of the most called functions, so optimize for
        // The typical case where the name isn't in the globals
        if (name in this.env.globals && ! inContext) {
            return this.env.globals[name];
        }

        if (! inContext) {
            throw new UndefinedVariableError(name);
        }

        return this.ctx[name];
    }

    setVariable(name, val) {
        this.ctx[name] = val;
    }

    getVariables() {
        return this.ctx;
    }

    addBlock(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);
        return this;
    }

    getBlock(name) {
        if (!this.blocks[name]) {
            throw new Error('unknown block "' + name + '"');
        }

        return this.blocks[name][0];
    }

    async getSuper(env, name, block, frame) {
        const idx = (this.blocks[name] || []).indexOf(block);
        const blk = this.blocks[name][idx + 1];
        const context = this;

        if (-1 === idx || !blk) {
            throw new Error('no super block available for "' + name + '"');
        }

        return blk(env, context, frame);
    }

    addExport(name) {
        this.exported.push(name);
    }

    getExported() {
        const exported = {};
        this.exported.forEach((name) => {
            exported[name] = this.ctx[name];
        });
        return exported;
    }
}
