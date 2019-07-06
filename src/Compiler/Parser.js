const TemplateError = Kumis.Exception.TemplateError;
const Tokenizer = Kumis.Compiler.Tokenizer;
const Node = Kumis.Node;

/**
 * @memberOf Kumis.Compiler
 */
class Parser {
    /**
     * Constructor.
     *
     * @param {Kumis.Compiler.Tokenizer} tokens
     */
    __construct(tokens) {
        /**
         * @type {Kumis.Compiler.Tokenizer}
         */
        this.tokens = tokens;
        this.peeked = null;
        this.breakOnBlocks = null;
        this.dropLeadingWhitespace = false;

        /**
         * @type {Kumis.Extension.ExtensionInterface[]}
         */
        this.extensions = [];
    }

    nextToken(withWhitespace) {
        let tok;

        if (this.peeked) {
            if (!withWhitespace && this.peeked.type === Tokenizer.TOKEN_WHITESPACE) {
                this.peeked = null;
            } else {
                tok = this.peeked;
                this.peeked = null;
                return tok;
            }
        }

        tok = this.tokens.nextToken();

        if (! withWhitespace) {
            while (tok && tok.type === Tokenizer.TOKEN_WHITESPACE) {
                tok = this.tokens.nextToken();
            }
        }

        return tok;
    }

    peekToken() {
        this.peeked = this.peeked || this.nextToken();
        return this.peeked;
    }

    pushToken(tok) {
        if (this.peeked) {
            throw new Error('pushToken: can only push one token on between reads');
        }
        this.peeked = tok;
    }

    error(msg, lineno, colno) {
        if (lineno === undefined || colno === undefined) {
            const tok = this.peekToken() || {};
            lineno = tok.lineno;
            colno = tok.colno;
        }
        if (lineno !== undefined) {
            lineno += 1;
        }
        if (colno !== undefined) {
            colno += 1;
        }

        return new TemplateError(msg, lineno, colno);
    }

    fail(msg, lineno, colno) {
        throw this.error(msg, lineno, colno);
    }

    skip(type) {
        const tok = this.nextToken();
        if (!tok || tok.type !== type) {
            this.pushToken(tok);
            return false;
        }
        return true;
    }

    expect(type) {
        const tok = this.nextToken();
        if (tok.type !== type) {
            this.fail('expected ' + type + ', got ' + tok.type,
                tok.lineno,
                tok.colno);
        }
        return tok;
    }

    skipValue(type, val) {
        const tok = this.nextToken();
        if (!tok || tok.type !== type || tok.value !== val) {
            this.pushToken(tok);
            return false;
        }
        return true;
    }

    skipSymbol(val) {
        return this.skipValue(Tokenizer.TOKEN_SYMBOL, val);
    }

    advanceAfterBlockEnd(name) {
        let tok;
        if (!name) {
            tok = this.peekToken();

            if (!tok) {
                this.fail('unexpected end of file');
            }

            if (tok.type !== Tokenizer.TOKEN_SYMBOL) {
                this.fail('advanceAfterBlockEnd: expected symbol token or explicit name to be passed');
            }

            name = this.nextToken().value;
        }

        tok = this.nextToken();

        if (tok && tok.type === Tokenizer.TOKEN_BLOCK_END) {
            if ('-' === tok.value.charAt(0)) {
                this.dropLeadingWhitespace = true;
            }
        } else {
            this.fail('expected block end in ' + name + ' statement');
        }

        return tok;
    }

    advanceAfterVariableEnd() {
        const tok = this.nextToken();

        if (tok && tok.type === Tokenizer.TOKEN_VARIABLE_END) {
            this.dropLeadingWhitespace = '-' === tok.value.charAt(
                tok.value.length - this.tokens.tags.VARIABLE_END.length - 1
            );
        } else {
            this.pushToken(tok);
            this.fail('expected variable end');
        }
    }

