declare namespace Kumis.Loader {
    import CacheItemPoolInterface = Jymfony.Component.Cache.CacheItemPoolInterface;

    export class FilesystemLoader extends implementationOf(LoaderInterface) {
        private _pathsToNames: Record<string, string>;
        private _cache: CacheItemPoolInterface<Source>;
        private _searchPaths: string[];

        /**
         * Constructor.
         */
        __construct(searchPaths: string, cache?: CacheItemPoolInterface<Source>): void;
        __construct(searchPaths: string, cache?: CacheItemPoolInterface<Source>): void;

        /**
         * @inheritDoc
         */
        invalidateCache(): void;

        /**
         * @inheritDoc
         */
        getSource(name: string): Promise<Source>;
    }
}
