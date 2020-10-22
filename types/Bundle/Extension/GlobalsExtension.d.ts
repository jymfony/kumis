declare namespace Kumis.Bundle.Extension {
    import AbstractExtension = Kumis.Extension.AbstractExtension;

    export class GlobalsExtension extends AbstractExtension {
        private _globals: Record<string, any>;

        /**
         * Constructor.
         */
        __construct(globals: Record<string, any>): void;
        constructor(globals: Record<string, any>);

        /**
         * @inheritdoc
         */
        public readonly globals: Record<string, any>;
    }
}
