/**
 * @memberOf Kumis.Loader
 */
class LoaderInterface {
    /**
     * Loads a template from the given name and
     * returns the source code.
     *
     * @param {string} name
     *
     * @returns {Promise<{src: *, path: string}>}
     */
    async getSource(name) { }

    /**
     * Invalidates the cache (if present) of this loader.
     */
    invalidateCache() { }
}

module.exports = getInterface(LoaderInterface);
