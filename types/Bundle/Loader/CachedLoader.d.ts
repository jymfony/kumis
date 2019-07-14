declare namespace Kumis.Bundle.Loader {
    import CacheItemPoolInterface = Jymfony.Component.Cache.CacheItemPoolInterface;
    import LoaderInterface = Kumis.Loader.LoaderInterface;
    import Source = Kumis.Loader.Source;

    export class CachedLoader extends implementationOf(LoaderInterface) {
        private _cachedTemplates: () => (null | Record<string, string>) | Record<string, string>;
        private _cache: null | CacheItemPoolInterface;

        /**
         * Constructor.
         */
        __construct(cachedTemplates: string | Record<string, string>, cache?: CacheItemPoolInterface): void;
        constructor(cachedTemplates: string | Record<string, string>, cache?: CacheItemPoolInterface);

        /**
         * @inheritDoc
         */
        invalidateCache(): void;

        public readonly cachedTemplates: Record<string, string>;

        /**
         * @inheritDoc
         */
        resolve(name: string): Promise<string | null>;

        /**
         * @inheritDoc
         */
        getSource(name: string): Promise<Source>;
    }
}
