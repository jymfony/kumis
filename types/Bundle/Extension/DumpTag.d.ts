declare namespace Kumis.Bundle.Extension {
    import Parser = Kumis.Compiler.Parser;
    import ExtensionInterface = Kumis.Extension.ExtensionInterface;
    import TagInterface = Kumis.Extension.TagInterface;
    import Node = Kumis.Node.Node;

    export class DumpTag extends implementationOf(TagInterface) {
        /**
         * @inheritDoc
         */
        public name: string;

        /**
         * @inheritDoc
         */
        parse(parser: Parser, extension: ExtensionInterface): Node;
    }
}
