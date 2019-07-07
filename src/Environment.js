const BuiltinExtension = Kumis.Extension.BuiltinExtension;
const FilesystemLoader = Kumis.Loader.FilesystemLoader;
const Template = Kumis.Template;
const ArrayAdapter = Jymfony.Component.Cache.Adapter.ArrayAdapter;

const path = require('path');

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
class Environment {
    __construct(loaders, { autoescape = true, throwOnUndefined, trimBlocks, lstripBlocks} = {}) {
        this.opts = {
            autoescape: !! autoescape,
            throwOnUndefined: !! throwOnUndefined,
            trimBlocks: !! trimBlocks,
            lstripBlocks: !! lstripBlocks,
        };

        /**
         * @type {Kumis.Loader.LoaderInterface[]}
         */
        this.loaders = loaders || [ new FilesystemLoader('views', new ArrayAdapter()) ];
        this.loaders = isArray(this.loaders) ? this.loaders : [ this.loaders ];

        this.globals = {};
        this.filters = {};
        this.tests = {};
        this.extensions = {};
        this.extensionsList = [];

        this.addExtension(new BuiltinExtension());
    }

    invalidateCache() {
        this.loaders.forEach((loader) => {
            loader.invalidateCache();
        });
    }

    /**
     * Adds an extension.
     *
     * @param {Kumis.Extension.ExtensionInterface} extension
     * @returns {Environment}
     */
    addExtension(extension) {
        this.extensions[extension.name] = extension;
        this.extensionsList.push(extension);
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
        if (!this.filters[name]) {
            throw new Error('filter not found: ' + name);
        }
        return this.filters[name];
    }

    getTest(name) {
        if (!this.tests[name]) {
            throw new Error('test not found: ' + name);
        }
        return this.tests[name];
    }

    resolveTemplate(loader, parentName, filename) {
        if (parentName) {
            return path.resolve(path.dirname(parentName), filename);
        }

        return filename;
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
        } else if ('string' !== typeof name) {
            throw new Error('template names must be a string: ' + name);
        }

        for (const loader of this.loaders) {
            const templName = this.resolveTemplate(loader, parentName, name);
            const info = await loader.getSource(templName);

            if (! info) {
                continue;
            }

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

module.exports = Environment;
