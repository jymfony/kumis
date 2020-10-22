const AbstractExtension = Kumis.Extension.AbstractExtension;

/**
 * @memberOf Kumis.Bundle.Extension
 */
export default class GlobalsExtension extends AbstractExtension {
    /**
     * Constructor.
     *
     * @param {Object.<string, *>} globals
     */
    __construct(globals) {
        this._globals = globals;
    }

    /**
     * @inheritdoc
     */
    get globals() {
        return { ...this._globals };
    }
}
