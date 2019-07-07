const TemplateError = Kumis.Exception.TemplateError;
const Parser = Kumis.Compiler.Parser;
const Node = Kumis.Node;
const Frame = Kumis.Util.Frame;
const transformer = require('./transformer');

// These are all the same for now, but shouldn't be passed straight through
const compareOps = {
    '==': '==',
    '===': '===',
    '!=': '!=',
    '!==': '!==',
    '<': '<',
    '>': '>',
    '<=': '<=',
    '>=': '>=',
};

/**
 * @memberOf Kumis.Compiler
 */
class Compiler {
    /**
     * Constructor.
     *
     * @param {string} templateName
     */
    __construct(templateName) {
        /**
         * The template name.
         *
         * @type {string}
         *
         * @private
         */
        this._templateName = !! templateName ? JSON.stringify(templateName) : 'undefined';

        /**
         * Code buffer.
         *
         * @type {string[]}
         *
         * @private
         */
        this._codebuf = [
            'const Runtime = Kumis.Runtime;\n',
            'const { contextOrFrameLookup, handleError, fromIterator, memberLookup, suppressValue, inOperator } = Runtime;\n',
            'const Frame = Kumis.Util.Frame;\n',
            'const SafeString = Kumis.Util.SafeString;\n',
        ];

        /**
         * Last variable id.
         *
         * @type {number}
         *
         * @private
         */
        this._lastId = 0;

        /**
         * Temporary code buffer.
         *
         * @type {string}
         *
         * @private
         */
        this._buffer = null;

        /**
         * Buffers stack.
         *
         * @type {string[]}
         *
         * @private
         */
        this._bufferStack = [];

        /**
         * In block flag.
         *
         * @type {boolean}
         *
         * @private
         */
        this._inBlock = false;

        /**
         * Whether to suppress the undefined variable error.
         *
         * @type {boolean}
         *
         * @private
         */
        this._suppressUndefinedError = false;

        /**
         * Indentation level.
         *
         * @type {string}
         *
         * @private
         */
        this._indent = '';
    }

    /**
     * Throws an error.
     *
     * @param {string} msg
     * @param {int} lineno
     * @param {int} colno
     *
     * @private
     */
    _fail(msg, lineno, colno) {
        if (lineno !== undefined) {
            lineno += 1;
        }
        if (colno !== undefined) {
            colno += 1;
        }

        throw new TemplateError(msg, lineno, colno);
    }

    /**
     * Adds an indentation level.
     *
     * @private
     */
    _addIndent() {
        this._indent += '    ';
    }

    /**
     * Removes an indentation level.
     *
     * @private
     */
    _subIndent() {
        this._indent = this._indent.substr(0, this._indent.length - 4);
    }

    /**
     * Pushes the buffer and emits an id.
     *
     * @returns {string}
     *
     * @private
     */
    _pushBuffer() {
        const id = this._tmpid();
        this._bufferStack.push(this._buffer);
        this._buffer = id;
        this._emit(`var ${this._buffer} = "";`);

        return id;
    }

    /**
     * Restore a previous pushed stack.
     *
     * @private
     */
    _popBuffer() {
        this._buffer = this._bufferStack.pop();
    }

    /**
     * Emits a code string.
     *
     * @param {string} code
     *
     * @private
     */
    _emit(code) {
        if (0 < this._codebuf.length) {
            const lastLine = this._codebuf[this._codebuf.length - 1];
            const lastChar = lastLine.substr(lastLine.length - 1, 1);

            if ('\n' === lastChar) {
                code = this._indent + code;
            }
        }

        this._codebuf.push(code);
    }

    /**
     * Emits a string and append a newline.
     *
     * @param {string} code
     *
     * @private
     */
    _emitLine(code) {
        this._emit(code + '\n');
    }

    /**
     * Emits some code lines.
     *
     * @param {...string} lines
     *
     * @private
     */
    _emitLines(...lines) {
        lines.forEach(line => this._emitLine(line));
    }

    /**
     * Emits a function declaration.
     *
     * @param {Kumis.Node.Node} node
     * @param {string} name
     *
     * @private
     */
    _emitFuncBegin(node, name) {
        this._buffer = 'output';
        this._emitLine(`async function ${name}(env, context, frame) {`);
        this._addIndent();
        this._emitLines(
            `var lineno = ${node.lineno};`,
            `var colno = ${node.colno};`,
            `var ${this._buffer} = "";`,
            'try {'
        );
        this._addIndent();
    }

    /**
     * Closes a function.
     *
     * @param {boolean} noReturn
     *
     * @private
     */
    _emitFuncEnd(noReturn) {
        if (! noReturn) {
            this._emitLine('return ' + this._buffer + ';');
        }

        this._subIndent();
        this._emitLines(
            '} catch (e) {',
            '    throw handleError(e, lineno, colno);',
            '}'
        );

        this._subIndent();
        this._emitLine('}');
        this._buffer = null;
    }

