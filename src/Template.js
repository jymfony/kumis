import { compile } from '@jymfony/compiler';

const Compiler = Kumis.Compiler.Compiler;
const Context = Kumis.Context;
const Frame = Kumis.Util.Frame;
const TemplateError = Kumis.Exception.TemplateError;

/**
 * @memberOf Kumis
 */
export default class Template {
    /**
     * Constructor.
     *
     * @param {string} src
     * @param {Kumis.Environment} env
     * @param {string} path
     * @param {boolean} eagerCompile
     */
    __construct(src, env, path, eagerCompile) {
        /**
         * @type {Kumis.Environment}
         *
         * @private
         */
        this.env = env;

        this.blocks = undefined;
        this.rootRenderFunc = undefined;
        this.compiled = false;

        if (isObjectLiteral(src)) {
            switch (src.type) {
                case 'code':
                    this.tmplProps = src.obj;
                    break;
                case 'string':
                    this.tmplStr = src.obj;
                    break;
                default:
                    throw new Error(`Unexpected template object type ${src.type}; expected 'code', or 'string'`);
            }
        } else if (isString(src)) {
            this.tmplStr = src;
        } else if (isBuffer(src)) {
            this.tmplStr = src.toString('utf-8');
        } else {
            throw new Error('src must be a string or an object describing the source');
        }

        this.path = path;

        if (eagerCompile) {
            try {
                this._compile();
            } catch (err) {
                throw TemplateError.create(this.path, err);
            }
        } else {
            this.compiled = false;
        }
    }

    async render(ctx = {}, parentFrame = null) {
        // Catch compile errors for async rendering
        try {
            this.compile();
        } catch (e) {
            throw TemplateError.create(this.path, e);
        }

        const context = new Context(ctx || {}, this.blocks, this.env);
        const frame = parentFrame ? parentFrame.push(true) : new Frame();
        frame.topLevel = true;

        try {
            return await this.rootRenderFunc(this.env, context, frame);
        } catch (err) {
            throw TemplateError.create(this.path, err);
        }
    }

    async getExported(ctx = {}, parentFrame = null) {
        // Catch compile errors for async rendering
        this.compile();

        const frame = parentFrame ? parentFrame.push() : new Frame();
        frame.topLevel = true;

        // Run the rootRenderFunc to populate the context with exported vars
        const context = new Context(ctx || {}, this.blocks, this.env);
        await this.rootRenderFunc(this.env, context, frame);

        return context.getExported();
    }

    compile() {
        if (! this.compiled) {
            this._compile();
        }
    }

    _compile() {
        let props;

        if (this.tmplProps) {
            props = this.tmplProps;
        } else {
            const source = compile(Compiler.compile(this.tmplStr, this.env.extensionsList, this.path, this.env.opts));

            const func = new Function(source); // eslint-disable-line no-new-func
            props = func();
        }

        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
        this.compiled = true;
    }

    _getBlocks(props) {
        const blocks = {};

        __jymfony.keys(props).forEach((k) => {
            if ('b_' === k.slice(0, 2)) {
                blocks[k.slice(2)] = props[k];
            }
        });

        return blocks;
    }
}
