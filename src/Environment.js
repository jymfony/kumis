import { dirname, resolve } from 'path';

const ArrayAdapter = Jymfony.Component.Cache.Adapter.ArrayAdapter;
const BuiltinExtension = Kumis.Extension.BuiltinExtension;
const FilesystemLoader = Kumis.Loader.FilesystemLoader;
const Template = Kumis.Template;

const Storage = function () {};
Storage.prototype = {};

/**
 * A no-op template, for use with {% include ignore missing %}
 */
const noopTmplSrc = {
    type: 'code',
    obj: {
        async root() {
            return '';
        },
    },
};

/**
 * @memberOf Kumis
 */
export default class Environment {
    /**
     * Constructor.
     *
     * @param {Kumis.Loader.LoaderInterface[]} loaders
     * @param {boolean} autoescape
     * @param {boolean} trimBlocks
     * @param {boolean} lstripBlocks
     */
    __construct(loaders, { autoescape = true, trimBlocks, lstripBlocks} = {}) {
        this.opts = {
            autoescape: !! autoescape,
            trimBlocks: !! trimBlocks,
            lstripBlocks: !! lstripBlocks,
        };

        /**
         * @type {Kumis.Loader.LoaderInterface[]}
         */
        this.loaders = loaders || [ new FilesystemLoader(process.cwd() + '/views', new ArrayAdapter()) ];
        this.loaders = isArray(this.loaders) ? this.loaders : [ this.loaders ];

        this.globals = new Storage();
        this.filters = new Storage();
        this.tests = new Storage();
        this.extensions = new Storage();
        this._extensionsList = [];
    }

    /**
     * Creates a configured environment.
     *
     * @param {Kumis.Loader.LoaderInterface} [loader]
     *
     * @returns {Kumis.Environment}
     */
    static create(loader = undefined) {
        const env = new __self(loader, { autoescape: true });
        env.addExtension(new BuiltinExtension());

        return env;
    }

    invalidateCache() {
        this.loaders.forEach((loader) => {
            loader.invalidateCache();
        });
    }

    /**
     * Gets the extension list.
     *
     * @returns {Kumis.Extension.ExtensionInterface[]}
     */
    get extensionsList() {
        return [ ...this._extensionsList ];
    }

    /**
     * Adds an extension.
     *
     * @param {Kumis.Extension.ExtensionInterface} extension
     *
     * @returns {Kumis.Environment}
     */
    addExtension(extension) {
        this.extensions[extension.name] = extension;
        this._extensionsList.push(extension);
        Object.assign(this.globals, extension.globals);
        Object.assign(this.filters, extension.filters);
        Object.assign(this.tests, extension.tests);

        return this;
    }

    getExtension(name) {
        return this.extensions[name];
    }

    hasExtension(name) {
        return !! this.extensions[name];
    }

    getFilter(name) {
        if (! this.filters[name]) {
            throw new Error('filter not found: ' + name);
        }

        return this.filters[name];
    }

    getTest(name) {
        if (! this.tests[name]) {
            throw new Error('test not found: ' + name);
        }

        return this.tests[name];
    }

    /**
     * Resolves a template.
     *
     * @param {Kumis.Loader.LoaderInterface} loader
     * @param {null|string} parentName
     * @param {string} filename
     *
     * @returns {Promise<string>}
     */
    resolveTemplate(loader, parentName, filename) {
        if (parentName) {
            filename = resolve(dirname(parentName), filename);
        }

        return loader.resolve(filename);
    }

    /**
     * Whether a template exists or not.
     *
     * @param {string} name
     *
     * @returns {Promise<boolean>}
     */
    async hasTemplate(name) {
        for (const loader of this.loaders) {
            const templName = await this.resolveTemplate(loader, null, name);
            if (! templName) {
                continue;
            }

            return true;
        }

        return false;
    }

    async getTemplate(name, eagerCompile = false, parentName = null, ignoreMissing = false) {
        if (name && name.raw) {
            // This fixes autoescape for templates referenced in symbols
            name = name.raw;
        }

        if (name instanceof Template) {
            name.env = this;
            if (eagerCompile) {
                name.compile();
            }

            return name;
        } else if (! isString(name)) {
            throw new Error('template names must be a string: ' + name);
        }

        for (const loader of this.loaders) {
            const templName = await this.resolveTemplate(loader, parentName, name);
            if (! templName) {
                continue;
            }

            const info = await loader.getSource(templName);

            return new Template(info.src, this, info.path, eagerCompile);
        }

        if (ignoreMissing) {
            return new Template(noopTmplSrc, this, '', eagerCompile);
        }

        throw new Error('Template not found: ' + name);
    }

    async render(name, ctx = {}) {
        const template = await this.getTemplate(name);

        return await template.render(ctx);
    }

    renderString(src, ctx = {}, opts = {}) {
        const tmpl = new Template(src, this, opts.path);

        return tmpl.render(ctx);
    }
}