    /**
     * Generates a temporary variable name.
     *
     * @returns {string}
     *
     * @private
     */
    _tmpid() {
        return 't_' + ++this._lastId;
    }

    /**
     * Recursively compiles all the children.
     *
     * @param {Kumis.Node.NodeList} node
     * @param {Kumis.Util.Frame} frame
     *
     * @private
     */
    _compileChildren(node, frame) {
        node.children.forEach((child) => {
            this.compile(child, frame);
        });
    }

    /**
     * Compiles all the children and wraps then between start and end chars.
     *
     * @param {Kumis.Node.NodeList} node
     * @param {Kumis.Util.Frame} frame
     * @param {string|null} startChar
     * @param {string|null} endChar
     *
     * @private
     */
    _compileAggregate(node, frame, startChar = null, endChar = null) {
        if (startChar) {
            this._emit(startChar);
        }

        node.children.forEach((child, i) => {
            if (0 < i) {
                this._emit(',');
            }

            this.compile(child, frame);
        });

        if (endChar) {
            this._emit(endChar);
        }
    }

    /**
     * Asserts that the node is of one of the given types.
     *
     * @param {Kumis.Node.Node} node
     * @param {Newable<Kumis.Node.Node>} types
     */
    assertType(node, ...types) {
        if (! types.some(t => node instanceof t)) {
            this._fail(__jymfony.sprintf('assertType: invalid type: %s', node.typename), node.lineno, node.colno);
        }
    }

    /**
     * Compiles a CallExtension node.
     *
     * @param {Kumis.Node.CallExtension} node
     * @param {Kumis.Util.Frame} frame
     */
    compileCallExtension(node, frame) {
        const args = node.args;
        const contentArgs = node.contentArgs;
        const autoescape = 'boolean' === typeof node.autoescape ? node.autoescape : true;

        this._emit(`${this._buffer} += suppressValue(`);
        this._emit(`await env.getExtension("${node.extName}")["${node.prop}"](`);
        this._emit('context');

        if (args || contentArgs) {
            this._emit(',');
        }

        if (args) {
            if (! (args instanceof Node.NodeList)) {
                this._fail('compileCallExtension: arguments must be a NodeList, use `parser.parseSignature`', node.lineno, node.colno);
            }

            args.children.forEach((arg, i) => {
                // Tag arguments are passed normally to the call. Note
                // That keyword arguments are turned into a single js
                // Object as the last argument, if they exist.
                this.compile(arg, frame);

                if (i !== args.children.length - 1 || contentArgs.length) {
                    this._emit(',');
                }
            });
        }

        if (contentArgs.length) {
            contentArgs.forEach((arg, i) => {
                if (0 < i) {
                    this._emit(',');
                }

                if (arg) {
                    this._emitLine('async () => {');
                    this._addIndent();
                    const id = this._pushBuffer();

                    this.compile(arg, frame);

                    this._popBuffer();
                    this._emitLine(`return ${id};`);
                    this._subIndent();
                    this._emitLine('}');
                } else {
                    this._emit('null');
                }
            });
        }

        this._emit(')');
        this._emit(`, ${autoescape} && env.opts.autoescape);\n`);
    }

    /**
     * Compiles a NodeList.
     *
     * @param {Kumis.Node.NodeList} node
     * @param {Kumis.Util.Frame} frame
     */
    compileNodeList(node, frame) {
        this._compileChildren(node, frame);
    }

    /**
     * Compiles a Literal node.
     *
     * @param {Kumis.Node.Literal} node
     */
    compileLiteral(node) {
        if (isString(node.value)) {
            const val = __jymfony.strtr(node.value, {
                '\\': '\\\\',
                '"': '\\"',
                '\n': '\\n',
                '\r': '\\r',
                '\t': '\\t',
                '\u2028': '\\u2028',
            });

            this._emit(`"${val}"`);
        } else if (null === node.value) {
            this._emit('null');
        } else {
            this._emit(node.value.toString());
        }
    }

    /**
     * Compile SymbolNode.
     *
     * @param {Kumis.Node.SymbolNode} node
     * @param {Kumis.Util.Frame} frame
     */
    compileSymbolNode(node, frame) {
        const name = node.value;
        const v = frame.lookup(name);

        if (v) {
            this._emit(v);
        } else {
            this._emit(__jymfony.sprintf(
                'await contextOrFrameLookup(context, frame, "%s", %s)',
                name,
                this._suppressUndefinedError ? 'true' : 'false'
            ));
        }
    }

    /**
     * Compiles a Group node.
     *
     * @param {Kumis.Node.Group} node
     * @param {Kumis.Util.Frame} frame
     */
    compileGroup(node, frame) {
        this._compileAggregate(node, frame, '(', ')');
    }

    /**
     * Compiles an Array Node
     *
     * @param {Kumis.Node.Array} node
     * @param {Kumis.Util.Frame} frame
     */
    compileArray(node, frame) {
        this._compileAggregate(node, frame, '[', ']');
    }

