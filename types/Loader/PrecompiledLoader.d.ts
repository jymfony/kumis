declare namespace Kumis.Loader {
    import Template = Kumis.Template;

    export class PrecompiledLoader extends implementationOf(LoaderInterface) {
        private precompiled: Record<string, Template>;

        /**
         * Constructor.
         */
        __construct(compiledTemplates: Record<string, Template>): void;
        constructor(compiledTemplates: Record<string, Template>);

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
