const Tokenizer = Kumis.Compiler.Tokenizer;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;
function _hasTokens(ws, tokens, types) {
    let i;
    let type;
    let tok;
    for (i = 0; i < types.length; i++) {
        type = types[i];
        tok = tokens.nextToken();

        if (!ws) {
            while (tok && tok.type === Tokenizer.TOKEN_WHITESPACE) {
                tok = tokens.nextToken();
            }
        }

        if (isArray(type)) {
            TestCase.assertSame(type[0], tok.type);
            TestCase.assertSame(type[1], tok.value);
        } else if (isObjectLiteral(type)) {
            TestCase.assertSame(type.type, tok.type);
            if (null != type.value) {
                TestCase.assertSame(type.value, tok.value);
            }
            if (null != type.lineno) {
                TestCase.assertSame(type.lineno, tok.lineno);
            }
            if (null != type.colno) {
                TestCase.assertSame(type.colno, tok.colno);
            }
        } else {
            TestCase.assertSame(type, tok.type);
        }
    }
}

function hasTokens(tokens, ...types) {
    return _hasTokens(false, tokens, types);
}

function hasTokensWithWS(tokens, ...types) {
    return _hasTokens(true, tokens, types);
}

let tok;
let tmpl;
let tokens;

export default class TokenizerTest extends TestCase {


    testShouldParseTemplateData() {
        tok = new Tokenizer('3').nextToken();
        __self.assertEquals(Tokenizer.TOKEN_DATA, tok.type);
        __self.assertEquals('3', tok.value);

        const tmpl = 'foo bar bizzle 3 [1,2] !@#$%^&*()<>?:"{}|';
        tok = new Tokenizer(tmpl).nextToken();
        __self.assertEquals(Tokenizer.TOKEN_DATA, tok.type);
        __self.assertEquals(tmpl, tok.value);
    }


