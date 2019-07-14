const LoaderInterface = Kumis.Loader.LoaderInterface;
const File = Jymfony.Component.Filesystem.File;
const { normalize } = require('path');
const vm = require('vm');

/**
 * @memberOf Kumis.Bundle.Loader
 */
class CachedLoader extends implementationOf(LoaderInterface) {
    /**
     * Constructor.
     *
     * @param {string|Object.<string, string>} cachedTemplates
     * @param {Jymfony.Component.Cache.CacheItemPoolInterface} [cache]
     */
    __construct(cachedTemplates, cache = null) {
        /**
         * @type {Function|Object.<string, string>}
         *
         * @private
         */
        this._cachedTemplates = () => {
            if (isString(cachedTemplates)) {
                try {
                    return require(cachedTemplates);
                } catch (e) {
                    return null;
                }
            }

            return cachedTemplates;
        };

        /**
         * @type {Jymfony.Component.Cache.CacheItemPoolInterface}
         *
         * @private
         */
        this._cache = cache;
    }

    /**
     * @inheritDoc
     */
    invalidateCache() {
        // Do nothing.
    }

    get cachedTemplates() {
        if (isFunction(this._cachedTemplates)) {
            const cached = this._cachedTemplates();

            if (null === cached) {
                return {};
            }

            this._cachedTemplates = cached;
        }

        return this._cachedTemplates;
    }

    /**
     * @inheritDoc
     */
    async resolve(name) {
        const cached = this.cachedTemplates;
        name = normalize(name);

        return cached[name] || null;
    }

    /**
     * @inheritDoc
     */
    async getSource(name) {
        let cacheItem;
        if (this._cache) {
            const cacheKey = name.replace(/[{}()\/\\@:]/g, '_');
            cacheItem = await this._cache.getItem(cacheKey);

            if (cacheItem.isHit) {
                return cacheItem.get();
            }
        }

        const f = await new File(name).openFile('r');
        const source = {
            src: {
                type: 'code',
                obj: vm.runInThisContext('(function () { ' +  await f.fread(await f.getSize()) + ' })')()
            },
            path: name,
        };

        f.close().catch();

        if (cacheItem) {
            cacheItem.set(source);
            await this._cache.save(cacheItem);
        }

        return source;
    }
}

module.exports = CachedLoader;
