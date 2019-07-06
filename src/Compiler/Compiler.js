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
    __construct(templateName, throwOnUndefined) {
        this.templateName = templateName;
        this.codebuf = [
            'const Runtime = Kumis.Runtime;\n',
            'const { contextOrFrameLookup, handleError, fromIterator, memberLookup, suppressValue } = Runtime;\n',
            'const Frame = Kumis.Util.Frame;\n',
            'const SafeString = Kumis.Util.SafeString;\n',
        ];
        this.lastId = 0;
        this.buffer = null;
        this.bufferStack = [];
        this._scopeClosers = '';
        this.inBlock = false;
        this.throwOnUndefined = throwOnUndefined;
    }

    fail(msg, lineno, colno) {
        if (lineno !== undefined) {
            lineno += 1;
        }
        if (colno !== undefined) {
            colno += 1;
        }

        throw new TemplateError(msg, lineno, colno);
    }

    _pushBuffer() {
        const id = this._tmpid();
        this.bufferStack.push(this.buffer);
        this.buffer = id;
        this._emit(`var ${this.buffer} = "";`);
        return id;
    }

    _popBuffer() {
        this.buffer = this.bufferStack.pop();
    }

    _emit(code) {
        this.codebuf.push(code);
    }

    _emitLine(code) {
        this._emit(code + '\n');
    }

    _emitLines(...lines) {
        lines.forEach((line) => this._emitLine(line));
    }

    _emitFuncBegin(node, name) {
        this.buffer = 'output';
        this._scopeClosers = '';
        this._emitLine(`async function ${name}(env, context, frame) {`);
        this._emitLine(`var lineno = ${node.lineno};`);
        this._emitLine(`var colno = ${node.colno};`);
        this._emitLine(`var ${this.buffer} = "";`);
        this._emitLine('try {');
    }

    _emitFuncEnd(noReturn) {
        if (!noReturn) {
            this._emitLine('return ' + this.buffer + ';');
        }

        this._closeScopeLevels();
        this._emitLine('} catch (e) {');
        this._emitLine('  throw handleError(e, lineno, colno);');
        this._emitLine('}');
        this._emitLine('}');
        this.buffer = null;
    }

    _addScopeLevel() {
        this._scopeClosers += '})';
    }

    _closeScopeLevels() {
        if (0 < this._scopeClosers.length) {
            this._emitLine(this._scopeClosers + ';');
            this._scopeClosers = '';
        }
    }

    _withScopedSyntax(func) {
        const _scopeClosers = this._scopeClosers;
        this._scopeClosers = '';

        func.call(this);

        this._closeScopeLevels();
        this._scopeClosers = _scopeClosers;
    }

    _tmpid() {
        this.lastId++;
        return 't_' + this.lastId;
    }

    _templateName() {
        return null == this.templateName ? 'undefined' : JSON.stringify(this.templateName);
    }

    _compileChildren(node, frame) {
        node.children.forEach((child) => {
            this.compile(child, frame);
        });
    }

    _compileAggregate(node, frame, startChar, endChar) {
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

    _compileExpression(node, frame) {
        this.compile(node, frame);
    }

    assertType(node, ...types) {
        if (!types.some(t => node instanceof t)) {
            this.fail(`assertType: invalid type: ${node.typename}`, node.lineno, node.colno);
        }
    }

    compileCallExtension(node, frame) {
        const args = node.args;
        const contentArgs = node.contentArgs;
        const autoescape = 'boolean' === typeof node.autoescape ? node.autoescape : true;

        this._emit(`${this.buffer} += suppressValue(`);
        this._emit(`await env.getExtension("${node.extName}")["${node.prop}"](`);
        this._emit('context');

        if (args || contentArgs) {
            this._emit(',');
        }

        if (args) {
            if (!(args instanceof Node.NodeList)) {
                this.fail('compileCallExtension: arguments must be a NodeList, use `parser.parseSignature`');
            }

            args.children.forEach((arg, i) => {
                // Tag arguments are passed normally to the call. Note
                // That keyword arguments are turned into a single js
                // Object as the last argument, if they exist.
                this._compileExpression(arg, frame);

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
                    const id = this._pushBuffer();

                    this._withScopedSyntax(() => {
                        this.compile(arg, frame);
                    });

                    this._popBuffer();
                    this._emitLine(`return ${id};`);
                    this._emitLine('}');
                } else {
                    this._emit('null');
                }
            });
        }

        this._emit(')');
        this._emit(`, ${autoescape} && env.opts.autoescape);\n`);
    }

    compileNodeList(node, frame) {
        this._compileChildren(node, frame);
    }

    compileLiteral(node) {
        if ('string' === typeof node.value) {
            let val = node.value.replace(/\\/g, '\\\\');
            val = val.replace(/"/g, '\\"');
            val = val.replace(/\n/g, '\\n');
            val = val.replace(/\r/g, '\\r');
            val = val.replace(/\t/g, '\\t');
            val = val.replace(/\u2028/g, '\\u2028');
            this._emit(`"${val}"`);
        } else if (null === node.value) {
            this._emit('null');
        } else {
            this._emit(node.value.toString());
        }
    }

    compileSymbolNode(node, frame) {
        const name = node.value;
        const v = frame.lookup(name);

        if (v) {
            this._emit(v);
        } else {
            this._emit('await contextOrFrameLookup(context, frame, "' + name + '")');
        }
    }

    compileGroup(node, frame) {
        this._compileAggregate(node, frame, '(', ')');
    }

    compileArray(node, frame) {
        this._compileAggregate(node, frame, '[', ']');
    }

    compileDict(node, frame) {
        this._compileAggregate(node, frame, '{', '}');
    }

    compilePair(node, frame) {
        let key = node.key;
        const val = node.value;

        if (key instanceof Node.SymbolNode) {
            key = new Node.Literal(key.lineno, key.colno, key.value);
        } else if (!(key instanceof Node.Literal && 'string' === typeof key.value)) {
            this.fail('compilePair: Dict keys must be strings or names',
                key.lineno,
                key.colno);
        }

        this.compile(key, frame);
        this._emit(': ');
        this._compileExpression(val, frame);
    }

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

    compileIn(node, frame) {
        this._emit('Runtime.inOperator(');
        this.compile(node.left, frame);
        this._emit(',');
        this.compile(node.right, frame);
        this._emit(')');
    }

    compileIs(node, frame) {
        // First, we need to try to get the name of the test function, if it's a
        // Callable (i.e., has args) and not a symbol.
        // Otherwise go with the symbol value
        const right = node.right.name ? node.right.name.value : node.right.value;
        this._emit('env.getTest("' + right + '").call(context, ');
        this.compile(node.left, frame);
        // Compile the arguments for the callable if they exist
        if (node.right.args) {
            this._emit(',');
            this.compile(node.right.args, frame);
        }
        this._emit(') === true');
    }

    _binOpEmitter(node, frame, str) {
        this.compile(node.left, frame);
        this._emit(str);
        this.compile(node.right, frame);
    }

    // Ensure concatenation instead of addition
    // By adding empty string in between
    compileOr(node, frame) {
        return this._binOpEmitter(node, frame, ' || ');
    }

    compileAnd(node, frame) {
        return this._binOpEmitter(node, frame, ' && ');
    }

    compileAdd(node, frame) {
        return this._binOpEmitter(node, frame, ' + ');
    }

    compileConcat(node, frame) {
        return this._binOpEmitter(node, frame, ' + "" + ');
    }

    compileSub(node, frame) {
        return this._binOpEmitter(node, frame, ' - ');
    }

    compileMul(node, frame) {
        return this._binOpEmitter(node, frame, ' * ');
    }

    compileDiv(node, frame) {
        return this._binOpEmitter(node, frame, ' / ');
    }

    compileMod(node, frame) {
        return this._binOpEmitter(node, frame, ' % ');
    }

    compileNot(node, frame) {
        this._emit('!');
        this.compile(node.target, frame);
    }

    compileFloorDiv(node, frame) {
        this._emit('Math.floor(');
        this.compile(node.left, frame);
        this._emit(' / ');
        this.compile(node.right, frame);
        this._emit(')');
    }

    compilePow(node, frame) {
        this._emit('Math.pow(');
        this.compile(node.left, frame);
        this._emit(', ');
        this.compile(node.right, frame);
        this._emit(')');
    }

    compileNeg(node, frame) {
        this._emit('-');
        this.compile(node.target, frame);
    }

    compilePos(node, frame) {
        this._emit('+');
        this.compile(node.target, frame);
    }

    compileCompare(node, frame) {
        this.compile(node.expr, frame);

        node.ops.forEach((op) => {
            this._emit(` ${compareOps[op.type]} `);
            this.compile(op.expr, frame);
        });
    }

    compileLookupVal(node, frame) {
        this._emit('await memberLookup((');
        this._compileExpression(node.target, frame);
        this._emit('),');
        this._compileExpression(node.val, frame);
        this._emit(')');
    }

    _getNodeName(node) {
        switch (node.typename) {
            case 'SymbolNode':
                return node.value;
            case 'FunCall':
                return 'the return value of (' + this._getNodeName(node.name) + ')';
            case 'LookupVal':
                return this._getNodeName(node.target) + '["' +
          this._getNodeName(node.val) + '"]';
            case 'Literal':
                return node.value.toString();
            default:
                return '--expression--';
        }
    }

    /**
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
        this._compileExpression(node.name, frame);

        // Output the name of what we're calling so we can get friendly errors
        // If the lookup fails.
        this._emit(', "' + this._getNodeName(node.name).replace(/"/g, '\\"') + '", context, ');

        this._compileAggregate(node.args, frame, '[', '])');

        this._emit(')');
    }

    compileFilter(node, frame) {
        const name = node.name;
        this.assertType(name, Node.SymbolNode);
        this._emit('await env.getFilter("' + name.value + '").call(context, ');
        this._compileAggregate(node.args, frame);
        this._emit(')');
    }

    compileKeywordArgs(node, frame) {
        this._emit('Runtime.makeKeywordArgs(');
        this.compileDict(node, frame);
        this._emit(')');
    }

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
            this._compileExpression(node.value, frame);
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
            this._emitLine(`context.setVariable("${name}", ${id});`);
            this._emitLine('}');

            if ('_' !== name.charAt(0)) {
                this._emitLine('if(frame.topLevel) {');
                this._emitLine(`context.addExport("${name}", ${id});`);
                this._emitLine('}');
            }
        });
    }

    compileSwitch(node, frame) {
        this._emit('switch (');
        this.compile(node.expr, frame);
        this._emit(') {');
        node.cases.forEach(c => {
            this._emit('case ');
            this.compile(c.cond, frame);
            this._emit(': ');
            this.compile(c.body, frame);
            // Preserve fall-throughs
            if (c.body.children.length) {
                this._emitLine('break;');
            }
        });
        if (node.default) {
            this._emit('default:');
            this.compile(node.default, frame);
        }
        this._emit('}');
    }

    compileIf(node, frame) {
        this._emit('if(');
        this._compileExpression(node.cond, frame);
        this._emitLine(') {');

        this._withScopedSyntax(() => {
            this.compile(node.body, frame);
        });

        if (node.else_) {
            this._emitLine('}\nelse {');

            this._withScopedSyntax(() => {
                this.compile(node.else_, frame);
            });
        }

        this._emitLine('}');
    }

    _emitLoopBindings(node, arr, i, len) {
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

    compileFor(node, frame) {
        const i = this._tmpid();
        const len = this._tmpid();
        const arr = this._tmpid();
        frame = frame.push();

        this._emitLine('frame = frame.push();');

        this._emit(`var ${arr} = `);
        this._compileExpression(node.arr, frame);
        this._emitLine(';');

        this._emit(`if(${arr}) {`);
        this._emitLine(arr + ' = fromIterator(' + arr + ');');

        // If multiple names are passed, we need to bind them appropriately
        if (node.name instanceof Node.Array) {
            this._emitLine(`var ${i};`);

            // The object could be an array or object. Note that the
            // Body of the loop is duplicated for each condition, but
            // We are optimizing for speed over size.
            this._emitLine(`if(isArray(${arr})) {`);
            this._emitLine(`var ${len} = ${arr}.length;`);
            this._emitLine(`for(${i}=0; ${i} < ${arr}.length; ${i}++) {`);

            // Bind each declared var
            node.name.children.forEach((child, u) => {
                const tid = this._tmpid();
                this._emitLine(`var ${tid} = await ${arr}[${i}][${u}];`);
                this._emitLine(`frame.set("${child}", ${tid});`);
                frame.set(node.name.children[u].value, tid);
            });

            this._emitLoopBindings(node, arr, i, len);
            this._withScopedSyntax(() => {
                this.compile(node.body, frame);
            });
            this._emitLine('}');

            this._emitLine('} else {');
            // Iterate over the key/values of an object
            const [ key, val ] = node.name.children;
            const k = this._tmpid();
            const v = this._tmpid();
            frame.set(key.value, k);
            frame.set(val.value, v);

            this._emitLine(`${i} = -1;`);
            this._emitLine(`var ${len} = __jymfony.keys(${arr}).length;`);
            this._emitLine(`for(var ${k} in ${arr}) {`);
            this._emitLine(`${i}++;`);
            this._emitLine(`var ${v} = await ${arr}[${k}];`);
            this._emitLine(`frame.set("${key.value}", ${k});`);
            this._emitLine(`frame.set("${val.value}", ${v});`);

            this._emitLoopBindings(node, arr, i, len);
            this._withScopedSyntax(() => {
                this.compile(node.body, frame);
            });
            this._emitLine('}');

            this._emitLine('}');
        } else {
            // Generate a typical array iteration
            const v = this._tmpid();
            frame.set(node.name.value, v);

            this._emitLine(`var ${len} = ${arr}.length;`);
            this._emitLine(`for(var ${i}=0; ${i} < ${arr}.length; ${i}++) {`);
            this._emitLine(`var ${v} = await ${arr}[${i}];`);
            this._emitLine(`frame.set("${node.name.value}", ${v});`);

            this._emitLoopBindings(node, arr, i, len);

            this._withScopedSyntax(() => {
                this.compile(node.body, frame);
            });

            this._emitLine('}');
        }

        this._emitLine('}');
        if (node.else_) {
            this._emitLine('if (!' + len + ') {');
            this.compile(node.else_, frame);
            this._emitLine('}');
        }

        this._emitLine('frame = frame.pop();');
    }

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

        const realNames = [ ...args.map((n) => `l_${n.value}`), 'kwargs' ];

        // Quoted argument names
        const argNames = args.map((n) => `"${n.value}"`);
        const kwargNames = ((kwargs && kwargs.children) || []).map((n) => `"${n.key.value}"`);

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
            `async function (${realNames.join(', ')}) {`,
            'var callerFrame = frame;',
            'frame = ' + ((keepFrame) ? 'frame.push(true);' : 'new Frame();'),
            'kwargs = kwargs || {};',
            'if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {',
            'frame.set("caller", kwargs.caller); }');

        // Expose the arguments to the template. Don't need to use
        // Random names because the function
        // Will create a new run-time scope for us
        args.forEach((arg) => {
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
                this._compileExpression(pair.value, currFrame);
                this._emit(');');
            });
        }

        const bufferId = this._pushBuffer();

        this._withScopedSyntax(() => {
            this.compile(node.body, currFrame);
        });

        this._emitLine('frame = ' + ((keepFrame) ? 'frame.pop();' : 'callerFrame;'));
        this._emitLine(`return new Kumis.Util.SafeString(${bufferId});`);
        this._emitLine('});');
        this._popBuffer();

        return funcId;
    }

    compileMacro(node, frame) {
        const funcId = this._compileMacro(node);

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

    compileCaller(node, frame) {
    // Basically an anonymous "macro expression"
        this._emit('(function (){');
        const funcId = this._compileMacro(node, frame);
        this._emit(`return ${funcId};})()`);
    }

    _compileGetTemplate(node, frame, eagerCompile, ignoreMissing) {
        const parentTemplateId = this._tmpid();
        const parentName = this._templateName();

        const eagerCompileArg = (eagerCompile) ? 'true' : 'false';
        const ignoreMissingArg = (ignoreMissing) ? 'true' : 'false';
        this._emit(`var ${parentTemplateId} = await env.getTemplate(`);
        this._compileExpression(node.template, frame);
        this._emitLine(`, ${eagerCompileArg}, ${parentName}, ${ignoreMissingArg});`);

        return parentTemplateId;
    }

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
            this._emitLine(`var ${id} = ${importedId}.${name};`);
            this._emitLine('} else {');
            this._emitLine(`throw new Error("cannot import '${name}'");`);
            this._emitLine('}');

            frame.set(alias, id);

            if (frame.parent) {
                this._emitLine(`frame.set("${alias}", ${id});`);
            } else {
                this._emitLine(`context.setVariable("${alias}", ${id});`);
            }
        });
    }

    compileBlock(node) {
        this._emit(`${this.buffer} += await `);

        // If we are executing outside a block (creating a top-level
        // Block), we really don't want to execute its code because it
        // Will execute twice: once when the child template runs and
        // Again when the parent template runs. Note that blocks
        // Within blocks will *always* execute immediately *and*
        // Wherever else they are invoked (like used in a parent
        // Template). This may have behavioral differences from jinja
        // Because blocks can have side effects, but it seems like a
        // Waste of performance to always execute huge top-level
        // Blocks twice
        if (!this.inBlock) {
            this._emit('(parentTemplate ? () => \'\' : ');
        }
        this._emit(`context.getBlock("${node.name.value}")`);
        if (!this.inBlock) {
            this._emit(')');
        }
        this._emitLine('(env, context, frame);');
    }

    compileSuper(node, frame) {
        const name = node.blockName.value;
        const id = node.symbol.value;

        this._emitLine(`${id} = await context.getSuper(env, "${name}", b_${name}, frame);`);
        this._emitLine(`${id} = SafeString.markSafe(${id});`);
        frame.set(id, id);
    }

    compileExtends(node, frame) {
        const k = this._tmpid();

        const parentTemplateId = this._compileGetTemplate(node, frame, true, false);

        // Extends is a dynamic tag and can occur within a block like
        // `if`, so if this happens we need to capture the parent
        // Template in the top-level scope
        this._emitLine(`parentTemplate = ${parentTemplateId}`);

        this._emitLine(`for(var ${k} in parentTemplate.blocks) {`);
        this._emitLine(`context.addBlock(${k}, parentTemplate.blocks[${k}]);`);
        this._emitLine('}');
    }

    compileInclude(node, frame) {
        const id = this._compileGetTemplate(node, frame, false, node.ignoreMissing);

        this._emitLine(`${this.buffer} += await ${id}.render(context.getVariables(), frame)`);
    }

    compileTemplateData(node, frame) {
        this.compileLiteral(node, frame);
    }

    compileCapture(node, frame) {
    // We need to temporarily override the current buffer id as 'output'
    // So the set block writes to the capture output instead of the buffer
        const buffer = this.buffer;
        this.buffer = 'output';
        this._emitLine('await (async function() {');
        this._emitLine('var output = "";');
        this._withScopedSyntax(() => {
            this.compile(node.body, frame);
        });
        this._emitLine('return output;');
        this._emitLine('})()');
        // And of course, revert back to the old buffer id
        this.buffer = buffer;
    }

    compileOutput(node, frame) {
        const children = node.children;
        children.forEach(child => {
            // TemplateData is a special case because it is never
            // Autoescaped, so simply output it for optimization
            if (child instanceof Node.TemplateData) {
                if (child.value) {
                    this._emit(`${this.buffer} += `);
                    this.compileLiteral(child, frame);
                    this._emitLine(';');
                }
            } else {
                this._emit(`${this.buffer} += suppressValue(`);
                if (this.throwOnUndefined) {
                    this._emit('Runtime.ensureDefined(');
                }
                this.compile(child, frame);
                if (this.throwOnUndefined) {
                    this._emit(`,${node.lineno},${node.colno})`);
                }
                this._emit(', env.opts.autoescape);\n');
            }
        });
    }

    compileRoot(node, frame) {
        if (frame) {
            this.fail('compileRoot: root node can\'t have frame');
        }

        frame = new Frame();

        this._emitFuncBegin(node, 'root');
        this._emitLine('var parentTemplate = null;');
        this._compileChildren(node, frame);
        this._emitLine('if(parentTemplate) {');
        this._emitLine('return await parentTemplate.rootRenderFunc(env, context, frame);');
        this._emitLine('} else {');
        this._emitLine(`return ${this.buffer};`);
        this._emitLine('}');
        this._emitFuncEnd(true);

        this.inBlock = true;

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

        this._emitLine('root: root\n};');
    }

    compile(node, frame) {
        const _compile = this['compile' + node.typename];
        if (_compile) {
            _compile.call(this, node, frame);
        } else {
            this.fail(`compile: Cannot compile node: ${node.typename}`, node.lineno, node.colno);
        }
    }

    getCode() {
        return this.codebuf.join('');
    }

    static compile(src, extensions, name, opts = {}) {
        const c = new __self(name, opts.throwOnUndefined);

        // Run the extension preprocessors against the source.
        const preprocessors = (extensions || []).map(ext => ext.preprocess).filter(f => !!f);
        const processedSrc = preprocessors.reduce((s, processor) => processor(s), src);

        c.compile(transformer.transform(Parser.parse(processedSrc, extensions, opts), name));

        return c.getCode();
    }
}

module.exports = Compiler;