    parseFor() {
        const forTok = this.peekToken();
        let node;
        let endBlock;

        if (this.skipSymbol('for')) {
            node = new Node.For(forTok.lineno, forTok.colno);
            endBlock = 'endfor';
        } else {
            this.fail('parseFor: expected for', forTok.lineno, forTok.colno);
        }

        node.name = this.parsePrimary();

        if (!(node.name instanceof Node.SymbolNode)) {
            this.fail('parseFor: variable name expected for loop');
        }

        const type = this.peekToken().type;
        if (type === Tokenizer.TOKEN_COMMA) {
            // Key/value iteration
            const key = node.name;
            node.name = new Node.Array(key.lineno, key.colno);
            node.name.addChild(key);

            while (this.skip(Tokenizer.TOKEN_COMMA)) {
                const prim = this.parsePrimary();
                node.name.addChild(prim);
            }
        }

        if (!this.skipSymbol('in')) {
            this.fail('parseFor: expected "in" keyword for loop', forTok.lineno, forTok.colno);
        }

        node.arr = this.parseExpression();
        this.advanceAfterBlockEnd(forTok.value);

        node.body = this.parseUntilBlocks(endBlock, 'else');

        if (this.skipSymbol('else')) {
            this.advanceAfterBlockEnd('else');
            node.else_ = this.parseUntilBlocks(endBlock);
        }

        this.advanceAfterBlockEnd();

        return node;
    }

    parseMacro() {
        const macroTok = this.peekToken();
        if (!this.skipSymbol('macro')) {
            this.fail('expected macro');
        }

        const name = this.parsePrimary(true);
        const args = this.parseSignature();
        const node = new Node.Macro(macroTok.lineno, macroTok.colno, name, args);

        this.advanceAfterBlockEnd(macroTok.value);
        node.body = this.parseUntilBlocks('endmacro');
        this.advanceAfterBlockEnd();

        return node;
    }

    parseCall() {
        // A call block is parsed as a normal FunCall, but with an added
        // 'caller' kwarg which is a Caller node.
        const callTok = this.peekToken();
        if (! this.skipSymbol('call')) {
            this.fail('expected call');
        }

        const callerArgs = this.parseSignature(true) || new Node.NodeList();
        const macroCall = this.parsePrimary();

        this.advanceAfterBlockEnd(callTok.value);
        const body = this.parseUntilBlocks('endcall');
        this.advanceAfterBlockEnd();

        const callerName = new Node.SymbolNode(callTok.lineno, callTok.colno, 'caller');
        const callerNode = new Node.Caller(callTok.lineno, callTok.colno, callerName, callerArgs, body);

        // Add the additional caller kwarg, adding kwargs if necessary
        const args = macroCall.args.children;
        if (!(args[args.length - 1] instanceof Node.KeywordArgs)) {
            args.push(new Node.KeywordArgs());
        }
        const kwargs = args[args.length - 1];
        kwargs.addChild(new Node.Pair(callTok.lineno,
            callTok.colno,
            callerName,
            callerNode));

        return new Node.Output(callTok.lineno,
            callTok.colno,
            [ macroCall ]);
    }

    parseWithContext() {
        const tok = this.peekToken();

        let withContext = null;

        if (this.skipSymbol('with')) {
            withContext = true;
        } else if (this.skipSymbol('without')) {
            withContext = false;
        }

        if (null !== withContext) {
            if (!this.skipSymbol('context')) {
                this.fail('parseFrom: expected context after with/without', tok.lineno, tok.colno);
            }
        }

        return withContext;
    }

    parseImport() {
        const importTok = this.peekToken();
        if (! this.skipSymbol('import')) {
            this.fail('parseImport: expected import', importTok.lineno, importTok.colno);
        }

        const template = this.parseExpression();

        if (! this.skipSymbol('as')) {
            this.fail('parseImport: expected "as" keyword', importTok.lineno, importTok.colno);
        }

        const target = this.parseExpression();
        const withContext = this.parseWithContext();
        const node = new Node.Import(importTok.lineno,
            importTok.colno,
            template,
            target,
            withContext);

        this.advanceAfterBlockEnd(importTok.value);

        return node;
    }

