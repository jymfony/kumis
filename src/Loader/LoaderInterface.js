/**
 * @memberOf Kumis.Loader
 */
class LoaderInterface {
    /**
     * Resolves a template name to its full path.
     *
     * @param {string} name
     *
     * @returns {Promise<string>}
     */
    async resolve(name) { }

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

export default getInterface(LoaderInterface);