    /**
     * Compiles a dictionary (Dict node).
     *
     * @param {Kumis.Node.Dict} node
     * @param {Kumis.Util.Frame} frame
     */
    compileDict(node, frame) {
        this._compileAggregate(node, frame, '{', '}');
    }

    /**
     * Compiles a Pair Node.
     *
     * @param {Kumis.Node.Pair} node
     * @param {Kumis.Util.Frame} frame
     */
    compilePair(node, frame) {
        let key = node.key;
        const val = node.value;

        if (key instanceof Node.SymbolNode) {
            key = new Node.Literal(key.lineno, key.colno, key.value);
        } else if (!(key instanceof Node.Literal && 'string' === typeof key.value)) {
            this._fail('compilePair: Dict keys must be strings or names', key.lineno, key.colno);
        }

        this.compile(key, frame);
        this._emit(': ');
        this.compile(val, frame);
    }

    /**
     * Compiles an inline if (ternary operator).
     *
     * @param {Kumis.Node.InlineIf} node
     * @param {Kumis.Util.Frame} frame
     */
    compileInlineIf(node, frame) {
        this._emit('(');
        this.compile(node.cond, frame);
        this._emit('?');
        this.compile(node.body, frame);
        this._emit(':');
        if (null !== node.else_) {
            this.compile(node.else_, frame);
        } else {
            this._emit('""');
        }
        this._emit(')');
    }

    /**
     * Compiles an In node.
     *
     * @param {Kumis.Node.In} node
     * @param {Kumis.Util.Frame} frame
     */
    compileIn(node, frame) {
        this._emit('inOperator(');
        this.compile(node.left, frame);
        this._emit(',');
        this.compile(node.right, frame);
        this._emit(')');
    }

    /**
     * Compile Is (test) node.
     *
     * @param {Kumis.Node.Is} node
     * @param {Kumis.Util.Frame} frame
     */
    compileIs(node, frame) {
        // First, we need to try to get the name of the test function, if it's a
        // Callable (i.e., has args) and not a symbol.
        // Otherwise go with the symbol value
        const right = node.right.name ? node.right.name.value : node.right.value;

        let oldSuppress = this._suppressUndefinedError;
        if ('defined' === right || 'undefined' === right) {
            this._suppressUndefinedError = true;
        }

        this._emit('await env.getTest("' + right + '").call(context, ');
        this.compile(node.left, frame);
        // Compile the arguments for the callable if they exist
        if (node.right.args) {
            this._emit(',');
            this.compile(node.right.args, frame);
        }
        this._emit(') === true');

        if ('defined' === right || 'undefined' === right) {
            this._suppressUndefinedError = oldSuppress;
        }
    }

    /**
     * Binary operator code emitter.
     *
     * @param {Kumis.Node.BinOp} node
     * @param {Kumis.Util.Frame} frame
     * @param {string} str
     *
     * @private
     */
    _binOpEmitter(node, frame, str) {
        this.compile(node.left, frame);
        this._emit(str);
        this.compile(node.right, frame);
    }

    /**
     * Compiles an Or node.
     *
     * @param {Kumis.Node.Or} node
     * @param {Kumis.Util.Frame} frame
     */
    compileOr(node, frame) {
        this._binOpEmitter(node, frame, ' || ');
    }

    /**
     * Compiles an And node.
     *
     * @param {Kumis.Node.And} node
     * @param {Kumis.Util.Frame} frame
     */
    compileAnd(node, frame) {
        this._binOpEmitter(node, frame, ' && ');
    }

    /**
     * Compiles an Add node.
     *
     * @param {Kumis.Node.Add} node
     * @param {Kumis.Util.Frame} frame
     */
    compileAdd(node, frame) {
        return this._binOpEmitter(node, frame, ' + ');
    }

    /**
     * Compiles an Concat node.
     *
     * @param {Kumis.Node.Concat} node
     * @param {Kumis.Util.Frame} frame
     */
    compileConcat(node, frame) {
        // Ensure concatenation instead of addition by adding empty string in between
        return this._binOpEmitter(node, frame, ' + \'\' + ');
    }

    /**
     * Compiles a Sub node.
     *
     * @param {Kumis.Node.Sub} node
     * @param {Kumis.Util.Frame} frame
     */
    compileSub(node, frame) {
        return this._binOpEmitter(node, frame, ' - ');
    }

    /**
     * Compiles a Mul node.
     *
     * @param {Kumis.Node.Mul} node
     * @param {Kumis.Util.Frame} frame
     */
    compileMul(node, frame) {
        return this._binOpEmitter(node, frame, ' * ');
    }

    /**
     * Compiles a Div node.
     *
     * @param {Kumis.Node.Div} node
     * @param {Kumis.Util.Frame} frame
     */
    compileDiv(node, frame) {
        return this._binOpEmitter(node, frame, ' / ');
    }

    /**
     * Compiles a Mod node.
     *
     * @param {Kumis.Node.Mod} node
     * @param {Kumis.Util.Frame} frame
     */
    compileMod(node, frame) {
        return this._binOpEmitter(node, frame, ' % ');
    }

