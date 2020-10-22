declare namespace Kumis {
    import CompilerOptions = Kumis.Compiler.CompilerOptions;
    import ExtensionInterface = Kumis.Extension.ExtensionInterface;
    import LoaderInterface = Kumis.Loader.LoaderInterface;

    export interface Options extends CompilerOptions {
        autoescape?: boolean;
    }

    export class Environment {
        public opts: Options;
        private loaders: LoaderInterface[];
        private globals: Record<string, any>;
        private filters: Record<string, (val: any, ...args: any[]) => string>;
        private tests: Record<string, (...args: any[]) => boolean>;
        private extensions: Record<string, ExtensionInterface>;
        private _extensionsList: ExtensionInterface[];

        /**
         * Constructor.
         */
        __construct(loaders: LoaderInterface[], options?: Options): void;
        constructor(loaders: LoaderInterface[], options?: Options);

        /**
         * Creates a configured environment.
         */
        static create(loader?: LoaderInterface): Environment;

        invalidateCache(): void;

        /**
         * Gets the extensions list.
         */
        public extensionsList: ExtensionInterface[];

        /**
         * Adds an extension.
         */
        addExtension(extension: ExtensionInterface): this;
        getExtension(name: string): ExtensionInterface;
        hasExtension(name: string): ExtensionInterface;
        getFilter(name: string): (val: any, ...args: any[]) => string;
        getTest(name: string): (...args: any[]) => boolean;

        /**
         * Resolves a template.
         */
        resolveTemplate(loader: LoaderInterface, parentName: null|string, filename: string): Promise<string>;

        /**
         * Whether a template exists or not.
         */
        hasTemplate(name: string): Promise<boolean>;

        getTemplate(name: string, eagerCompile?: boolean, parentName?: null|string, ignoreMissing?: boolean): Promise<Template>;
        render(name: string, ctx?: any): Promise<string>;
        renderString(src: string, ctx?: any, opts?: any): Promise<string>;
    }
}
