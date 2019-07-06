/**
 * @memberOf Kumis.Extension
 */
class TagInterface {
    /**
     * Parses a tag.
     *
     * @param {Kumis.Compiler.Parser} parser
     * @param {Kumis.Extension.ExtensionInterface} extension
     *
     * @returns {Kumis.Node.Node}
     */
    parse(parser, extension) { }

    /**
     * Gets the tag name.
     *
     * @returns {string}
     */
    get name() { }
}

module.exports = getInterface(TagInterface);
