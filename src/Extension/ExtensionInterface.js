/**
 * Represents an extension.
 *
 * @memberOf Kumis.Extension
 */
class ExtensionInterface {
    /**
     * Returns global variables and functions.
     *
     * @returns {Object.<string, *|Function>}
     */
    get globals() { }

    /**
     * Returns an object containing filters functions.
     *
     * @returns {Object.<string, (function(*, ...*): string)>}
     */
    get filters() { }

    /**
     * Returns an object containing tests functions.
     *
     * @returns {Object.<string, (function(*, ...*): boolean)>}
     */
    get tests() { }

    /**
     * Returns an array of tags.
     *
     * @returns {Kumis.Extension.TagInterface[]}
     */
    get tags() { }

    /**
     * Gets the extension name.
     *
     * @returns {string}
     */
    get name() { }
}

export default getInterface(ExtensionInterface);
