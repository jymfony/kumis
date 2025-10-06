import chai from 'chai';

const { expect } = chai;

const Parser = Kumis.Compiler.Parser;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const TagInterface = Kumis.Extension.TagInterface;
const Node = Kumis.Node;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

chai.Assertion.addProperty('dump', function () {
    const obj = this._obj;

    return {
        as: (expected) => {
            const actualDump = obj && 'function' === typeof obj.dump ? obj.dump() : obj;
            const expectedDump = expected && 'function' === typeof expected.dump ? expected.dump() : expected;

            new chai.Assertion(actualDump).to.deep.equal(expectedDump);
        },
    };
});

export default class ParserTest extends TestCase {

    testShouldParseBasicTypes() {
        expect(Parser.parse('{{ 1 }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 1) ]) ]));

        expect(Parser.parse('{{ 4.567 }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 4.567) ]) ]));

        expect(Parser.parse('{{ "foo" }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 'foo') ]) ]));

        expect(Parser.parse('{{ \'foo\' }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 'foo') ]) ]));

        expect(Parser.parse('{{ true }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, true) ]) ]));

        expect(Parser.parse('{{ false }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, false) ]) ]));

        expect(Parser.parse('{{ none }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, null) ]) ]));

        expect(Parser.parse('{{ foo }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.SymbolNode(0, 3, 'foo') ]) ]));

        expect(Parser.parse('{{ r/23/gi }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, /23/gi) ]) ]));
    }


    testShouldParseAggregateTypes() {
        expect(Parser.parse('{{ [1,2,3] }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Array(0, 3, [
                    new Node.Literal(0, 4, 1),
                    new Node.Literal(0, 6, 2),
                    new Node.Literal(0, 8, 3),
                ]),
            ]) ]));

        expect(Parser.parse('{{ (1,2,3) }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Group(0, 3, [
                    new Node.Literal(0, 4, 1),
                    new Node.Literal(0, 6, 2),
                    new Node.Literal(0, 8, 3),
                ]),
            ]) ]));

        expect(Parser.parse('{{ {foo: 1, \'two\': 2} }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Dict(0, 3, [
                    new Node.Pair(0, 4, new Node.SymbolNode(0, 4, 'foo'), new Node.Literal(0, 9, 1)),
                    new Node.Pair(0, 12, new Node.Literal(0, 12, 'two'), new Node.Literal(0, 19, 2)),
                ]),
            ]) ]));
    }


    testShouldParseVariables() {
        expect(Parser.parse('hello {{ foo }}, how are you'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello ') ]),
                new Node.Output(0, 6, [ new Node.SymbolNode(0, 9, 'foo') ]),
                new Node.Output(0, 15, [ new Node.TemplateData(0, 15, ', how are you') ]),
            ]));
    }


    testShouldParseOperators() {
        expect(Parser.parse('{{ x == y }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Compare(0, 5,
                    new Node.SymbolNode(0, 3, 'x'),
                    [ new Node.CompareOperand(0, 5, new Node.SymbolNode(0, 8, 'y'), '==') ]
                ),
            ]) ]));

        expect(Parser.parse('{{ x or y }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'y')
                ),
            ]) ]));

        expect(Parser.parse('{{ x in y }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.In(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'y')
                ),
            ]) ]));

        expect(Parser.parse('{{ x not in y }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Not(0, 3,
                    new Node.In(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 12, 'y')
                    )
                ),
            ]) ]));

        expect(Parser.parse('{{ x is callable }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Is(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'callable')
                ),
            ]) ]));

        expect(Parser.parse('{{ x is not callable }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Not(0, 3,
                    new Node.Is(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 12, 'callable')
                    )
                ),
            ]) ]));
    }


    testShouldParseTilde() {
        expect(Parser.parse('{{ 2 ~ 3 }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Concat(0, 3,
                    new Node.Literal(0, 3, 2),
                    new Node.Literal(0, 7, 3)
                ),
            ]) ]));
    }


    testShouldParseOperatorsWithCorrectPrecedence() {
        expect(Parser.parse('{{ x in y and z }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.And(0, 3,
                    new Node.In(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 8, 'y')
                    ),
                    new Node.SymbolNode(0, 14, 'z')
                ),
            ]) ]));

        expect(Parser.parse('{{ x not in y or z }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.Not(0, 3,
                        new Node.In(0, 3,
                            new Node.SymbolNode(0, 3, 'x'),
                            new Node.SymbolNode(0, 12, 'y')
                        ),
                    ),
                    new Node.SymbolNode(0, 17, 'z')
                ),
            ]) ]));

        expect(Parser.parse('{{ x or y and z }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.And(0, 8,
                        new Node.SymbolNode(0, 8, 'y'),
                        new Node.SymbolNode(0, 14, 'z')
                    ),
                ),
            ]) ]));
    }


    testShouldParseBlocks() {
        let n = Parser.parse('want some {% if hungry %}pizza{% else %}water{% endif %}?');
        expect(n.children[1].typename).to.be.equal('If');

        n = Parser.parse('{% block foo %}stuff{% endblock %}');
        expect(n.children[0].typename).to.be.equal('Block');

        n = Parser.parse('{% block foo %}stuff{% endblock foo %}');
        expect(n.children[0].typename).to.be.equal('Block');

        n = Parser.parse('{% extends "test.kumis" %}stuff');
        expect(n.children[0].typename).to.be.equal('Extends');

        n = Parser.parse('{% include "test.kumis" %}');
        expect(n.children[0].typename).to.be.equal('Include');
    }


    testShouldAcceptAttributesAndMethodsOfStaticArraysObjectsAndPrimitives() {
        expect(function() {
            Parser.parse('{{ ([1, 2, 3]).indexOf(1) }}');
        }).to.not.throw();

        expect(function() {
            Parser.parse('{{ [1, 2, 3].length }}');
        }).to.not.throw();

        expect(function() {
            Parser.parse('{{ "Some String".replace("S", "$") }}');
        }).to.not.throw();

        expect(function() {
            Parser.parse('{{ ({ name : "Khalid" }).name }}');
        }).to.not.throw();

        expect(function() {
            Parser.parse('{{ 1.618.toFixed(2) }}');
        }).to.not.throw();
    }


    testShouldParseIncludeTags() {
        let n = Parser.parse('{% include "test.kumis" %}');
        expect(n.children[0].typename).to.be.equal('Include');

        n = Parser.parse('{% include "test.html"|replace("html","j2") %}');
        expect(n.children[0].typename).to.be.equal('Include');

        n = Parser.parse('{% include ""|default("test.kumis") %}');
        expect(n.children[0].typename).to.be.equal('Include');
    }


    testShouldParseForLoops() {
        expect(Parser.parse('{% for x in [1, 2] %}{{ x }}{% endfor %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.For(0, 3,
                    new Node.Array(0, 12, [
                        new Node.Literal(0, 13, 1),
                        new Node.Literal(0, 16, 2),
                    ]),
                    new Node.SymbolNode(0, 7, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 21, [
                            new Node.SymbolNode(0, 24, 'x'),
                        ]),
                    ])
                ),
            ]));
    }


    testShouldParseForLoopsWithElse() {
        expect(Parser.parse('{% for x in [] %}{{ x }}{% else %}empty{% endfor %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.For(0, 3,
                    new Node.Array(0, 12),
                    new Node.SymbolNode(0, 7, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 17, [
                            new Node.SymbolNode(0, 20, 'x'),
                        ]),
                    ]),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 34, [
                            new Node.TemplateData(0, 34, 'empty'),
                        ]),
                    ])
                ),
            ]));
    }


    testShouldParseFilters() {
        expect(Parser.parse('{{ foo | bar }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Filter(0, 9,
                    new Node.SymbolNode(0, 9, 'bar'),
                    new Node.NodeList(0, 9, [
                        new Node.SymbolNode(0, 3, 'foo'),
                    ])
                ),
            ]) ]));

        expect(Parser.parse('{{ foo | bar | baz }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Filter(0, 15,
                    new Node.SymbolNode(0, 15, 'baz'),
                    new Node.NodeList(0, 15, [
                        new Node.Filter(0, 9,
                            new Node.SymbolNode(0, 9, 'bar'),
                            new Node.NodeList(0, 9, [
                                new Node.SymbolNode(0, 3, 'foo'),
                            ])
                        ),
                    ])
                ),
            ]) ]));

        expect(Parser.parse('{{ foo | bar(3) }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Filter(0, 9,
                    new Node.SymbolNode(0, 9, 'bar'),
                    new Node.NodeList(0, 9, [
                        new Node.SymbolNode(0, 3, 'foo'),
                        new Node.Literal(0, 13, 3),
                    ])
                ),
            ]) ]));
    }


    testShouldParseMacroDefinitions() {
        const ast = Parser.parse('{% macro foo(bar, baz="foobar") %}' +
            'This is a macro' +
            '{% endmacro %}');

        expect(ast).dump.as(new Node.Root(0, 0, [
            new Node.Macro(0, 3,
                new Node.SymbolNode(0, 9, 'foo'),
                new Node.NodeList(0, 12, [
                    new Node.SymbolNode(0, 13, 'bar'),
                    new Node.KeywordArgs(0, 12,
                        [ new Node.Pair(0, 18, new Node.SymbolNode(0, 18, 'baz'), new Node.Literal(0, 22, 'foobar')) ]
                    ),
                ]),
                new Node.NodeList(0, 0,
                    [ new Node.Output(0, 34, [ new Node.TemplateData(0, 34, 'This is a macro') ]) ]
                )
            ),
        ]));
    }


    testShouldParseCallBlocks() {
        const ast = Parser.parse('{% call foo("bar") %}' +
            'This is the caller' +
            '{% endcall %}');

        const sym = new Node.SymbolNode(0, 3, 'caller');
        expect(ast).dump.as(new Node.Root(0, 0, [
            new Node.Output(0, 3, [
                new Node.FunCall(0, 11,
                    new Node.SymbolNode(0, 8, 'foo'),
                    new Node.NodeList(0, 11, [
                        new Node.Literal(0, 12, 'bar'),
                        new Node.KeywordArgs(undefined, undefined,
                            [ new Node.Pair(0, 3,
                                sym,
                                new Node.Caller(0, 3,
                                    sym,
                                    new Node.NodeList(undefined, undefined, []),
                                    new Node.NodeList(0, 0, [
                                        new Node.Output(0, 21, [ new Node.TemplateData(0, 21, 'This is the caller') ]),
                                    ]),
                                )) ]
                        ),
                    ])
                ),
            ]),
        ]));
    }


    testShouldParseCallBlocksWithArgs() {
        const ast = Parser.parse('{% call(i) foo("bar", baz="foobar") %}' +
            'This is {{ i }}' +
            '{% endcall %}');

        const sym = new Node.SymbolNode(0, 3, 'caller');
        expect(ast).dump.as(new Node.Root(0, 0, [
            new Node.Output(0, 3, [
                new Node.FunCall(0, 14,
                    new Node.SymbolNode(0, 11, 'foo'),
                    new Node.NodeList(0, 14, [
                        new Node.Literal(0, 15, 'bar'),
                        new Node.KeywordArgs(0, 14,
                            [
                                new Node.Pair(0, 22,
                                    new Node.SymbolNode(0, 22, 'baz'),
                                    new Node.Literal(0, 26, 'foobar')),
                                new Node.Pair(0, 3,
                                    sym,
                                    new Node.Caller(0, 3,
                                        sym,
                                        new Node.NodeList(0, 7, [ new Node.SymbolNode(0, 8, 'i') ]),
                                        new Node.NodeList(0, 0, [
                                            new Node.Output(0, 38, [ new Node.TemplateData(0, 38, 'This is ') ]),
                                            new Node.Output(0, 46, [ new Node.SymbolNode(0, 49, 'i') ]),
                                        ]),
                                    )),
                            ]
                        ),
                    ])
                ),
            ]),
        ]));
    }


    testShouldParseRaw() {
        expect(Parser.parse('{% raw %}hello {{ {% %} }}{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, 'hello {{ {% %} }}'),
            ]) ]));
    }


    testShouldParseRawWithBrokenVariables() {
        expect(Parser.parse('{% raw %}{{ x }}{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{{ x }}'),
            ]) ]));
    }


    testShouldParseRawWithBrokenBlocks() {
        expect(Parser.parse('{% raw %}{% if i_am_stupid }Still do your job well{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{% if i_am_stupid }Still do your job well'),
            ]) ]));
    }


    testShouldParseRawWithPureText() {
        expect(Parser.parse('{% raw %}abc{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, 'abc'),
            ]) ]));
    }



    testShouldParseRawWithRawBlocks() {
        expect(Parser.parse('{% raw %}{% raw %}{{ x }{% endraw %}{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{% raw %}{{ x }{% endraw %}'),
            ]) ]));
    }


    testShouldParseRawWithCommentBlocks() {
        expect(Parser.parse('{% raw %}{# test {% endraw %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{# test '),
            ]) ]));
    }


    testShouldParseMultipleRawBlocks() {
        expect(Parser.parse('{% raw %}{{ var }}{% endraw %}{{ var }}{% raw %}{{ var }}{% endraw %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 7, [ new Node.TemplateData(0, 7, '{{ var }}') ]),
                new Node.Output(0, 30, [ new Node.SymbolNode(0, 33, 'var') ]),
                new Node.Output(0, 46, [ new Node.TemplateData(0, 46, '{{ var }}') ]),
            ]));
    }


    testShouldParseMultilineMultipleRawBlocks() {
        expect(Parser.parse('\n{% raw %}{{ var }}{% endraw %}\n{{ var }}\n{% raw %}{{ var }}{% endraw %}\n'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, '\n') ]),
                new Node.Output(1, 7, [ new Node.TemplateData(1, 7, '{{ var }}') ]),
                new Node.Output(1, 30, [ new Node.TemplateData(1, 30, '\n') ]),
                new Node.Output(2, 0, [ new Node.SymbolNode(2, 3, 'var') ]),
                new Node.Output(2, 9, [ new Node.TemplateData(2, 9, '\n') ]),
                new Node.Output(3, 7, [ new Node.TemplateData(3, 7, '{{ var }}') ]),
                new Node.Output(3, 30, [ new Node.TemplateData(3, 30, '\n') ]),
            ]));
    }


    testShouldParseVerbatim() {
        expect(Parser.parse('{% verbatim %}hello {{ {% %} }}{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, 'hello {{ {% %} }}'),
            ]) ]));
    }


    testShouldParseVerbatimWithBrokenVariables() {
        expect(Parser.parse('{% verbatim %}{{ x }{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{{ x }'),
            ]) ]));
    }


    testShouldParseVerbatimWithBrokenBlocks() {
        expect(Parser.parse('{% verbatim %}{% if i_am_stupid }Still do your job well{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{% if i_am_stupid }Still do your job well'),
            ]) ]));
    }


    testShouldParseVerbatimWithPureText() {
        expect(Parser.parse('{% verbatim %}abc{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, 'abc'),
            ]) ]));
    }



    testShouldParseVerbatimWithVerbatimBlocks() {
        expect(Parser.parse('{% verbatim %}{% verbatim %}{{ x }{% endverbatim %}{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{% verbatim %}{{ x }{% endverbatim %}'),
            ]) ]));
    }


    testShouldParseVerbatimWithCommentBlocks() {
        expect(Parser.parse('{% verbatim %}{# test {% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{# test '),
            ]) ]));
    }


    testShouldParseMultipleVerbatimBlocks() {
        expect(Parser.parse('{% verbatim %}{{ var }}{% endverbatim %}{{ var }}{% verbatim %}{{ var }}{% endverbatim %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 12, [ new Node.TemplateData(0, 12, '{{ var }}') ]),
                new Node.Output(0, 40, [ new Node.SymbolNode(0, 43, 'var') ]),
                new Node.Output(0, 61, [ new Node.TemplateData(0, 61, '{{ var }}') ]),
            ]));
    }


    testShouldParseMultilineMultipleVerbatimBlocks() {
        expect(Parser.parse('\n{% verbatim %}{{ var }}{% endverbatim %}\n{{ var }}\n{% verbatim %}{{ var }}{% endverbatim %}\n'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, '\n') ]),
                new Node.Output(1, 12, [ new Node.TemplateData(1, 12, '{{ var }}') ]),
                new Node.Output(1, 40, [ new Node.TemplateData(1, 40, '\n') ]),
                new Node.Output(2, 0, [ new Node.SymbolNode(2, 3, 'var') ]),
                new Node.Output(2, 9, [ new Node.TemplateData(2, 9, '\n') ]),
                new Node.Output(3, 12, [ new Node.TemplateData(3, 12, '{{ var }}') ]),
                new Node.Output(3, 40, [ new Node.TemplateData(3, 40, '\n') ]),
            ]));
    }


    testShouldParseSwitchStatements() {
        const tpl = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
        expect(Parser.parse(tpl))
            .dump.as(new Node.Root(0, 0, [
                new Node.Switch(0, 3,
                    new Node.SymbolNode(0, 10, 'foo'),
                    [
                        new Node.Case(undefined, undefined,
                            new Node.Literal(0, 24, 'bar'),
                            new Node.NodeList(0, 0, [ new Node.Output(0, 32, [ new Node.TemplateData(0, 32, 'BAR') ]) ])
                        ),
                        new Node.Case(undefined, undefined,
                            new Node.Literal(0, 43, 'baz'),
                            new Node.NodeList(0, 0, [ new Node.Output(0, 51, [ new Node.TemplateData(0, 51, 'BAZ') ]) ])
                        ),
                    ],
                    new Node.NodeList(0, 0, [ new Node.Output(0, 67, [ new Node.TemplateData(0, 67, 'NEITHER FOO NOR BAR') ]) ])
                ),
            ]));
    }


    testShouldParseKeywordAndNonKeywordArguments() {
        expect(Parser.parse('{{ foo("bar", falalalala, baz="foobar") }}'))
            .dump.as(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.FunCall(0, 6,
                    new Node.SymbolNode(0, 3, 'foo'),
                    new Node.NodeList(0, 6, [
                        new Node.Literal(0, 7, 'bar'),
                        new Node.SymbolNode(0, 14, 'falalalala'),
                        new Node.KeywordArgs(0, 6, [
                            new Node.Pair(0, 26, new Node.SymbolNode(0, 26, 'baz'), new Node.Literal(0, 30, 'foobar')),
                        ]),
                    ])
                ),
            ]) ]));
    }


    testShouldParseImports() {
        expect(Parser.parse('{% import "foo/bar.kumis" as baz %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Import(0, 3,
                    new Node.Literal(0, 10, 'foo/bar.kumis'),
                    new Node.SymbolNode(0, 29, 'baz'),
                ),
            ]));

        expect(Parser.parse('{% from "foo/bar.kumis" import baz, foobar as foobarbaz %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.Literal(0, 8, 'foo/bar.kumis'),
                    new Node.NodeList(undefined, undefined, [
                        new Node.SymbolNode(0, 31, 'baz'),
                        new Node.Pair(0, 36, new Node.SymbolNode(0, 36, 'foobar'), new Node.SymbolNode(0, 46, 'foobarbaz')),
                    ])
                ),
            ]));

        expect(Parser.parse('{% import "foo/bar.html"|replace("html", "j2") as baz %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Import(0, 3,
                    new Node.Filter(0, 25,
                        new Node.SymbolNode(0, 25, 'replace'),
                        new Node.NodeList(0, 25, [
                            new Node.Literal(0, 10, 'foo/bar.html'),
                            new Node.Literal(0, 33, 'html'),
                            new Node.Literal(0, 41, 'j2'),
                        ])
                    ),
                    new Node.SymbolNode(0, 50, 'baz')
                ),
            ]));

        expect(Parser.parse('{% from ""|default("foo/bar.kumis") import baz, foobar as foobarbaz %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.Filter(0, 11,
                        new Node.SymbolNode(0, 11, 'default'),
                        new Node.NodeList(0, 11, [
                            new Node.Literal(0, 8, ''),
                            new Node.Literal(0, 19, 'foo/bar.kumis'),
                        ])
                    ),
                    new Node.NodeList(undefined, undefined, [
                        new Node.SymbolNode(0, 43, 'baz'),
                        new Node.Pair(0, 48, new Node.SymbolNode(0, 48, 'foobar'), new Node.SymbolNode(0, 58, 'foobarbaz')),
                    ])
                ),
            ]));
    }


    testShouldParseWhitespaceControl() {
        // Every start/end tag with "-" should trim the whitespace
        // Before or after it

        expect(Parser.parse('{% if x %}\n  hi \n{% endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 10, [ new Node.TemplateData(0, 10, '\n  hi \n') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('{% if x -%}\n  hi \n{% endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.TemplateData(0, 11, 'hi \n') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('{% if x %}\n  hi \n{%- endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 10, [ new Node.TemplateData(0, 10, '\n  hi') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('{% if x -%}\n  hi \n{%- endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.TemplateData(0, 11, 'hi') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('poop  \n{%- if x -%}\n  hi \n{%- endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'poop') ]),
                new Node.If(1, 4,
                    new Node.SymbolNode(1, 7, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(1, 12, [ new Node.TemplateData(1, 12, 'hi') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('hello \n{#- comment #}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello') ]),
            ]));

        expect(Parser.parse('{# comment -#} \n world'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 14, [ new Node.TemplateData(0, 14, 'world') ]),
            ]));

        expect(Parser.parse('hello \n{#- comment -#} \n world'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello') ]),
                new Node.Output(1, 15, [ new Node.TemplateData(1, 15, 'world') ]),
            ]));

        expect(Parser.parse('hello \n{# - comment - #} \n world'))
            .dump.as(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello \n') ]),
                new Node.Output(1, 17, [ new Node.TemplateData(1, 17, ' \n world') ]),
            ]));

        // The from statement required a special case so make sure to test it
        expect(Parser.parse('{% from x import y %}\n  hi \n'))
            .dump.as(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.SymbolNode(0, 8, 'x'),
                    new Node.NodeList(undefined, undefined, [ new Node.SymbolNode(0, 17, 'y') ])
                ),
                new Node.Output(0, 21, [ new Node.TemplateData(0, 21, '\n  hi \n') ]),
            ]));

        expect(Parser.parse('{% from x import y -%}\n  hi \n'))
            .dump.as(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.SymbolNode(0, 8, 'x'),
                    new Node.NodeList(undefined, undefined, [ new Node.SymbolNode(0, 17, 'y') ])
                ),
                new Node.Output(0, 22, [ new Node.TemplateData(0, 22, 'hi \n') ]),
            ]));

        expect(Parser.parse('{% if x -%}{{y}} {{z}}{% endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.SymbolNode(0, 13, 'y') ]),
                        // The value of TemplateData should be ' ' instead of ''
                        new Node.Output(0, 16, [ new Node.TemplateData(0, 16, ' ') ]),
                        new Node.Output(0, 17, [ new Node.SymbolNode(0, 19, 'z') ]),
                    ])
                ),
            ]));

        expect(Parser.parse('{% if x -%}{% if y %} {{z}}{% endif %}{% endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.If(0, 14,
                            new Node.SymbolNode(0, 17, 'y'),
                            new Node.NodeList(0, 0, [
                                // The value of TemplateData should be ' ' instead of ''
                                new Node.Output(0, 21, [ new Node.TemplateData(0, 21, ' ') ]),
                                new Node.Output(0, 22, [ new Node.SymbolNode(0, 24, 'z') ]),
                            ])
                        ),
                    ])
                ),
            ]));

        expect(Parser.parse('{% if x -%}{# comment #} {{z}}{% endif %}'))
            .dump.as(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        // The value of TemplateData should be ' ' instead of ''
                        new Node.Output(0, 24, [ new Node.TemplateData(0, 24, ' ') ]),
                        new Node.Output(0, 25, [ new Node.SymbolNode(0, 27, 'z') ]),
                    ])
                ),
            ]));
    }


    testShouldThrowErrors() {
        expect(function() {
            Parser.parse('hello {{ foo');
        }).to.throw(/expected variable end/);

        expect(function() {
            Parser.parse('hello {% if');
        }).to.throw(/expected expression/);

        expect(function() {
            Parser.parse('hello {% if sdf zxc');
        }).to.throw(/expected block end/);

        expect(function() {
            Parser.parse('{% include "foo %}');
        }).to.throw(/expected block end/);

        expect(function() {
            Parser.parse('hello {% if sdf %} data');
        }).to.throw(/expected elif, else, or endif/);

        expect(function() {
            Parser.parse('hello {% block sdf %} data');
        }).to.throw(/expected endblock/);

        expect(function() {
            Parser.parse('hello {% block sdf %} data{% endblock foo %}');
        }).to.throw(/expected block end/);

        expect(function() {
            Parser.parse('hello {% bar %} dsfsdf');
        }).to.throw(/Unknown block tag/);

        expect(function() {
            Parser.parse('{{ foo(bar baz) }}');
        }).to.throw(/expected comma after expression/);

        expect(function() {
            Parser.parse('{% import "foo" %}');
        }).to.throw(/expected "as" keyword/);

        expect(function() {
            Parser.parse('{% from "foo" %}');
        }).to.throw(/expected import/);

        expect(function() {
            Parser.parse('{% from "foo" import bar baz %}');
        }).to.throw(/expected comma/);

        expect(function() {
            Parser.parse('{% from "foo" import _bar %}');
        }).to.throw(/names starting with an underscore cannot be imported/);
    }


    testShouldParseCustomTags() {
        class TestTagExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'testtag';
                        }

                        parse(parser, extension) {
                            parser.peekToken();
                            parser.advanceAfterBlockEnd();

                            return new Node.CallExtension(extension, 'foo');
                        }
                    }(),
                ];
            }

            /* Normally this is automatically done by Environment */
            get name() {
                return 'testtagExtension';
            }
        }

        class TestBlockTagExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'testblocktag';
                        }

                        parse(parser, extension) {
                            parser.peekToken();
                            parser.advanceAfterBlockEnd();

                            const content = parser.parseUntilBlocks('endtestblocktag');
                            const tag = new Node.CallExtension(extension, 'bar', null, [ 1, content ]);
                            parser.advanceAfterBlockEnd();

                            return tag;
                        }
                    }(),
                ];
            }

            get name() {
                return 'testblocktagExtension';
            }
        }

        class TestArgsExtension extends AbstractExtension {
            /* eslint-disable no-shadow */
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'testargs';
                        }

                        parse(parser, extension) {
                            const begun = parser.peekToken();

                            // Skip the name
                            parser.nextToken();

                            const args = parser.parseSignature(true);
                            parser.advanceAfterBlockEnd(begun.value);

                            return new Node.CallExtension(extension, 'biz', args);
                        }
                    }(),
                ];
            }

            get name() {
                return 'testargsExtension';
            }
        }

        const extensions = [ new TestTagExtension(),
            new TestBlockTagExtension(),
            new TestArgsExtension() ];

        expect(Parser.parse('{% testtag %}', extensions))
            .dump.as(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[0], 'foo'),
            ]));

        expect(Parser.parse('{% testblocktag %}sdfd{% endtestblocktag %}', extensions))
            .dump.as(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[1], 'bar', null, [
                    1,
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 18, [ new Node.TemplateData(0, 18, 'sdfd') ]),
                    ]),
                ]),
            ]));

        expect(Parser.parse('{% testblocktag %}{{ 123 }}{% endtestblocktag %}', extensions))
            .dump.as(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[1], 'bar', null, [
                    1,
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 18, [ new Node.Literal(0, 21, 123) ]),
                    ]),
                ]),
            ]));

        expect(Parser.parse('{% testargs(123, "abc", foo="bar") %}', extensions))
            .dump.as(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[2], 'biz',
                    new Node.NodeList(0, 11, [
                        new Node.Literal(0, 12, 123),
                        new Node.Literal(0, 17, 'abc'),
                        new Node.KeywordArgs(0, 11, [
                            new Node.Pair(0, 24, new Node.SymbolNode(0, 24, 'foo'), new Node.Literal(0, 28, 'bar')),
                        ]),
                    ])
                ),
            ]));

        expect(Parser.parse('{% testargs %}', extensions))
            .dump.as(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[2], 'biz', null),
            ]));
    }
}
