declare namespace Kumis.Extension {
    /**
     * This includes all the builtin globals, filters and tests.
     */
    export class BuiltinExtension extends AbstractExtension {
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
    }
}
