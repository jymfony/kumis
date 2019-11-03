const TagInterface = Kumis.Extension.TagInterface;
const Node = Kumis.Node;

/**
 * @memberOf Kumis.Bundle.Extension
 */
class DumpTag extends implementationOf(TagInterface) {
    /**
     * @inheritDoc
     */
    parse(parser, extension) {
        const tok = parser.nextToken();
        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        return new Node.CallExtension(extension, '_dumpTag', args, null);
    }

    /**
     * @inheritDoc
     */
    get name() {
        return 'dump';
    }
}

module.exports = DumpTag;
