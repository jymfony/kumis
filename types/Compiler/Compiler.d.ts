declare namespace Kumis.Compiler {
    import Node = Kumis.Node;
    import Frame = Kumis.Util.Frame;
    import ExtensionInterface = Kumis.Extension.ExtensionInterface;

    export interface CompilerOptions extends ParserOptions { }

    export class Compiler {
        /**
         * The template name.
         */
        private _templateName: string;

        /**
         * Code buffer.
         */
        private _codebuf: string[];

        /**
         * Last variable id.
         */
        private _lastId: number;

        /**
         * Temporary code buffer.
         */
        private _buffer: string;

        /**
         * Buffers stack.
         */
        private _bufferStack: string[];

        /**
         * In block flag.
         */
        private _inBlock: boolean;

        /**
         * Indentation level.
         */
        private _indent: string;

        /**
         * Whether to throw on undefined variable.
         */
        private _suppressUndefinedError: boolean;

        /**
         * Constructor.
         */
        __construct(templateName: string): void;
        constructor(templateName: string);

        /**
         * Throws an error.
         */
        private _fail(msg: string, lineno: number, colno: number): never;

        /**
         * Adds an indentation level.
         */
        private _addIndent(): void;

        /**
         * Removes an indentation level.
         */
        private _subIndent(): void;

        /**
         * Pushes the buffer and emits an id.
         */
        private _pushBuffer(): string;

        /**
         * Restore a previous pushed stack.
         */
        private _popBuffer(): void;

        /**
         * Emits a code string.
         */
        private _emit(code: string): void;

        /**
         * Emits a string and append a newline.
         */
        private _emitLine(code: string): void;

        /**
         * Emits some code lines.
         */
        private _emitLines(...lines: string[]): void;

        /**
         * Emits a function declaration.
         */
        private _emitFuncBegin(node: Node.Node, name: string): void;

        /**
         * Closes a function.
         */
        private _emitFuncEnd(noReturn: boolean): void;

        /**
         * Generates a temporary variable name.
         */
        private _tmpid(): string;

        /**
         * Recursively compiles all the children.
         */
        private _compileChildren(node: Node.NodeList, frame: Frame): void;

        /**
         * Compiles all the children and wraps then between start and end chars.
         */
        private _compileAggregate(node: Node.NodeList, frame: Frame, startChar?: string | null, endChar?: string | null): void;

        /**
         * Asserts that the node is of one of the given types.
         */
        assertType(node: Node.Node, ...types: Newable<Node.Node>[]): void;

        /**
         * Compiles a CallExtension node.
         */
        compileCallExtension(node: Node.CallExtension, frame: Frame): void;

        /**
         * Compiles a NodeList.
         */
        compileNodeList(node: Node.NodeList, frame: Frame): void;

        /**
         * Compiles a Literal node.
         */
        compileLiteral(node: Node.Literal): void;

        /**
         * Compile SymbolNode.
         */
        compileSymbolNode(node: Node.SymbolNode, frame: Frame): void;

        /**
         * Compiles a Group node.
         */
        compileGroup(node: Node.Group, frame: Frame): void;

        /**
         * Compiles an Array Node
         */
        compileArray(node: Node.Array, frame: Frame): void;

        /**
         * Compiles a dictionary (Dict node).
         */
        compileDict(node: Node.Dict, frame: Frame): void;

        /**
         * Compiles a Pair Node.
         */
        compilePair(node: Node.Pair, frame: Frame): void;

        /**
         * Compiles an inline if (ternary operator).
         */
        compileInlineIf(node: Node.InlineIf, frame: Frame): void;

        /**
         * Compiles an In node.
         */
        compileIn(node: Node.In, frame: Frame): void;

        /**
         * Compile Is (test) node.
         */
        compileIs(node: Node.Is, frame: Frame): void;

        /**
         * Binary operator code emitter.
         */
        private _binOpEmitter(node: Node.BinOp, frame: Frame, str: string): void;

        /**
         * Compiles an Or node.
         */
        compileOr(node: Node.Or, frame: Frame): void;

        /**
         * Compiles an And node.
         */
        compileAnd(node: Node.And, frame: Frame): void;

        /**
         * Compiles an Add node.
         */
        compileAdd(node: Node.Add, frame: Frame): void;

        /**
         * Compiles an Concat node.
         */
        compileConcat(node: Node.Concat, frame: Frame): void;

        /**
         * Compiles a Sub node.
         */
        compileSub(node: Node.Sub, frame: Frame): void;

        /**
         * Compiles a Mul node.
         */
        compileMul(node: Node.Mul, frame: Frame): void;

        /**
         * Compiles a Div node.
         */
        compileDiv(node: Node.Div, frame: Frame): void;

        /**
         * Compiles a Mod node.
         */
        compileMod(node: Node.Mod, frame: Frame): void;

        /**
         * Compiles a Not node.
         */
        compileNot(node: Node.Not, frame: Frame): void;

        /**
         * Compiles a FloorDiv node.
         */
        compileFloorDiv(node: Node.FloorDiv, frame: Frame): void;

        /**
         * Compiles a Pow node.
         */
        compilePow(node: Node.Pow, frame: Frame): void;

        /**
         * Compiles a Neg node.
         */
        compileNeg(node: Node.Neg, frame: Frame): void;

        /**
         * Compiles a Pos node.
         */
        compilePos(node: Node.Pos, frame: Frame): void;

        /**
         * Compiles Compare node.
         */
        compileCompare(node: Node.Compare, frame: Frame): void;

        /**
         * Compiles a LookupVal node.
         */
        compileLookupVal(node: Node.LookupVal, frame: Frame): void;

        /**
         * Gets the node name.
         */
        private _getNodeName(node: Node.Node): string;

        /**
         * Compiles a function call node.
         *
         * Keep track of line/col info at runtime by settings
         * variables within an expression. An expression in javascript
         * like (x, y, z) returns the last value, and x and y can be
         * anything
         */
        compileFunCall(node: Node.FunCall, frame: Frame): void;

        /**
         * Compiles filter function node.
         */
        compileFilter(node: Node.Filter, frame: Frame): void;

        /**
         * Compiles a KeywordArgs node.
         */
        compileKeywordArgs(node: Node.KeywordArgs, frame: Frame): void;

        /**
         * Compiles a Set node.
         */
        compileSet(node: Node.Set, frame: Frame): void;

        /**
         * Compiles a switch node.
         */
        compileSwitch(node: Node.Switch, frame: Frame): void;

        /**
         * Compiles an If node.
         */
        compileIf(node: Node.If, frame: Frame): void;

        /**
         * Emits loop bindings code.
         */
        private _emitLoopBindings(i: string, len: string): void;

        /**
         * Compiles a For cycle.
         */
        compileFor(node: Node.For, frame: Frame): void;

        /**
         * Emits macro code and returns the function name.
         */
        private _compileMacro(node: Node.Macro, frame: Frame): string;

        /**
         * Compiles a macro.
         */
        compileMacro(node: Node.Macro, frame: Frame): void;

        /**
         * Compiles a Caller node into an anonymous macro expression.
         */
        compileCaller(node: Node.Caller, frame: Frame): void;

        /**
         * Emits a getTemplate call.
         */
        private _compileGetTemplate(node: Node.TemplateRef, frame: Frame, eagerCompile: boolean, ignoreMissing: boolean): string;

        /**
         * Compiles an import node (from import tag).
         */
        compileImport(node: Node.Import, frame: Frame): void;

        /**
         * Compiles an import from node (from import tag).
         */
        compileFromImport(node: Node.FromImport, frame: Frame): void;

        /**
         * Compiles a block.
         */
        compileBlock(node: Node.Block): void;

        /**
         * Emits a super() call.
         */
        compileSuper(node: Node.Super, frame: Frame): void;

        /**
         * Emits code for template extension.
         */
        compileExtends(node: Node.Extends, frame: Frame): void;

        /**
         * Emits code for template inclusion.
         */
        compileInclude(node: Node.Include, frame: Frame): void;

        /**
         * Emits template data.
         */
        compileTemplateData(node: Node.TemplateData, frame: Frame): void;

        /**
         * Compiles a capture node.
         */
        compileCapture(node: Node.Capture, frame: Frame): void;

        /**
         * Emits output node.
         */
        compileOutput(node: Node.Output, frame: Frame): void;

        /**
         * Compiles the root node.
         */
        compileRoot(node: Node.Root, frame: Frame): void;

        /**
         * Compile a node.
         */
        compile(node: Node.Node, frame: Frame): void;

        /**
         * Gets the compiled code.
         */
        getCode(): string;

        static compile(src: string, extensions: ExtensionInterface[], name: string, opts?: CompilerOptions): string;
    }
}
