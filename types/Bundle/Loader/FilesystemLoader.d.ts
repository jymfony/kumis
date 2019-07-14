declare namespace Kumis.Bundle.Loader {
    import BaseLoader = Kumis.Loader.FilesystemLoader;
    import KernelInterface = Jymfony.Component.Kernel.KernelInterface;
    import CacheItemPoolInterface = Jymfony.Component.Cache.CacheItemPoolInterface;

    export class FilesystemLoader extends BaseLoader {
        private _kernel: KernelInterface;

        /**
         * Constructor.
         */
        __construct(kernel: KernelInterface, searchPaths: string[], cache?: CacheItemPoolInterface): void;
        constructor(kernel: KernelInterface, searchPaths: string[], cache?: CacheItemPoolInterface);

        /**
         * @inheritDoc
         */
        resolve(name: string): Promise<string>;
    }
}
