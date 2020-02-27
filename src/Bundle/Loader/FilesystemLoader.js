const BaseLoader = Kumis.Loader.FilesystemLoader;

/**
 * @memberOf Kumis.Bundle.Loader
 */
export default class FilesystemLoader extends BaseLoader {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Kernel.KernelInterface} kernel
     * @param {string[]} searchPaths
     * @param {Jymfony.Component.Cache.CacheItemPoolInterface} [cache]
     */
    __construct(kernel, searchPaths, cache = null) {
        super.__construct(searchPaths, cache);

        /**
         * @type {Jymfony.Component.Kernel.KernelInterface}
         *
         * @private
         */
        this._kernel = kernel;
    }

    /**
     * @inheritDoc
     */
    async resolve(name) {
        if ('@' === name.charAt(0)) {
            try {
                return this._kernel.locateResource(name);
            } catch (e) {
                // Go on..
            }
        }

        return super.resolve(name);
    }
}
