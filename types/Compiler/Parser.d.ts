declare namespace Kumis.Compiler {
    import ExtensionInterface = Kumis.Extension.ExtensionInterface;
    import TemplateError = Kumis.Exception.TemplateError;
    import Node = Kumis.Node;

    export interface ParserOptions {
        /**
         * Whether to strip left spaces in blocks.
         */
        lstripBlocks?: boolean;

        /**
         * Whether to trim blocks while parsing.
         */
        trimBlocks?: boolean;

        /**
         * Custom delimiters.
         */
        tags?: {
            blockStart?: string;
            blockEnd?: string;
            variableStart?: string;
            variableEnd?: string;
            commentStart?: string;
            commentEnd?: string;
        };
    }

    export class Parser {
        private _tokens: Tokenizer;
        private _peeked: Token;
        private _breakOnBlocks: null|string[];
        private _dropLeadingWhitespace: boolean;
        private _extensions: ExtensionInterface[];

        /**
         * Constructor.
         */
        __construct(tokens: Tokenizer): void;
        constructor(tokens: Tokenizer);

        nextToken(withWhitespace: boolean): Token;
        peekToken(): Token;
        pushToken(tok: Token);

        error(msg: string, lineno?: number, colno?: number): TemplateError;
        fail(msg: string, lineno?: number, colno?: number): never;

        skip(type: string): boolean;
        expect(type: string): Token;

        skipValue(type: string, val: any): boolean;
        skipSymbol(val: any): boolean;

        advanceAfterBlockEnd(name: any): Token;
        advanceAfterVariableEnd(): void;

        parseFor(): Node.For;
        parseMacro(): Node.Macro;
        parseCall(): Node.Output;

        parseWithContext(): null|boolean;
        parseImport(): Node.Import;
        parseFrom(): Node.FromImport;

        parseBlock(): Node.Block;
        parseExtends(): Node.Extends;
        parseInclude(): Node.Include;
        parseIf(): Node.If;

        parseSet(): Node.Set;

        parseSwitch(): Node.Switch;
        parseStatement(): Node.Node;
        parseRaw(tagName): Node.Output;
        parsePostfix(node): Node.Node;
        parseExpression(): Node.Node;

        parseInlineIf(): Node.Node;
        parseOr(): Node.Node;
        parseAnd(): Node.Node;
        parseNot(): Node.Node;
        parseIn(): Node.Node;
        parseIs(): Node.Node;
        parseCompare(): Node.Node;

        // Finds the '~' for string concatenation
        parseConcat(): Node.Node;
        parseAdd(): Node.Node;
        parseSub(): Node.Node;
        parseMul(): Node.Mul;
        parseDiv(): Node.Div;
        parseFloorDiv(): Node.FloorDiv;
        parseMod(): Node.Mod;
        parsePow(): Node.Pow;

        parseUnary(noFilters: boolean): Node.Node;
        parsePrimary(noPostfix: boolean): Node.Node;
        parseFilterName(): Node.SymbolNode;

        parseFilterArgs(node: Node.FunCall): Node[];
        parseFilter(node: Node.Node): Node.Node;
        parseFilterStatement(): Node.Output;
        parseAggregate(): null|Node.NodeList;

        parseSignature(tolerant: boolean, noParens: boolean): null|Node.NodeList;
        parseUntilBlocks(...blockNames: string[]): Node.NodeList;
        parseNodes(): Node.Node[];
        parse(): Node.NodeList;
        parseAsRoot(): Node.Root;

        static parse(src: string, extensions: ExtensionInterface[], opts: ParserOptions): Node.Root;
    }
}
