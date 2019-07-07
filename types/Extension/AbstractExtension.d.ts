declare namespace Kumis.Extension {
    /**
     * Represents an abstract extension.
     */
    export abstract class AbstractExtension extends implementationOf(ExtensionInterface) {
        /**
         * @inheritDoc
         */
        public readonly globals: Record<string, any>;

        /**
         * @inheritDoc
         */
        public readonly filters: Record<string, (val: any, ...args: any[]) => string>;

        /**
         * @inheritDoc
         */
        public readonly tests: Record<string, (...args: any[]) => boolean>;

        /**
         * @inheritDoc
         */
        public readonly tags: TagInterface[];

        /**
         * @inheritDoc
         */
        public readonly name: string;
    }
}
