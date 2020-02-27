const AbstractExtension = Kumis.Extension.AbstractExtension;
const DumpTag = Kumis.Bundle.Extension.DumpTag;
const HtmlDumper = Jymfony.Component.VarDumper.Dumper.HtmlDumper;
const SafeString = Kumis.Util.SafeString;

/**
 * @memberOf Kumis.Bundle.Extension
 */
export default class VarDumperExtension extends AbstractExtension {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.VarDumper.Cloner.ClonerInterface} cloner
     * @param {boolean} debug
     */
    __construct(cloner, debug) {
        /**
         * @type {Jymfony.Component.VarDumper.Cloner.ClonerInterface}
         *
         * @private
         */
        this._cloner = cloner || new Jymfony.Component.VarDumper.Cloner.VarCloner();

        /**
         * @type {boolean}
         *
         * @private
         */
        this._debug = debug;

        /**
         * @type {Jymfony.Component.VarDumper.Dumper.DataDumperInterface}
         *
         * @private
         */
        this._dumper = null;
    }

    /**
     * @inheritDoc
     */
    get globals() {
        return {
            dump: this._dump.bind(this),
        }
    }

    /**
     * @inheritDoc
     */
    get tags() {
        return [
            new DumpTag(),
        ];
    }

    /**
     * Dumps variables from dump tag.
     *
     * @param {Kumis.Context} context
     * @param {...*} vars
     *
     * @returns {Kumis.Util.SafeString}
     *
     * @private
     */
    _dumpTag(context, ...vars) {
        return this._dump(...vars);
    }

    /**
     * Dumps variables.
     *
     * @param {...*} vars
     *
     * @returns {Kumis.Util.SafeString}
     *
     * @private
     */
    _dump(...vars) {
        if (! this._debug) {
            return;
        }

        if (null === this._dumper) {
            this._dumper = new HtmlDumper()
        }

        const buffer = new __jymfony.StreamBuffer();
        for (const v of vars) {
            this._dumper.dump(this._cloner.cloneVar(v), buffer);
        }

        return SafeString.markSafe(buffer.buffer.toString());
    }
}
