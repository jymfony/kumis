import { normalize, resolve } from 'path';

const LoaderInterface = Kumis.Loader.LoaderInterface;
const File = Jymfony.Component.Filesystem.File;
const Filesystem = Jymfony.Component.Filesystem.Filesystem;
const { exists } = new Filesystem();

/**
 * @memberOf Kumis.Loader
 */
export default class FilesystemLoader extends implementationOf(LoaderInterface) {
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
            this._searchPaths = searchPaths.map(normalize);
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
    async resolve(name) {
        if (undefined !== this._pathsToNames[name]) {
            return this._pathsToNames[name];
        }

        let fullpath = null;
        const paths = this._searchPaths;

        for (let i = 0; i < paths.length; i++) {
            const basePath = resolve(paths[i]);
            const p = resolve(paths[i], name);

            // Only allow the current directory and anything
            // Underneath it to be searched
            if (0 === p.indexOf(basePath) && await exists(p)) {
                fullpath = p;
                break;
            }
        }

        if (! fullpath) {
            return null;
        }

        return this._pathsToNames[name] = fullpath;
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

        const fullpath = await this.resolve(name);
        if (! fullpath) {
            throw new RuntimeException(__jymfony.sprintf('Cannot find template "%s"', name));
        }

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