    testShouldKeepTrackOfWhitespace() {
        tokens = new Tokenizer('data {% 1 2\n   3  %} data');
        hasTokensWithWS(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_BLOCK_START,
            [ Tokenizer.TOKEN_WHITESPACE, ' ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, ' ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, '\n   ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, '  ' ],
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldTrimBlocks() {
        tokens = new Tokenizer('  {% if true %}\n    foo\n  {% endif %}\n', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '    foo\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldTrimWindowsStyleCRLFLineEndingsAfterBlocks() {
        tokens = new Tokenizer('  {% if true %}\r\n    foo\r\n  {% endif %}\r\n', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '    foo\r\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldNotTrimCRAfterBlocks() {
        tokens = new Tokenizer('  {% if true %}\r    foo\r\n  {% endif %}\r', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '\r    foo\r\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '\r' ]);
    }


    testShouldLstripAndTrimBlocks() {
        tokens = new Tokenizer('test\n {% if true %}\n  foo\n {% endif %}\n</div>', {
            lstripBlocks: true,
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, 'test\n' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '  foo\n' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '</div>' ]);
    }


    testShouldLstripAndNotCollapseWhitespaceBetweenBlocks() {
        tokens = new Tokenizer('   {% t %} {% t %}', {
            lstripBlocks: true,
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, ' ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }



    testShouldParseVariableStartAndEnd() {
        tokens = new Tokenizer('data {{ foo }} bar bizzle');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldTreatTheNonBreakingSpaceAsValidWhitespace() {
        tokens = new Tokenizer('{{\u00A0foo }}');
        tok = tokens.nextToken();
        tok = tokens.nextToken();
        tok = tokens.nextToken();
        __self.assertEquals(Tokenizer.TOKEN_SYMBOL, tok.type);
        __self.assertEquals('foo', tok.value);
    }


    testShouldParseBlockStartAndEnd() {
        tokens = new Tokenizer('data {% foo %} bar bizzle');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldParseBasicTypes() {
        tokens = new Tokenizer('{{ 3 4.5 true false none foo "hello" \'boo\' r/regex/ }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_FLOAT,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_NONE,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_STRING,
            Tokenizer.TOKEN_STRING,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseFunctionCalls() {
        tokens = new Tokenizer('{{ foo(bar) }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'foo' ],
            Tokenizer.TOKEN_LEFT_PAREN,
            [ Tokenizer.TOKEN_SYMBOL, 'bar' ],
            Tokenizer.TOKEN_RIGHT_PAREN,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseGroups() {
        tokens = new Tokenizer('{{ (1, 2, 3) }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_PAREN,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_RIGHT_PAREN,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseArrays() {
        tokens = new Tokenizer('{{ [1, 2, 3] }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_BRACKET,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_RIGHT_BRACKET,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseDicts() {
        tokens = new Tokenizer('{{ {one:1, "two":2} }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_CURLY,
            [ Tokenizer.TOKEN_SYMBOL, 'one' ],
            Tokenizer.TOKEN_COLON,
            [ Tokenizer.TOKEN_INT, '1' ],
            Tokenizer.TOKEN_COMMA,
            [ Tokenizer.TOKEN_STRING, 'two' ],
            Tokenizer.TOKEN_COLON,
            [ Tokenizer.TOKEN_INT, '2' ],
            Tokenizer.TOKEN_RIGHT_CURLY,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseBlocksWithoutWhitespace() {
        tokens = new Tokenizer('data{{hello}}{%if%}data');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'hello' ],
            Tokenizer.TOKEN_VARIABLE_END,
            Tokenizer.TOKEN_BLOCK_START,
            [ Tokenizer.TOKEN_SYMBOL, 'if' ],
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldParseFilters() {
        hasTokens(new Tokenizer('{{ foo|bar }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'foo' ],
            Tokenizer.TOKEN_PIPE,
            [ Tokenizer.TOKEN_SYMBOL, 'bar' ],
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseOperators() {
        hasTokens(new Tokenizer('{{ 3+3-3*3/3 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);

        hasTokens(new Tokenizer('{{ 3**4//5 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);

        hasTokens(new Tokenizer('{{ 3 != 4 == 5 <= 6 >= 7 < 8 > 9 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseComments() {
        tokens = new Tokenizer('data data {# comment #} data');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_COMMENT,
            Tokenizer.TOKEN_DATA);
    }


    testShouldAllowChangingTheVariableStartAndEnd() {
        tokens = new Tokenizer('data {= var =}', {
            tags: {
                variableStart: '{=',
                variableEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldAllowChangingTheBlockStartAndEnd() {
        tokens = new Tokenizer('{= =}', {
            tags: {
                blockStart: '{=',
                blockEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldAllowChangingTheVariableStartAndEnd() {
        tokens = new Tokenizer('data {= var =}', {
            tags: {
                variableStart: '{=',
                variableEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldAllowChangingTheCommentStartAndEnd() {
        tokens = new Tokenizer('<!-- A comment! -->', {
            tags: {
                commentStart: '<!--',
                commentEnd: '-->',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_COMMENT);
    }


    testShouldHaveIndividualTokenizerTagSettingsForEachEnvironment() {
        tokens = new Tokenizer('{=', {
            tags: {
                variableStart: '{=',
            },
        });
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);

        tokens = new Tokenizer('{{');
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);

        tokens = new Tokenizer('{{', {
            tags: {
                variableStart: '<<<',
            },
        });
        hasTokens(tokens, Tokenizer.TOKEN_DATA);

        tokens = new Tokenizer('{{');
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);
    }


    testShouldParseRegularExpressions() {
        tokens = new Tokenizer('{{ r/basic regex [a-z]/ }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // A more complex regex with escaped slashes.
        tokens = new Tokenizer('{{ r/{a*b} \\/regex! [0-9]\\// }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // This one has flags.
        tokens = new Tokenizer('{{ r/^x/gim }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // This one has a valid flag then an invalid flag.
        tokens = new Tokenizer('{{ r/x$/iv }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldKeepTrackOfTokenPositions() {
        hasTokens(new Tokenizer('{{ 3 != 4 == 5 <= 6 >= 7 < 8 > 9 }}'),
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '3',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '!=',
                lineno: 0,
                colno: 5,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '4',
                lineno: 0,
                colno: 8,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '==',
                lineno: 0,
                colno: 10,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '5',
                lineno: 0,
                colno: 13,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '<=',
                lineno: 0,
                colno: 15,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '6',
                lineno: 0,
                colno: 18,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                lineno: 0,
                colno: 20,
                value: '>=',
            },
            {
                type: Tokenizer.TOKEN_INT,
                lineno: 0,
                colno: 23,
                value: '7',
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '<',
                lineno: 0,
                colno: 25,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '8',
                lineno: 0,
                colno: 27,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '>',
                lineno: 0,
                colno: 29,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '9',
                lineno: 0,
                colno: 31,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 33,
            });

        hasTokens(new Tokenizer('{% if something %}{{ value }}{% else %}{{ otherValue }}{% endif %}'),
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'if',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'something',
                lineno: 0,
                colno: 6,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 16,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 18,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'value',
                lineno: 0,
                colno: 21,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 27,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 29,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'else',
                lineno: 0,
                colno: 32,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 37,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 39,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'otherValue',
                lineno: 0,
                colno: 42,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 53,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 55,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'endif',
                lineno: 0,
                colno: 58,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 64,
            });

        hasTokens(new Tokenizer('{% if something %}\n{{ value }}\n{% else %}\n{{ otherValue }}\n{% endif %}'),
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'if',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'something',
                lineno: 0,
                colno: 6,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 16,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 1,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'value',
                lineno: 1,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 1,
                colno: 9,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 2,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'else',
                lineno: 2,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 2,
                colno: 8,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 3,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'otherValue',
                lineno: 3,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 3,
                colno: 14,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 4,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'endif',
                lineno: 4,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 4,
                colno: 9,
            });
    }
}    testShouldAllowChangingTheVariableStartAndEndWithCustomTags() {mis.Compiler.Tokenizer;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;
function _hasTokens(ws, tokens, types) {
    let i;
    let type;
    let tok;
    for (i = 0; i < types.length; i++) {
        type = types[i];
        tok = tokens.nextToken();

        if (!ws) {
            while (tok && tok.type === Tokenizer.TOKEN_WHITESPACE) {
                tok = tokens.nextToken();
            }
        }

        if (isArray(type)) {
            __self.assertEquals(type[0], tok.type);
            __self.assertEquals(type[1], tok.value);
        } else if (isObjectLiteral(type)) {
            __self.assertEquals(type.type, tok.type);
            if (null != type.value) {
                __self.assertEquals(type.value, tok.value);
            }
            if (null != type.lineno) {
                __self.assertEquals(type.lineno, tok.lineno);
            }
            if (null != type.colno) {
                __self.assertEquals(type.colno, tok.colno);
            }
        } else {
            __self.assertEquals(type, tok.type);
        }
    }
}

function hasTokens(tokens, ...types) {
    return _hasTokens(false, tokens, types);
}

function hasTokensWithWS(tokens, ...types) {
    return _hasTokens(true, tokens, types);
}

export default class TokenizerTest extends TestCase {


    testShouldParseTemplateData() {
        tok = new Tokenizer('3').nextToken();
        __self.assertEquals(Tokenizer.TOKEN_DATA, tok.type);
        __self.assertEquals('3', tok.value);

        const tmpl = 'foo bar bizzle 3 [1,2] !@#$%^&*()<>?:"{}|';
        tok = new Tokenizer(tmpl).nextToken();
        __self.assertEquals(Tokenizer.TOKEN_DATA, tok.type);
        __self.assertEquals(tmpl, tok.value);
    }


    testShouldKeepTrackOfWhitespace() {
        tokens = new Tokenizer('data {% 1 2\n   3  %} data');
        hasTokensWithWS(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_BLOCK_START,
            [ Tokenizer.TOKEN_WHITESPACE, ' ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, ' ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, '\n   ' ],
            Tokenizer.TOKEN_INT,
            [ Tokenizer.TOKEN_WHITESPACE, '  ' ],
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldTrimBlocks() {
        tokens = new Tokenizer('  {% if true %}\n    foo\n  {% endif %}\n', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '    foo\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldTrimWindowsStyleCRLFLineEndingsAfterBlocks() {
        tokens = new Tokenizer('  {% if true %}\r\n    foo\r\n  {% endif %}\r\n', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '    foo\r\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldNotTrimCRAfterBlocks() {
        tokens = new Tokenizer('  {% if true %}\r    foo\r\n  {% endif %}\r', {
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, '  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '\r    foo\r\n  ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '\r' ]);
    }


    testShouldLstripAndTrimBlocks() {
        tokens = new Tokenizer('test\n {% if true %}\n  foo\n {% endif %}\n</div>', {
            lstripBlocks: true,
            trimBlocks: true,
        });
        hasTokens(tokens,
            [ Tokenizer.TOKEN_DATA, 'test\n' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '  foo\n' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, '</div>' ]);
    }


    testShouldLstripAndNotCollapseWhitespaceBetweenBlocks() {
        tokens = new Tokenizer('   {% t %} {% t %}', {
            lstripBlocks: true,
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            [ Tokenizer.TOKEN_DATA, ' ' ],
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END);
    }



    testShouldParseVariableStartAndEnd() {
        tokens = new Tokenizer('data {{ foo }} bar bizzle');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldTreatTheNonBreakingSpaceAsValidWhitespace() {
        tokens = new Tokenizer('{{\u00A0foo }}');
        tok = tokens.nextToken();
        tok = tokens.nextToken();
        tok = tokens.nextToken();
        __self.assertEquals(Tokenizer.TOKEN_SYMBOL, tok.type);
        __self.assertEquals('foo', tok.value);
    }


    testShouldParseBlockStartAndEnd() {
        tokens = new Tokenizer('data {% foo %} bar bizzle');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldParseBasicTypes() {
        tokens = new Tokenizer('{{ 3 4.5 true false none foo "hello" \'boo\' r/regex/ }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_FLOAT,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_BOOLEAN,
            Tokenizer.TOKEN_NONE,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_STRING,
            Tokenizer.TOKEN_STRING,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseFunctionCalls() {
        tokens = new Tokenizer('{{ foo(bar) }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'foo' ],
            Tokenizer.TOKEN_LEFT_PAREN,
            [ Tokenizer.TOKEN_SYMBOL, 'bar' ],
            Tokenizer.TOKEN_RIGHT_PAREN,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseGroups() {
        tokens = new Tokenizer('{{ (1, 2, 3) }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_PAREN,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_RIGHT_PAREN,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseArrays() {
        tokens = new Tokenizer('{{ [1, 2, 3] }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_BRACKET,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_COMMA,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_RIGHT_BRACKET,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseDicts() {
        tokens = new Tokenizer('{{ {one:1, "two":2} }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_LEFT_CURLY,
            [ Tokenizer.TOKEN_SYMBOL, 'one' ],
            Tokenizer.TOKEN_COLON,
            [ Tokenizer.TOKEN_INT, '1' ],
            Tokenizer.TOKEN_COMMA,
            [ Tokenizer.TOKEN_STRING, 'two' ],
            Tokenizer.TOKEN_COLON,
            [ Tokenizer.TOKEN_INT, '2' ],
            Tokenizer.TOKEN_RIGHT_CURLY,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseBlocksWithoutWhitespace() {
        tokens = new Tokenizer('data{{hello}}{%if%}data');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'hello' ],
            Tokenizer.TOKEN_VARIABLE_END,
            Tokenizer.TOKEN_BLOCK_START,
            [ Tokenizer.TOKEN_SYMBOL, 'if' ],
            Tokenizer.TOKEN_BLOCK_END,
            Tokenizer.TOKEN_DATA);
    }


    testShouldParseFilters() {
        hasTokens(new Tokenizer('{{ foo|bar }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            [ Tokenizer.TOKEN_SYMBOL, 'foo' ],
            Tokenizer.TOKEN_PIPE,
            [ Tokenizer.TOKEN_SYMBOL, 'bar' ],
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseOperators() {
        hasTokens(new Tokenizer('{{ 3+3-3*3/3 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);

        hasTokens(new Tokenizer('{{ 3**4//5 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);

        hasTokens(new Tokenizer('{{ 3 != 4 == 5 <= 6 >= 7 < 8 > 9 }}'),
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_OPERATOR,
            Tokenizer.TOKEN_INT,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldParseComments() {
        tokens = new Tokenizer('data data {# comment #} data');
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_COMMENT,
            Tokenizer.TOKEN_DATA);
    }


    testShouldAllowChangingTheVariableStartAndEnd() {
        tokens = new Tokenizer('data {= var =}', {
            tags: {
                variableStart: '{=',
                variableEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldAllowChangingTheBlockStartAndEnd() {
        tokens = new Tokenizer('{= =}', {
            tags: {
                blockStart: '{=',
                blockEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_BLOCK_START,
            Tokenizer.TOKEN_BLOCK_END);
    }


    testShouldAllowChangingTheVariableStartAndEnd() {
        tokens = new Tokenizer('data {= var =}', {
            tags: {
                variableStart: '{=',
                variableEnd: '=}',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_DATA,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldAllowChangingTheCommentStartAndEnd() {
        tokens = new Tokenizer('<!-- A comment! -->', {
            tags: {
                commentStart: '<!--',
                commentEnd: '-->',
            },
        });
        hasTokens(tokens,
            Tokenizer.TOKEN_COMMENT);
    }


    testShouldHaveIndividualTokenizerTagSettingsForEachEnvironment() {
        tokens = new Tokenizer('{=', {
            tags: {
                variableStart: '{=',
            },
        });
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);

        tokens = new Tokenizer('{{');
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);

        tokens = new Tokenizer('{{', {
            tags: {
                variableStart: '<<<',
            },
        });
        hasTokens(tokens, Tokenizer.TOKEN_DATA);

        tokens = new Tokenizer('{{');
        hasTokens(tokens, Tokenizer.TOKEN_VARIABLE_START);
    }


    testShouldParseRegularExpressions() {
        tokens = new Tokenizer('{{ r/basic regex [a-z]/ }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // A more complex regex with escaped slashes.
        tokens = new Tokenizer('{{ r/{a*b} \\/regex! [0-9]\\// }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // This one has flags.
        tokens = new Tokenizer('{{ r/^x/gim }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_VARIABLE_END);

        // This one has a valid flag then an invalid flag.
        tokens = new Tokenizer('{{ r/x$/iv }}');
        hasTokens(tokens,
            Tokenizer.TOKEN_VARIABLE_START,
            Tokenizer.TOKEN_REGEX,
            Tokenizer.TOKEN_SYMBOL,
            Tokenizer.TOKEN_VARIABLE_END);
    }


    testShouldKeepTrackOfTokenPositions() {
        hasTokens(new Tokenizer('{{ 3 != 4 == 5 <= 6 >= 7 < 8 > 9 }}'),
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '3',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '!=',
                lineno: 0,
                colno: 5,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '4',
                lineno: 0,
                colno: 8,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '==',
                lineno: 0,
                colno: 10,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '5',
                lineno: 0,
                colno: 13,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '<=',
                lineno: 0,
                colno: 15,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '6',
                lineno: 0,
                colno: 18,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                lineno: 0,
                colno: 20,
                value: '>=',
            },
            {
                type: Tokenizer.TOKEN_INT,
                lineno: 0,
                colno: 23,
                value: '7',
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '<',
                lineno: 0,
                colno: 25,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '8',
                lineno: 0,
                colno: 27,
            },
            {
                type: Tokenizer.TOKEN_OPERATOR,
                value: '>',
                lineno: 0,
                colno: 29,
            },
            {
                type: Tokenizer.TOKEN_INT,
                value: '9',
                lineno: 0,
                colno: 31,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 33,
            });

        hasTokens(new Tokenizer('{% if something %}{{ value }}{% else %}{{ otherValue }}{% endif %}'),
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'if',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'something',
                lineno: 0,
                colno: 6,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 16,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 18,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'value',
                lineno: 0,
                colno: 21,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 27,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 29,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'else',
                lineno: 0,
                colno: 32,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 37,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 0,
                colno: 39,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'otherValue',
                lineno: 0,
                colno: 42,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 0,
                colno: 53,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 55,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'endif',
                lineno: 0,
                colno: 58,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 64,
            });

        hasTokens(new Tokenizer('{% if something %}\n{{ value }}\n{% else %}\n{{ otherValue }}\n{% endif %}'),
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 0,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'if',
                lineno: 0,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'something',
                lineno: 0,
                colno: 6,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 0,
                colno: 16,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 1,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'value',
                lineno: 1,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 1,
                colno: 9,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 2,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'else',
                lineno: 2,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 2,
                colno: 8,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_START,
                lineno: 3,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'otherValue',
                lineno: 3,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_VARIABLE_END,
                lineno: 3,
                colno: 14,
            },
            {
                type: Tokenizer.TOKEN_DATA,
                value: '\n',
            },
            {
                type: Tokenizer.TOKEN_BLOCK_START,
                lineno: 4,
                colno: 0,
            },
            {
                type: Tokenizer.TOKEN_SYMBOL,
                value: 'endif',
                lineno: 4,
                colno: 3,
            },
            {
                type: Tokenizer.TOKEN_BLOCK_END,
                lineno: 4,
                colno: 9,
            });
    }
}
