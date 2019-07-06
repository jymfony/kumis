const LoaderInterface = Kumis.Loader.LoaderInterface;
const File = Jymfony.Component.Filesystem.File;
const Filesystem = Jymfony.Component.Filesystem.Filesystem;

const fs = new Filesystem();
const path = require('path');

/**
 * @memberOf Kumis.Loader
 */
class FilesystemLoader extends implementationOf(LoaderInterface) {
    /**
     * Constructor.
     *
     * @param {string[]} searchPaths
     * @param {Jymfony.Component.Cache.CacheItemPoolInterface} [cache]
     */
    __construct(searchPaths, cache = null) {
        this._pathsToNames = {};
        this._cache = cache;

        if (searchPaths) {
            searchPaths = isArray(searchPaths) ? searchPaths : [ searchPaths ];
            // For windows, convert to forward slashes
            this._searchPaths = searchPaths.map(path.normalize);
        } else {
            this._searchPaths = [ '.' ];
        }
    }

    /**
     * @inheritDoc
     */
    invalidateCache() {
        if (! this._cache) {
            return;
        }

        this._cache.clear().catch();
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

        let fullpath = null;
        const paths = this._searchPaths;

        for (let i = 0; i < paths.length; i++) {
            const basePath = path.resolve(paths[i]);
            const p = path.resolve(paths[i], name);

            // Only allow the current directory and anything
            // Underneath it to be searched
            if (0 === p.indexOf(basePath) && await fs.exists(p)) {
                fullpath = p;
                break;
            }
        }

        if (! fullpath) {
            return null;
        }

        this._pathsToNames[fullpath] = name;

        const f = await new File(fullpath).openFile('r');
        const source = {
            src: await f.fread(await f.getSize()),
            path: fullpath,
        };

        f.close().catch();

        if (cacheItem) {
            cacheItem.set(source);
            await this._cache.save(cacheItem);
        }

        return source;
    }
}

module.exports = FilesystemLoader;
