declare namespace Kumis.Extension {
    import Parser = Kumis.Compiler.Parser;

    /**
     * Represents a tag.
     */
    export class TagInterface {
        public static readonly definition: Newable<TagInterface>;

        /**
         * Parses a tag.
         */
        parse(parser: Parser, extension: ExtensionInterface): Node;

        /**
         * Gets the tag name.
         */
        public readonly name: string;
    }
}
