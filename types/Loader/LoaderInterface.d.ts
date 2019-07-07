declare namespace Kumis.Loader {
    import Template = Kumis.Template;

    export interface Source {
        src: string|Template,
        path: string,
    }

    export class LoaderInterface {
        /**
         * Loads a template from the given name and
         * returns the source code.
         */
        getSource(name: string): Promise<Source>;

        /**
         * Invalidates the cache (if present) of this loader.
         */
        invalidateCache(): void;
    }
}