    parseFrom() {
        const fromTok = this.peekToken();
        if (!this.skipSymbol('from')) {
            this.fail('parseFrom: expected from');
        }

        const template = this.parseExpression();

        if (!this.skipSymbol('import')) {
            this.fail('parseFrom: expected import', fromTok.lineno, fromTok.colno);
        }

        const names = new Node.NodeList();
        let withContext;

        while (1) { // eslint-disable-line no-constant-condition
            const nextTok = this.peekToken();
            if (nextTok.type === Tokenizer.TOKEN_BLOCK_END) {
                if (!names.children.length) {
                    this.fail('parseFrom: Expected at least one import name', fromTok.lineno, fromTok.colno);
                }

                // Since we are manually advancing past the block end,
                // Need to keep track of whitespace control (normally
                // This is done in `advanceAfterBlockEnd`
                if ('-' === nextTok.value.charAt(0)) {
                    this.dropLeadingWhitespace = true;
                }

                this.nextToken();
                break;
            }

            if (0 < names.children.length && !this.skip(Tokenizer.TOKEN_COMMA)) {
                this.fail('parseFrom: expected comma', fromTok.lineno, fromTok.colno);
            }

            const name = this.parsePrimary();
            if ('_' === name.value.charAt(0)) {
                this.fail('parseFrom: names starting with an underscore cannot be imported', name.lineno, name.colno);
            }

            if (this.skipSymbol('as')) {
                const alias = this.parsePrimary();
                names.addChild(new Node.Pair(name.lineno, name.colno, name, alias));
            } else {
                names.addChild(name);
            }

            withContext = this.parseWithContext();
        }

        return new Node.FromImport(fromTok.lineno, fromTok.colno, template, names, withContext);
    }

    parseBlock() {
        const tag = this.peekToken();
        if (!this.skipSymbol('block')) {
            this.fail('parseBlock: expected block', tag.lineno, tag.colno);
        }

        const node = new Node.Block(tag.lineno, tag.colno);

        node.name = this.parsePrimary();
        if (! (node.name instanceof Node.SymbolNode)) {
            this.fail('parseBlock: variable name expected', tag.lineno, tag.colno);
        }

        this.advanceAfterBlockEnd(tag.value);

        node.body = this.parseUntilBlocks('endblock');
        this.skipSymbol('endblock');
        this.skipSymbol(node.name.value);

        const tok = this.peekToken();
        if (! tok) {
            this.fail('parseBlock: expected endblock, got end of file');
        }

        this.advanceAfterBlockEnd(tok.value);

        return node;
    }

    parseExtends() {
        const tagName = 'extends';
        const tag = this.peekToken();
        if (! this.skipSymbol(tagName)) {
            this.fail('parseTemplateRef: expected ' + tagName);
        }

        const node = new Node.Extends(tag.lineno, tag.colno);
        node.template = this.parseExpression();

        this.advanceAfterBlockEnd(tag.value);
        return node;
    }

    parseInclude() {
        const tagName = 'include';
        const tag = this.peekToken();
        if (! this.skipSymbol(tagName)) {
            this.fail('parseInclude: expected ' + tagName);
        }

        const node = new Node.Include(tag.lineno, tag.colno);
        node.template = this.parseExpression();

        if (this.skipSymbol('ignore') && this.skipSymbol('missing')) {
            node.ignoreMissing = true;
        }

        this.advanceAfterBlockEnd(tag.value);
        return node;
    }

    parseIf() {
        const tag = this.peekToken();
        let node;

        if (this.skipSymbol('if') || this.skipSymbol('elif') || this.skipSymbol('elseif')) {
            node = new Node.If(tag.lineno, tag.colno);
        } else {
            this.fail('parseIf: expected if, elif, or elseif', tag.lineno, tag.colno);
        }

        node.cond = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);

        node.body = this.parseUntilBlocks('elif', 'elseif', 'else', 'endif');
        const tok = this.peekToken();

        switch (tok && tok.value) {
            case 'elseif':
            case 'elif':
                node.else_ = this.parseIf();
                break;
            case 'else':
                this.advanceAfterBlockEnd();
                node.else_ = this.parseUntilBlocks('endif');
                this.advanceAfterBlockEnd();
                break;
            case 'endif':
                node.else_ = null;
                this.advanceAfterBlockEnd();
                break;
            default:
                this.fail('parseIf: expected elif, else, or endif, got end of file');
        }

