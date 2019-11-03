declare namespace Kumis.Bundle.Extension {
    import Context = Kumis.Context;
    import AbstractExtension = Kumis.Extension.AbstractExtension;
    import ClonerInterface = Jymfony.Component.VarDumper.Cloner.ClonerInterface;
    import DataDumperInterface = Jymfony.Component.VarDumper.Dumper.DataDumperInterface;
    import TagInterface = Kumis.Extension.TagInterface;
    import SafeString = Kumis.Util.SafeString;

    export class VarDumperExtension extends AbstractExtension {
        private _cloner: ClonerInterface;
        private _debug: boolean;
        private _dumper: DataDumperInterface;

        /**
         * Constructor.
         */
        __construct(cloner: ClonerInterface, debug: boolean): void;
        constructor(cloner: ClonerInterface, debug: boolean);

        /**
         * @inheritDoc
         */
        public readonly globals: Record<string, any>;

        /**
         * @inheritDoc
         */
        public readonly tags: TagInterface[];

        /**
         * Dumps variables from dump tag.
         */
        private _dumpTag(context: Context, ...vars: any[]): SafeString;

        /**
         * Dumps variables.
         */
        private _dump(...vars: any[]): SafeString;
    }
}
