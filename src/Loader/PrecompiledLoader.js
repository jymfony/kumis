const LoaderInterface = Kumis.Loader.LoaderInterface;

/**
 * @memberOf Kumis.Loader
 */
class PrecompiledLoader extends implementationOf(LoaderInterface) {
    /**
     * Constructor.
     *
     * @param compiledTemplates
     */
    __construct(compiledTemplates) {
        this.precompiled = compiledTemplates || {};
    }

    /**
     * @inheritDoc
     */
    invalidateCache() {
        // Do nothing
    }

    /**
     * @inheritDoc
     */
    async getSource(name) {
        if (! this.precompiled[name]) {
            return null;
        }

        return {
            src: {
                type: 'code',
                obj: this.precompiled[name],
            },
            path: name,
            noCache: false,
        };
    }
}

module.exports = PrecompiledLoader;