    /**
     * Compiles a Not node.
     *
     * @param {Kumis.Node.Not} node
     * @param {Kumis.Util.Frame} frame
     */
    compileNot(node, frame) {
        this._emit('!');
        this.compile(node.target, frame);
    }

    /**
     * Compiles a FloorDiv node.
     *
     * @param {Kumis.Node.FloorDiv} node
     * @param {Kumis.Util.Frame} frame
     */
    compileFloorDiv(node, frame) {
        this._emit('Math.floor(');
        this.compile(node.left, frame);
        this._emit(' / ');
        this.compile(node.right, frame);
        this._emit(')');
    }

    /**
     * Compiles a Pow node.
     *
     * @param {Kumis.Node.Pow} node
     * @param {Kumis.Util.Frame} frame
     */
    compilePow(node, frame) {
        this._emit('Math.pow(');
        this.compile(node.left, frame);
        this._emit(', ');
        this.compile(node.right, frame);
        this._emit(')');
    }

    /**
     * Compiles a Neg node.
     *
     * @param {Kumis.Node.Neg} node
     * @param {Kumis.Util.Frame} frame
     */
    compileNeg(node, frame) {
        this._emit('-');
        this.compile(node.target, frame);
    }

    /**
     * Compiles a Pos node.
     *
     * @param {Kumis.Node.Pos} node
     * @param {Kumis.Util.Frame} frame
     */
    compilePos(node, frame) {
        this._emit('+');
        this.compile(node.target, frame);
    }

    /**
     * Compiles Compare node.
     *
     * @param {Kumis.Node.Compare} node
     * @param {Kumis.Util.Frame} frame
     */
    compileCompare(node, frame) {
        this.compile(node.expr, frame);

        node.ops.forEach((op) => {
            this._emit(` ${compareOps[op.type]} `);
            this.compile(op.expr, frame);
        });
    }

    /**
     * Compiles a LookupVal node.
     *
     * @param {Kumis.Node.LookupVal} node
     * @param {Kumis.Util.Frame} frame
     */
    compileLookupVal(node, frame) {
        this._emit('await memberLookup((');
        this.compile(node.target, frame);
        this._emit('),');
        this.compile(node.val, frame);
        this._emit(')');
    }

    /**
     * Gets the node name.
     *
     * @param {Kumis.Node.Node} node
     *
     * @returns {string}
     *
     * @private
     */
    _getNodeName(node) {
        switch (true) {
            case node instanceof Node.SymbolNode:
                return node.value;
            case node instanceof Node.FunCall:
                return 'the return value of (' + this._getNodeName(node.name) + ')';
            case node instanceof Node.LookupVal:
                return this._getNodeName(node.target) + '["' + this._getNodeName(node.val) + '"]';
            case node instanceof Node.Literal:
                return node.value.toString();
            default:
                return '--expression--';
        }
    }