        return node;
    }

    parseSet() {
        const tag = this.peekToken();
        if (! this.skipSymbol('set')) {
            this.fail('parseSet: expected set', tag.lineno, tag.colno);
        }

        const node = new Node.Set(tag.lineno, tag.colno, []);

        let target;
        while ((target = this.parsePrimary())) {
            node.targets.push(target);

            if (! this.skip(Tokenizer.TOKEN_COMMA)) {
                break;
            }
        }

        if (!this.skipValue(Tokenizer.TOKEN_OPERATOR, '=')) {
            if (!this.skip(Tokenizer.TOKEN_BLOCK_END)) {
                this.fail('parseSet: expected = or block end in set tag', tag.lineno, tag.colno);
            } else {
                node.body = new Node.Capture(tag.lineno, tag.colno, this.parseUntilBlocks('endset'));
                node.value = null;
                this.advanceAfterBlockEnd();
            }
        } else {
            node.value = this.parseExpression();
            this.advanceAfterBlockEnd(tag.value);
        }

        return node;
    }

    parseSwitch() {
        /*
         * Store the tag names in variables in case someone ever wants to
         * customize this.
         */
        const switchStart = 'switch';
        const switchEnd = 'endswitch';
        const caseStart = 'case';
        const caseDefault = 'default';

        // Get the switch tag.
        const tag = this.peekToken();

        // Fail early if we get some unexpected tag.
        if (! this.skipSymbol(switchStart) && ! this.skipSymbol(caseStart) && ! this.skipSymbol(caseDefault)) {
            this.fail('parseSwitch: expected "switch," "case" or "default"', tag.lineno, tag.colno);
        }

        // Parse the switch expression
        const expr = this.parseExpression();

        // Advance until a start of a case, a default case or an endswitch.
        this.advanceAfterBlockEnd(switchStart);
        this.parseUntilBlocks(caseStart, caseDefault, switchEnd);

        // This is the first case. it could also be an endswitch, we'll check.
        let tok = this.peekToken();

        // Create new variables for our cases and default case.
        const cases = [];
        let defaultCase;

        // While we're dealing with new cases nodes...
        do {
            // Skip the start symbol and get the case expression
            this.skipSymbol(caseStart);
            const cond = this.parseExpression();
            this.advanceAfterBlockEnd(switchStart);
            // Get the body of the case node and add it to the array of cases.
            const body = this.parseUntilBlocks(caseStart, caseDefault, switchEnd);
            cases.push(new Node.Case(tok.line, tok.col, cond, body));
            // Get our next case
            tok = this.peekToken();
        } while (tok && tok.value === caseStart);

        // We either have a default case or a switch end.
        switch (tok.value) {
            case caseDefault:
                this.advanceAfterBlockEnd();
                defaultCase = this.parseUntilBlocks(switchEnd);
                this.advanceAfterBlockEnd();
                break;
            case switchEnd:
                this.advanceAfterBlockEnd();
                break;
            default:
                // Otherwise bail because EOF
                this.fail('parseSwitch: expected "case," "default" or "endswitch," got EOF.');
        }

        // And return the switch node.
        return new Node.Switch(tag.lineno, tag.colno, expr, cases, defaultCase);
    }

    parseStatement() {
        const tok = this.peekToken();
        if (tok.type !== Tokenizer.TOKEN_SYMBOL) {
            this.fail('tag name expected', tok.lineno, tok.colno);
        }

        if (this.breakOnBlocks && -1 !== this.breakOnBlocks.indexOf(tok.value)) {
            return null;
        }

        switch (tok.value) {
            case 'raw':
                return this.parseRaw();
            case 'verbatim':
                return this.parseRaw('verbatim');
            case 'if':
            case 'ifAsync':
                return this.parseIf();
            case 'for':
                return this.parseFor();
            case 'block':
                return this.parseBlock();
            case 'extends':
                return this.parseExtends();
            case 'include':
                return this.parseInclude();
            case 'set':
                return this.parseSet();
            case 'macro':
                return this.parseMacro();
            case 'call':
                return this.parseCall();
            case 'import':
                return this.parseImport();
            case 'from':
                return this.parseFrom();
            case 'filter':
                return this.parseFilterStatement();
            case 'switch':
                return this.parseSwitch();
            default:
                for (const ext of this.extensions) {
                    for (const tag of ext.tags || []) {
                        if (tag.name === tok.value) {
                            return tag.parse(this, ext);
                        }
                    }
                }

                this.fail('Unknown block tag: ' + tok.value, tok.lineno, tok.colno);
        }
    }

    parseRaw(tagName) {
        tagName = tagName || 'raw';
        const endTagName = 'end' + tagName;
        // Look for upcoming raw blocks (ignore all other kinds of blocks)
        const rawBlockRegex = new RegExp('([\\s\\S]*?){%\\s*(' + tagName + '|' + endTagName + ')\\s*(?=%})%}');
        let rawLevel = 1;
        let str = '';
        let matches;

        // Skip opening raw token
        // Keep this token to track line and column numbers
        const begun = this.advanceAfterBlockEnd();

        // Exit when there's nothing to match
        // Or when we've found the matching "endraw" block
        while ((matches = this.tokens._extractRegex(rawBlockRegex)) && 0 < rawLevel) {
            const all = matches[0];
            const pre = matches[1];
            const blockName = matches[2];

            // Adjust rawlevel
            if (blockName === tagName) {
                rawLevel += 1;
            } else if (blockName === endTagName) {
                rawLevel -= 1;
            }

            // Add to str
            if (0 === rawLevel) {
                // We want to exclude the last "endraw"
                str += pre;
                // Move tokenizer to beginning of endraw block
                this.tokens.backN(all.length - pre.length);
            } else {
                str += all;
            }
        }

        return new Node.Output(begun.lineno, begun.colno, [ new Node.TemplateData(begun.lineno, begun.colno, str) ]);
    }

    parsePostfix(node) {
        let lookup;
        let tok = this.peekToken();

        while (tok) {
            if (tok.type === Tokenizer.TOKEN_LEFT_PAREN) {
                // Function call
                node = new Node.FunCall(tok.lineno, tok.colno, node, this.parseSignature());
            } else if (tok.type === Tokenizer.TOKEN_LEFT_BRACKET) {
                // Reference
                lookup = this.parseAggregate();
                if (1 < lookup.children.length) {
                    this.fail('invalid index');
                }

                node = new Node.LookupVal(tok.lineno, tok.colno, node, lookup.children[0]);
            } else if (tok.type === Tokenizer.TOKEN_OPERATOR && '.' === tok.value) {
                // Reference
                this.nextToken();
                const val = this.nextToken();

                if (val.type !== Tokenizer.TOKEN_SYMBOL) {
                    this.fail('expected name as lookup value, got ' + val.value, val.lineno, val.colno);
                }

                // Make a literal string because it's not a variable
                // Reference
                lookup = new Node.Literal(val.lineno, val.colno, val.value);
                node = new Node.LookupVal(tok.lineno, tok.colno, node, lookup);
            } else {
                break;
            }

            tok = this.peekToken();
        }

        return node;
    }

    parseExpression() {
        return this.parseInlineIf();
    }

    parseInlineIf() {
        let node = this.parseOr();
        if (this.skipSymbol('if')) {
            const condNode = this.parseOr();
            const bodyNode = node;
            node = new Node.InlineIf(node.lineno, node.colno);
            node.body = bodyNode;
            node.cond = condNode;
            if (this.skipSymbol('else')) {
                node.else_ = this.parseOr();
            } else {
                node.else_ = null;
            }
        }

        return node;
    }

    parseOr() {
        let node = this.parseAnd();
        while (this.skipSymbol('or')) {
            const node2 = this.parseAnd();
            node = new Node.Or(node.lineno,
                node.colno,
                node,
                node2);
        }
        return node;
    }

    parseAnd() {
        let node = this.parseNot();
        while (this.skipSymbol('and')) {
            const node2 = this.parseNot();
            node = new Node.And(node.lineno,
                node.colno,
                node,
                node2);
        }
        return node;
    }

    parseNot() {
        const tok = this.peekToken();
        if (this.skipSymbol('not')) {
            return new Node.Not(tok.lineno,
                tok.colno,
                this.parseNot());
        }
        return this.parseIn();
    }

    parseIn() {
        let node = this.parseIs();
        while (1) { // eslint-disable-line no-constant-condition
            // Check if the next token is 'not'
            const tok = this.nextToken();
            if (! tok) {
                break;
            }

            const invert = tok.type === Tokenizer.TOKEN_SYMBOL && 'not' === tok.value;
            // If it wasn't 'not', put it back
            if (! invert) {
                this.pushToken(tok);
            }
            if (this.skipSymbol('in')) {
                const node2 = this.parseIs();
                node = new Node.In(node.lineno, node.colno, node, node2);
                if (invert) {
                    node = new Node.Not(node.lineno, node.colno, node);
                }
            } else {
                // If we'd found a 'not' but this wasn't an 'in', put back the 'not'
                if (invert) {
                    this.pushToken(tok);
                }

                break;
            }
        }
        return node;
    }

    // I put this right after "in" in the operator precedence stack. That can
    // Obviously be changed to be closer to Jinja.
    parseIs() {
        let node = this.parseCompare();
        // Look for an is
        if (this.skipSymbol('is')) {
            // Look for a not
            const not = this.skipSymbol('not');
            // Get the next node
            const node2 = this.parseCompare();
            // Create an Is node using the next node and the info from our Is node.
            node = new Node.Is(node.lineno, node.colno, node, node2);
            // If we have a Not, create a Not node from our Is node.
            if (not) {
                node = new Node.Not(node.lineno, node.colno, node);
            }
        }

        // Return the node.
        return node;
    }

    parseCompare() {
        const compareOps = [ '==', '===', '!=', '!==', '<', '>', '<=', '>=' ];
        const expr = this.parseConcat();
        const ops = [];

        while (1) { // eslint-disable-line no-constant-condition
            const tok = this.nextToken();

            if (!tok) {
                break;
            } else if (-1 !== compareOps.indexOf(tok.value)) {
                ops.push(new Node.CompareOperand(tok.lineno, tok.colno, this.parseConcat(), tok.value));
            } else {
                this.pushToken(tok);
                break;
            }
        }

        if (ops.length) {
            return new Node.Compare(ops[0].lineno, ops[0].colno, expr, ops);
        }

        return expr;

    }

    // Finds the '~' for string concatenation
    parseConcat() {
        let node = this.parseAdd();
        while (this.skipValue(Tokenizer.TOKEN_TILDE, '~')) {
            const node2 = this.parseAdd();
            node = new Node.Concat(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseAdd() {
        let node = this.parseSub();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '+')) {
            const node2 = this.parseSub();
            node = new Node.Add(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseSub() {
        let node = this.parseMul();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '-')) {
            const node2 = this.parseMul();
            node = new Node.Sub(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseMul() {
        let node = this.parseDiv();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '*')) {
            const node2 = this.parseDiv();
            node = new Node.Mul(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseDiv() {
        let node = this.parseFloorDiv();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '/')) {
            const node2 = this.parseFloorDiv();
            node = new Node.Div(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseFloorDiv() {
        let node = this.parseMod();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '//')) {
            const node2 = this.parseMod();
            node = new Node.FloorDiv(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseMod() {
        let node = this.parsePow();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '%')) {
            const node2 = this.parsePow();
            node = new Node.Mod(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parsePow() {
        let node = this.parseUnary();
        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '**')) {
            const node2 = this.parseUnary();
            node = new Node.Pow(node.lineno, node.colno, node, node2);
        }

        return node;
    }

    parseUnary(noFilters) {
        const tok = this.peekToken();
        let node;

        if (this.skipValue(Tokenizer.TOKEN_OPERATOR, '-')) {
            node = new Node.Neg(tok.lineno, tok.colno, this.parseUnary(true));
        } else if (this.skipValue(Tokenizer.TOKEN_OPERATOR, '+')) {
            node = new Node.Pos(tok.lineno, tok.colno, this.parseUnary(true));
        } else {
            node = this.parsePrimary();
        }

        if (!noFilters) {
            node = this.parseFilter(node);
        }

        return node;
    }

    parsePrimary(noPostfix) {
        const tok = this.nextToken();
        let val;
        let node = null;

        if (!tok) {
            this.fail('expected expression, got end of file');
        } else if (tok.type === Tokenizer.TOKEN_STRING) {
            val = tok.value;
        } else if (tok.type === Tokenizer.TOKEN_INT) {
            val = parseInt(tok.value, 10);
        } else if (tok.type === Tokenizer.TOKEN_FLOAT) {
            val = parseFloat(tok.value);
        } else if (tok.type === Tokenizer.TOKEN_BOOLEAN) {
            if ('true' === tok.value) {
                val = true;
            } else if ('false' === tok.value) {
                val = false;
            } else {
                this.fail('invalid boolean: ' + tok.value, tok.lineno, tok.colno);
            }
        } else if (tok.type === Tokenizer.TOKEN_NONE) {
            val = null;
        } else if (tok.type === Tokenizer.TOKEN_REGEX) {
            val = new RegExp(tok.value.body, tok.value.flags);
        }

        if (val !== undefined) {
            node = new Node.Literal(tok.lineno, tok.colno, val);
        } else if (tok.type === Tokenizer.TOKEN_SYMBOL) {
            node = new Node.SymbolNode(tok.lineno, tok.colno, tok.value);
        } else {
            // See if it's an aggregate type, we need to push the
            // Current delimiter token back on
            this.pushToken(tok);
            node = this.parseAggregate();
        }

        if (!noPostfix) {
            node = this.parsePostfix(node);
        }

        if (node) {
            return node;
        }

        throw this.fail(`unexpected token: ${tok.value}`, tok.lineno, tok.colno);
    }

    parseFilterName() {
        const tok = this.expect(Tokenizer.TOKEN_SYMBOL);
        let name = tok.value;

        while (this.skipValue(Tokenizer.TOKEN_OPERATOR, '.')) {
            name += '.' + this.expect(Tokenizer.TOKEN_SYMBOL).value;
        }

        return new Node.SymbolNode(tok.lineno, tok.colno, name);
    }

    parseFilterArgs(node) {
        if (this.peekToken().type === Tokenizer.TOKEN_LEFT_PAREN) {
            // Get a FunCall node and add the parameters to the
            // Filter
            const call = this.parsePostfix(node);
            return call.args.children;
        }

        return [];
    }

    parseFilter(node) {
        while (this.skip(Tokenizer.TOKEN_PIPE)) {
            const name = this.parseFilterName();

            node = new Node.Filter(
                name.lineno,
                name.colno,
                name,
                new Node.NodeList(
                    name.lineno,
                    name.colno,
                    [ node ].concat(this.parseFilterArgs(node))
                )
            );
        }

        return node;
    }

    parseFilterStatement() {
        const filterTok = this.peekToken();
        if (! this.skipSymbol('filter')) {
            this.fail('parseFilterStatement: expected filter');
        }

        const name = this.parseFilterName();
        const args = this.parseFilterArgs(name);

        this.advanceAfterBlockEnd(filterTok.value);
        const body = new Node.Capture(
            name.lineno,
            name.colno,
            this.parseUntilBlocks('endfilter')
        );
        this.advanceAfterBlockEnd();

        const node = new Node.Filter(
            name.lineno,
            name.colno,
            name,
            new Node.NodeList(
                name.lineno,
                name.colno,
                [ body ].concat(args)
            )
        );

        return new Node.Output(
            name.lineno,
            name.colno,
            [ node ]
        );
    }

    parseAggregate() {
        const tok = this.nextToken();
        let node;

        switch (tok.type) {
            case Tokenizer.TOKEN_LEFT_PAREN:
                node = new Node.Group(tok.lineno, tok.colno);
                break;
            case Tokenizer.TOKEN_LEFT_BRACKET:
                node = new Node.Array(tok.lineno, tok.colno);
                break;
            case Tokenizer.TOKEN_LEFT_CURLY:
                node = new Node.Dict(tok.lineno, tok.colno);
                break;
            default:
                return null;
        }

        while (1) { // eslint-disable-line no-constant-condition
            const type = this.peekToken().type;
            if (type === Tokenizer.TOKEN_RIGHT_PAREN ||
                type === Tokenizer.TOKEN_RIGHT_BRACKET ||
                type === Tokenizer.TOKEN_RIGHT_CURLY) {
                this.nextToken();
                break;
            }

            if (0 < node.children.length) {
                if (! this.skip(Tokenizer.TOKEN_COMMA)) {
                    this.fail('parseAggregate: expected comma after expression', tok.lineno, tok.colno);
                }
            }

            if (node instanceof Node.Dict) {
                // TODO: check for errors
                const key = this.parsePrimary();

                // We expect a key/value pair for dicts, separated by a
                // Colon
                if (! this.skip(Tokenizer.TOKEN_COLON)) {
                    this.fail('parseAggregate: expected colon after dict key', tok.lineno, tok.colno);
                }

                // TODO: check for errors
                const value = this.parseExpression();
                node.addChild(new Node.Pair(key.lineno,
                    key.colno,
                    key,
                    value));
            } else {
                // TODO: check for errors
                const expr = this.parseExpression();
                node.addChild(expr);
            }
        }

        return node;
    }

    parseSignature(tolerant, noParens) {
        let tok = this.peekToken();
        if (!noParens && tok.type !== Tokenizer.TOKEN_LEFT_PAREN) {
            if (tolerant) {
                return null;
            }

            this.fail('expected arguments', tok.lineno, tok.colno);
        }

        if (tok.type === Tokenizer.TOKEN_LEFT_PAREN) {
            tok = this.nextToken();
        }

        const args = new Node.NodeList(tok.lineno, tok.colno);
        const kwargs = new Node.KeywordArgs(tok.lineno, tok.colno);
        let checkComma = false;

        while (1) { // eslint-disable-line no-constant-condition
            tok = this.peekToken();
            if (!noParens && tok.type === Tokenizer.TOKEN_RIGHT_PAREN) {
                this.nextToken();
                break;
            } else if (noParens && tok.type === Tokenizer.TOKEN_BLOCK_END) {
                break;
            }

            if (checkComma && !this.skip(Tokenizer.TOKEN_COMMA)) {
                this.fail('parseSignature: expected comma after expression', tok.lineno, tok.colno);
            } else {
                const arg = this.parseExpression();

                if (this.skipValue(Tokenizer.TOKEN_OPERATOR, '=')) {
                    kwargs.addChild(new Node.Pair(arg.lineno, arg.colno, arg, this.parseExpression()));
                } else {
                    args.addChild(arg);
                }
            }

            checkComma = true;
        }

        if (kwargs.children.length) {
            args.addChild(kwargs);
        }

        return args;
    }

    parseUntilBlocks(...blockNames) {
        const prev = this.breakOnBlocks;
        this.breakOnBlocks = blockNames;

        const ret = this.parse();

        this.breakOnBlocks = prev;
        return ret;
    }

    parseNodes() {
        let tok;
        const buf = [];

        while ((tok = this.nextToken())) {
            if (tok.type === Tokenizer.TOKEN_DATA) {
                let data = tok.value;
                const nextToken = this.peekToken();
                const nextVal = nextToken && nextToken.value;

                // If the last token has "-" we need to trim the
                // Leading whitespace of the data. This is marked with
                // The `dropLeadingWhitespace` variable.
                if (this.dropLeadingWhitespace) {
                    // TODO: this could be optimized (don't use regex)
                    data = data.replace(/^\s*/, '');
                    this.dropLeadingWhitespace = false;
                }

                // Same for the succeeding block start token
                if (nextToken &&
                  ((nextToken.type === Tokenizer.TOKEN_BLOCK_START &&
                  '-' === nextVal.charAt(nextVal.length - 1)) ||
                  (nextToken.type === Tokenizer.TOKEN_VARIABLE_START &&
                  '-'
                  === nextVal.charAt(this.tokens.tags.VARIABLE_START.length)) ||
                  (nextToken.type === Tokenizer.TOKEN_COMMENT &&
                  '-'
                  === nextVal.charAt(this.tokens.tags.COMMENT_START.length)))) {
                    // TODO: this could be optimized (don't use regex)
                    data = data.replace(/\s*$/, '');
                }

                buf.push(new Node.Output(tok.lineno,
                    tok.colno,
                    [ new Node.TemplateData(tok.lineno,
                        tok.colno,
                        data) ]));
            } else if (tok.type === Tokenizer.TOKEN_BLOCK_START) {
                this.dropLeadingWhitespace = false;
                const n = this.parseStatement();
                if (! n) {
                    break;
                }

                buf.push(n);
            } else if (tok.type === Tokenizer.TOKEN_VARIABLE_START) {
                const e = this.parseExpression();
                this.dropLeadingWhitespace = false;
                this.advanceAfterVariableEnd();
                buf.push(new Node.Output(tok.lineno, tok.colno, [ e ]));
            } else if (tok.type === Tokenizer.TOKEN_COMMENT) {
                this.dropLeadingWhitespace = '-' === tok.value.charAt(
                    tok.value.length - this.tokens.tags.COMMENT_END.length - 1
                );
            } else {
                // Ignore comments, otherwise this should be an error
                this.fail('Unexpected token at top-level: ' + tok.type, tok.lineno, tok.colno);
            }
        }

        return buf;
    }

    parse() {
        return new Node.NodeList(0, 0, this.parseNodes());
    }

    parseAsRoot() {
        return new Node.Root(0, 0, this.parseNodes());
    }

    static parse(src, extensions, opts) {
        const p = new __self(new Tokenizer(src, opts));
        if (extensions !== undefined) {
            p.extensions = extensions;
        }

        return p.parseAsRoot();
    }
}

module.exports = Parser;
