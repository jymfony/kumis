declare namespace Kumis.Bundle.CacheWarmer {
    import CacheWarmerInterface = Jymfony.Component.Kernel.CacheWarmer.CacheWarmerInterface;
    import KernelInterface = Jymfony.Component.Kernel.KernelInterface;
    import Environment = Kumis.Environment;

    export class TemplatesCacheWarmer extends implementationOf(CacheWarmerInterface) {
        private _kernel: KernelInterface;
        private _environment: Environment;
        private _paths: string[];

        /**
         * Constructor.
         */
        __construct(kernel: KernelInterface, environment: Environment, templatePaths?: string[]): void;
        constructor(kernel: KernelInterface, environment: Environment, templatePaths?: string[]);

        /**
         * @inheritDoc
         */
        warmUp(cacheDir: string): void;

        /**
         * @inheritDoc
         */
        public readonly optional: boolean;
    }
}
