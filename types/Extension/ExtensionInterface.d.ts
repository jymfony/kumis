declare namespace Kumis.Extension {
    /**
     * Represents an extension.
     */
    export class ExtensionInterface {
        public static readonly definition: Newable<ExtensionInterface>;

        /**
         * Returns global variables and functions.
         */
        public readonly globals: Record<string, any>;

        /**
         * Returns an object containing filters functions.
         */
        public readonly filters: Record<string, (val: any, ...args: any[]) => string>;

        /**
         * Returns an object containing tests functions.
         */
        public readonly tests: Record<string, (...args: any[]) => boolean>;

        /**
         * Returns an array of tags.
         */
        public readonly tags: TagInterface[];

        /**
         * Gets the extension name.
         */
        public readonly name: string;
    }
}