    /**
     * Compiles a function call node.
     *
     * Keep track of line/col info at runtime by settings
     * variables within an expression. An expression in javascript
     * like (x, y, z) returns the last value, and x and y can be
     * anything
     *
     * @param {Kumis.Node.FunCall} node
     * @param {Kumis.Util.Frame} frame
     */
    compileFunCall(node, frame) {
        this._emit('(lineno = ' + node.lineno + ', colno = ' + node.colno + ', ');
        this._emit('await Runtime.callWrap(');

        // Compile it as normal.
        this.compile(node.name, frame);

        // Output the name of what we're calling so we can get friendly errors
        // If the lookup fails.
        this._emit(', "' + this._getNodeName(node.name).replace(/"/g, '\\"') + '", context, ');
        this._compileAggregate(node.args, frame, '[', '])');
        this._emit(')');
    }

    /**
     * Compiles filter function node.
     *
     * @param {Kumis.Node.Filter} node
     * @param {Kumis.Util.Frame} frame
     */
    compileFilter(node, frame) {
        const name = node.name;
        this.assertType(name, Node.SymbolNode);

        let oldSuppress = this._suppressUndefinedError;
        if ('default' === name.value) {
            this._suppressUndefinedError = true;
        }

        this._emit('await env.getFilter("' + name.value + '").call(context, ');
        this._compileAggregate(node.args, frame);
        this._emit(')');

        if ('default' === name.value) {
            this._suppressUndefinedError = oldSuppress;
        }
    }

    /**
     * Compiles a KeywordArgs node.
     *
     * @param {Kumis.Node.KeywordArgs} node
     * @param {Kumis.Util.Frame} frame
     */
    compileKeywordArgs(node, frame) {
        this._emit('Runtime.makeKeywordArgs(');
        this.compileDict(node, frame);
        this._emit(')');
    }

    /**
     * Compiles a Set node.
     *
     * @param {Kumis.Node.Set} node
     * @param {Kumis.Util.Frame} frame
     */
    compileSet(node, frame) {
        const ids = [];

        // Lookup the variable names for each identifier and create
        // New ones if necessary
        node.targets.forEach((target) => {
            const name = target.value;
            let id = frame.lookup(name);

            if (null === id || id === undefined) {
                id = this._tmpid();

                // Note: This relies on js allowing scope across
                // Blocks, in case this is created inside an `if`
                this._emitLine('var ' + id + ';');
            }

            ids.push(id);
        });

        if (node.value) {
            this._emit(ids.join(' = ') + ' = ');
            this.compile(node.value, frame);
            this._emitLine(';');
        } else {
            this._emit(ids.join(' = ') + ' = ');
            this.compile(node.body, frame);
            this._emitLine(';');
        }

        node.targets.forEach((target, i) => {
            const id = ids[i];
            const name = target.value;

            // We are running this for every var, but it's very
            // Uncommon to assign to multiple vars anyway
            this._emitLine(`frame.set("${name}", ${id}, true);`);

            this._emitLine('if(frame.topLevel) {');
            this._emitLine(`    context.setVariable("${name}", ${id});`);
            this._emitLine('}');

            if ('_' !== name.charAt(0)) {
                this._emitLine('if(frame.topLevel) {');
                this._emitLine(`    context.addExport("${name}", ${id});`);
                this._emitLine('}');
            }
        });
    }

    /**
     * Compiles a switch node.
     *
     * @param {Kumis.Node.Switch} node
     * @param {Kumis.Util.Frame} frame
     */
    compileSwitch(node, frame) {
        this._emit('switch (');
        this.compile(node.expr, frame);
        this._emitLine(') {');
        this._addIndent();

        node.cases.forEach(c => {
            this._emit('case ');
            this.compile(c.cond, frame);
            this._emitLine(': ');

            this._addIndent();
            this.compile(c.body, frame);
            // Preserve fall-throughs
            if (c.body.children.length) {
                this._emitLine('break;');
            }
            this._subIndent();
        });

        if (node.default) {
            this._emit('default:');
            this._addIndent();
            this.compile(node.default, frame);
            this._subIndent();
        }

        this._subIndent();
        this._emit('}');
    }

    /**
     * Compiles an If node.
     *
     * @param {Kumis.Node.If} node
     * @param {Kumis.Util.Frame} frame
     */
    compileIf(node, frame) {
        this._emit('if(');
        this.compile(node.cond, frame);
        this._emitLine(') {');
        this._addIndent();
        this.compile(node.body, frame);

        if (node.else_) {
            this._subIndent();
            this._emitLine('}\nelse {');
            this._addIndent();
            this.compile(node.else_, frame);
        }

        this._subIndent();
        this._emitLine('}');
    }

    /**
     * Emits loop bindings code.
     *
     * @param {string} i
     * @param {string} len
     *
     * @private
     */
    _emitLoopBindings(i, len) {
        const bindings = [
            {name: 'index', val: `${i} + 1`},
            {name: 'index0', val: i},
            {name: 'revindex', val: `${len} - ${i}`},
            {name: 'revindex0', val: `${len} - ${i} - 1`},
            {name: 'first', val: `${i} === 0`},
            {name: 'last', val: `${i} === ${len} - 1`},
            {name: 'length', val: len},
        ];

        bindings.forEach((b) => {
            this._emitLine(`frame.set("loop.${b.name}", ${b.val});`);
        });
    }

    /**
     * Compiles a For cycle.
     *
     * @param {Kumis.Node.For} node
     * @param {Kumis.Util.Frame} frame
     */
    compileFor(node, frame) {
        const i = this._tmpid();
        const len = this._tmpid();
        const arr = this._tmpid();
        frame = frame.push();

        this._emitLine('frame = frame.push();');

        this._emit(`var ${arr} = `);
        this.compile(node.arr, frame);
        this._emitLine(';');

        this._emit(`if(${arr}) {`);
        this._addIndent();
        this._emitLine(arr + ' = fromIterator(' + arr + ');');

        // If multiple names are passed, we need to bind them appropriately
        if (node.name instanceof Node.Array) {
            this._emitLine(`var ${i};`);

            // The object could be an array or object. Note that the
            // Body of the loop is duplicated for each condition, but
            // We are optimizing for speed over size.
            this._emitLine(`if(isArray(${arr})) {`);
            this._addIndent();
            this._emitLine(`var ${len} = ${arr}.length;`);
            this._emitLine(`for(${i}=0; ${i} < ${arr}.length; ${i}++) {`);
            this._addIndent();

            // Bind each declared var
            node.name.children.forEach((child, u) => {
                const tid = this._tmpid();
                this._emitLine(`var ${tid} = await ${arr}[${i}][${u}];`);
                this._emitLine(`frame.set("${child.value}", ${tid});`);
                frame.set(child.value, tid);
            });

            this._emitLoopBindings(i, len);
            this.compile(node.body, frame);

            this._subIndent();
            this._emitLine('}');

            this._subIndent();
            this._emitLine('} else {');
            this._addIndent();

            // Iterate over the key/values of an object
            const [ key, val ] = node.name.children;
            const k = this._tmpid();
            const v = this._tmpid();
            frame.set(key.value, k);
            frame.set(val.value, v);

            this._emitLine(`${i} = -1;`);
            this._emitLine(`var ${len} = __jymfony.keys(${arr}).length;`);
            this._emitLine(`for(var ${k} in ${arr}) {`);
            this._addIndent();
            this._emitLine(`${i}++;`);
            this._emitLine(`var ${v} = await ${arr}[${k}];`);
            this._emitLine(`frame.set("${key.value}", ${k});`);
            this._emitLine(`frame.set("${val.value}", ${v});`);

            this._emitLoopBindings(i, len);
            this.compile(node.body, frame);
            this._subIndent();
            this._emitLine('}');

            this._subIndent();
            this._emitLine('}');
        } else {
            // Generate a typical array iteration
            const v = this._tmpid();
            frame.set(node.name.value, v);

            this._emitLine(`var ${len} = ${arr}.length;`);
            this._emitLine(`for(var ${i}=0; ${i} < ${arr}.length; ${i}++) {`);
            this._addIndent();
            this._emitLine(`var ${v} = await ${arr}[${i}];`);
            this._emitLine(`frame.set("${node.name.value}", ${v});`);

            this._emitLoopBindings(i, len);
            this.compile(node.body, frame);
            this._subIndent();
            this._emitLine('}');
        }

        this._emitLine('}');
        if (node.else_) {
            this._emitLine('if (!' + len + ') {');
            this._addIndent();
            this.compile(node.else_, frame);
            this._subIndent();
            this._emitLine('}');
        }

        this._emitLine('frame = frame.pop();');
    }

    /**
     * Emits macro code and returns the function name.
     *
     * @param {Kumis.Node.Macro} node
     * @param {Kumis.Util.Frame} frame
     *
     * @returns {string}
     *
     * @private
     */
    _compileMacro(node, frame) {
        const args = [];
        let kwargs = null;
        const funcId = 'macro_' + this._tmpid();
        const keepFrame = (frame !== undefined);

        // Type check the definition of the args
        node.args.children.forEach((arg, i) => {
            if (i === node.args.children.length - 1 && arg instanceof Node.Dict) {
                kwargs = arg;
            } else {
                this.assertType(arg, Node.SymbolNode);
                args.push(arg);
            }
        });

        const realNames = [ ...args.map(n => `l_${n.value}`), 'kwargs' ];

        // Quoted argument names
        const argNames = args.map(n => `"${n.value}"`);
        const kwargNames = ((kwargs && kwargs.children) || []).map(n => `"${n.key.value}"`);

        // We pass a function to makeMacro which destructures the
        // Arguments so support setting positional args with keywords
        // Args and passing keyword args as positional args
        // (essentially default values).
        let currFrame;
        if (keepFrame) {
            currFrame = frame.push(true);
        } else {
            currFrame = new Frame();
        }

        this._emitLines(
            `var ${funcId} = Runtime.makeMacro(`,
            `[${argNames.join(', ')}], `,
            `[${kwargNames.join(', ')}], `,
            `async (${realNames.join(', ')}) => {`
        );

        this._addIndent();
        this._emitLines(
            'var callerFrame = frame;',
            'frame = ' + ((keepFrame) ? 'frame.push(true);' : 'new Frame();'),
            'kwargs = kwargs || {};',
            'if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {',
            '    frame.set("caller", kwargs.caller);',
            '}'
        );

        // Expose the arguments to the template. Don't need to use
        // Random names because the function
        // Will create a new run-time scope for us
        args.forEach(arg => {
            this._emitLine(`frame.set("${arg.value}", l_${arg.value});`);
            currFrame.set(arg.value, `l_${arg.value}`);
        });

        // Expose the keyword arguments
        if (kwargs) {
            kwargs.children.forEach((pair) => {
                const name = pair.key.value;
                this._emit(`frame.set("${name}", `);
                this._emit(`Object.prototype.hasOwnProperty.call(kwargs, "${name}")`);
                this._emit(` ? kwargs["${name}"] : `);
                this.compile(pair.value, currFrame);
                this._emit(');');
            });
        }

        const bufferId = this._pushBuffer();

        this.compile(node.body, currFrame);
        this._emitLine('frame = ' + ((keepFrame) ? 'frame.pop();' : 'callerFrame;'));
        this._emitLine(`return new SafeString(${bufferId});`);
        this._subIndent();
        this._emitLine('});');
        this._popBuffer();

        return funcId;
    }

    /**
     * Compiles a macro.
     *
     * @param {Kumis.Node.Macro} node
     * @param {Kumis.Util.Frame} frame
     */
    compileMacro(node, frame) {
        const funcId = this._compileMacro(node, undefined);

        // Expose the macro to the templates
        const name = node.name.value;
        frame.set(name, funcId);

        if (frame.parent) {
            this._emitLine(`frame.set("${name}", ${funcId});`);
        } else {
            if ('_' !== node.name.value.charAt(0)) {
                this._emitLine(`context.addExport("${name}");`);
            }

            this._emitLine(`context.setVariable("${name}", ${funcId});`);
        }
    }

    /**
     * Compiles a Caller node into an anonymous macro expression.
     *
     * @param {Kumis.Node.Caller} node
     * @param {Kumis.Util.Frame} frame
     */
    compileCaller(node, frame) {
        // Basically an anonymous "macro expression"
        this._emitLine('(() => {');
        this._addIndent();
        const funcId = this._compileMacro(node, frame);
        this._emitLine(`return ${funcId};`);
        this._subIndent();
        this._emitLine('})()');
    }

    /**
     * Emits a getTemplate call.
     *
     * @param {Kumis.Node.TemplateRef} node
     * @param {Kumis.Util.Frame} frame
     * @param {boolean} eagerCompile
     * @param {boolean} ignoreMissing
     *
     * @returns {string}
     *
     * @private
     */
    _compileGetTemplate(node, frame, eagerCompile, ignoreMissing) {
        const parentTemplateId = this._tmpid();
        const parentName = this._templateName;

        const eagerCompileArg = (eagerCompile) ? 'true' : 'false';
        const ignoreMissingArg = (ignoreMissing) ? 'true' : 'false';
        this._emit(`var ${parentTemplateId} = await env.getTemplate(`);
        this.compile(node.template, frame);
        this._emitLine(`, ${eagerCompileArg}, ${parentName}, ${ignoreMissingArg});`);

        return parentTemplateId;
    }

    /**
     * Compiles an import node (from import tag).
     *
     * @param {Kumis.Node.Import} node
     * @param {Kumis.Util.Frame} frame
     */
    compileImport(node, frame) {
        const target = node.target.value;
        const id = this._compileGetTemplate(node, frame, false, false);

        this._emitLine(id + ' = await ' + id + '.getExported(' +
            (node.withContext ? 'context.getVariables(), frame' : '') + ');');
        frame.set(target, id);

        if (frame.parent) {
            this._emitLine(`frame.set("${target}", ${id});`);
        } else {
            this._emitLine(`context.setVariable("${target}", ${id});`);
        }
    }

    /**
     * Compiles an import from node (from import tag).
     *
     * @param {Kumis.Node.FromImport} node
     * @param {Kumis.Util.Frame} frame
     */
    compileFromImport(node, frame) {
        const importedId = this._compileGetTemplate(node, frame, false, false);
        this._emitLine(importedId + ' = await ' + importedId + '.getExported(' +
              (node.withContext ? 'context.getVariables(), frame' : '') + ');');

        node.names.children.forEach((nameNode) => {
            let name;
            let alias;
            const id = this._tmpid();

            if (nameNode instanceof Node.Pair) {
                name = nameNode.key.value;
                alias = nameNode.value.value;
            } else {
                name = nameNode.value;
                alias = name;
            }

            this._emitLine(`if(Object.prototype.hasOwnProperty.call(${importedId}, "${name}")) {`);
            this._emitLine(`    var ${id} = ${importedId}.${name};`);
            this._emitLine('} else {');
            this._emitLine(`    throw new Error("cannot import '${name}'");`);
            this._emitLine('}');

            frame.set(alias, id);

            if (frame.parent) {
                this._emitLine(`frame.set("${alias}", ${id});`);
            } else {
                this._emitLine(`context.setVariable("${alias}", ${id});`);
            }
        });
    }

    /**
     * Compiles a block.
     *
     * @param {Kumis.Node.Block} node
     */
    compileBlock(node) {
        this._emit(`${this._buffer} += await `);

        /*
         * If we are executing outside a block (creating a top-level
         * block), we really don't want to execute its code because it
         * will execute twice: once when the child template runs and
         * again when the parent template runs. Note that blocks
         * within blocks will *always* execute immediately *and*
         * wherever else they are invoked (like used in a parent
         * template). This may have behavioral differences from jinja
         * because blocks can have side effects, but it seems like a
         * waste of performance to always execute huge top-level
         * blocks twice
         */

        if (!this._inBlock) {
            this._emit('(parentTemplate ? () => \'\' : ');
        }

        this._emit(`context.getBlock("${node.name.value}")`);

        if (!this._inBlock) {
            this._emit(')');
        }

        this._emitLine('(env, context, frame);');
    }

    /**
     * Emits a super() call.
     *
     * @param {Kumis.Node.Super} node
     * @param {Kumis.Util.Frame} frame
     */
    compileSuper(node, frame) {
        const name = node.blockName.value;
        const id = node.symbol.value;

        this._emitLine(`${id} = await context.getSuper(env, "${name}", b_${name}, frame);`);
        this._emitLine(`${id} = SafeString.markSafe(${id});`);
        frame.set(id, id);
    }

    /**
     * Emits code for template extension.
     *
     * @param {Kumis.Node.Extends} node
     * @param {Kumis.Util.Frame} frame
     */
    compileExtends(node, frame) {
        const k = this._tmpid();
        const parentTemplateId = this._compileGetTemplate(node, frame, true, false);

        /*
         * Extends is a dynamic tag and can occur within a block like
         * `if`, so if this happens we need to capture the parent
         * template in the top-level scope
         */
        this._emitLine(`parentTemplate = ${parentTemplateId}`);

        this._emitLine(`for(var ${k} in parentTemplate.blocks) {`);
        this._emitLine(`    context.addBlock(${k}, parentTemplate.blocks[${k}]);`);
        this._emitLine('}');
    }

    /**
     * Emits code for template inclusion.
     *
     * @param {Kumis.Node.Include} node
     * @param {Kumis.Util.Frame} frame
     */
    compileInclude(node, frame) {
        const id = this._compileGetTemplate(node, frame, false, node.ignoreMissing);

        this._emitLine(`${this._buffer} += await ${id}.render(context.getVariables(), frame)`);
    }

    /**
     * Emits template data.
     *
     * @param {Kumis.Node.TemplateData} node
     * @param {Kumis.Util.Frame} frame
     */
    compileTemplateData(node, frame) {
        this.compileLiteral(node, frame);
    }

    /**
     * Compiles a capture node.
     *
     * @param {Kumis.Node.Capture} node
     * @param {Kumis.Util.Frame} frame
     */
    compileCapture(node, frame) {
        // We need to temporarily override the current buffer id as 'output'
        // So the set block writes to the capture output instead of the buffer
        const buffer = this._buffer;
        this._buffer = 'output';
        this._emitLine('await (async function() {');
        this._addIndent();
        this._emitLine('var output = "";');
        this.compile(node.body, frame);
        this._emitLine('return output;');
        this._subIndent();
        this._emitLine('})()');
        // And of course, revert back to the old buffer id
        this._buffer = buffer;
    }

    /**
     * Emits output node.
     *
     * @param {Kumis.Node.Output} node
     * @param {Kumis.Util.Frame} frame
     */
    compileOutput(node, frame) {
        const children = node.children;
        children.forEach(child => {
            // TemplateData is a special case because it is never
            // Autoescaped, so simply output it for optimization
            if (child instanceof Node.TemplateData) {
                if (child.value) {
                    this._emit(`${this._buffer} += `);
                    this.compileLiteral(child, frame);
                    this._emitLine(';');
                }
            } else {
                this._emit(`${this._buffer} += suppressValue(`);
                this.compile(child, frame);
                this._emit(', env.opts.autoescape);\n');
            }
        });
    }

    /**
     * Compiles the root node.
     *
     * @param {Kumis.Node.Root} node
     * @param {Kumis.Util.Frame} frame
     */
    compileRoot(node, frame) {
        if (frame) {
            this._fail('compileRoot: root node can\'t have frame', node.lineno, node.colno);
        }

        frame = new Frame();

        this._emitFuncBegin(node, 'root');
        this._emitLine('var parentTemplate = null;');
        this._compileChildren(node, frame);
        this._emitLine('if (parentTemplate) {');
        this._emitLine('    return await parentTemplate.rootRenderFunc(env, context, frame);');
        this._emitLine('}');
        this._emitLine(`return ${this._buffer};`);
        this._emitFuncEnd(true);

        this._inBlock = true;

        const blockNames = [];
        const blocks = node.findAll(Node.Block);

        blocks.forEach((block) => {
            const name = block.name.value;

            if (-1 !== blockNames.indexOf(name)) {
                throw new Error(`Block "${name}" defined more than once.`);
            }
            blockNames.push(name);

            this._emitFuncBegin(block, `b_${name}`);

            const tmpFrame = new Frame();
            this._emitLine('frame = frame.push(true);');
            this.compile(block.body, tmpFrame);
            this._emitFuncEnd();
        });

        this._emitLine('return {');

        blocks.forEach((block) => {
            const blockName = `b_${block.name.value}`;
            this._emitLine(`${blockName}: ${blockName},`);
        });

        this._emitLine('    root: root\n};');
    }

    /**
     * Compile a node.
     *
     * @param {Kumis.Node.Node} node
     * @param {Kumis.Util.Frame} frame
     */
    compile(node, frame) {
        const _compile = this['compile' + node.typename];
        if (! _compile) {
            this._fail(`compile: Cannot compile node: ${node.typename}`, node.lineno, node.colno);
        }

        _compile.call(this, node, frame);
    }

    /**
     * Gets the compiled code.
     *
     * @returns {string}
     */
    getCode() {
        return this._codebuf.join('');
    }

    static compile(src, extensions, name, opts = {}) {
        const c = new __self(name);

        // Run the extension preprocessors against the source.
        const preprocessors = (extensions || []).map(ext => ext.preprocess).filter(f => !!f);
        const processedSrc = preprocessors.reduce((s, processor) => processor(s), src);

        c.compile(transformer.transform(Parser.parse(processedSrc, extensions, opts), name));

        return c.getCode();
    }
}

module.exports = Compiler;
