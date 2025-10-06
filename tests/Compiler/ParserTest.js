const Parser = Kumis.Compiler.Parser;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const TagInterface = Kumis.Extension.TagInterface;
const Node = Kumis.Node;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;
const VarDumperTestTrait = Jymfony.Component.VarDumper.Test.VarDumperTestTrait;

export default class ParserTest extends mix(TestCase, VarDumperTestTrait) {
    testShouldParseBasicTypes() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 1) ]) ]), Parser.parse('{{ 1 }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 4.567) ]) ]), Parser.parse('{{ 4.567 }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 'foo') ]) ]), Parser.parse('{{ "foo" }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, 'foo') ]) ]), Parser.parse('{{ \'foo\' }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, true) ]) ]), Parser.parse('{{ true }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, false) ]) ]), Parser.parse('{{ false }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, null) ]) ]), Parser.parse('{{ none }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.SymbolNode(0, 3, 'foo') ]) ]), Parser.parse('{{ foo }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [ new Node.Literal(0, 3, /23/gi) ]) ]), Parser.parse('{{ r/23/gi }}'));
    }

    testShouldParseAggregateTypes() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Array(0, 3, [
                    new Node.Literal(0, 4, 1),
                    new Node.Literal(0, 6, 2),
                    new Node.Literal(0, 8, 3),
                ]),
            ]) ]), Parser.parse('{{ [1,2,3] }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Group(0, 3, [
                    new Node.Literal(0, 4, 1),
                    new Node.Literal(0, 6, 2),
                    new Node.Literal(0, 8, 3),
                ]),
            ]) ]), Parser.parse('{{ (1,2,3) }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Dict(0, 3, [
                    new Node.Pair(0, 4, new Node.SymbolNode(0, 4, 'foo'), new Node.Literal(0, 9, 1)),
                    new Node.Pair(0, 12, new Node.Literal(0, 12, 'two'), new Node.Literal(0, 19, 2)),
                ]),
            ]) ]), Parser.parse('{{ {foo: 1, \'two\': 2} }}'));
    }


    testShouldParseVariables() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello ') ]),
                new Node.Output(0, 6, [ new Node.SymbolNode(0, 9, 'foo') ]),
                new Node.Output(0, 15, [ new Node.TemplateData(0, 15, ', how are you') ]),
            ]), Parser.parse('hello {{ foo }}, how are you'));
    }


    testShouldParseOperators() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Compare(0, 5,
                    new Node.SymbolNode(0, 3, 'x'),
                    [ new Node.CompareOperand(0, 5, new Node.SymbolNode(0, 8, 'y'), '==') ]
                ),
            ]) ]), Parser.parse('{{ x == y }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'y')
                ),
            ]) ]), Parser.parse('{{ x or y }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.In(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'y')
                ),
            ]) ]), Parser.parse('{{ x in y }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Not(0, 3,
                    new Node.In(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 12, 'y')
                    )
                ),
            ]) ]), Parser.parse('{{ x not in y }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Is(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.SymbolNode(0, 8, 'callable')
                ),
            ]) ]), Parser.parse('{{ x is callable }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Not(0, 3,
                    new Node.Is(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 12, 'callable')
                    )
                ),
            ]) ]), Parser.parse('{{ x is not callable }}'));
    }


    testShouldParseTilde() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Concat(0, 3,
                    new Node.Literal(0, 3, 2),
                    new Node.Literal(0, 7, 3)
                ),
            ]) ]), Parser.parse('{{ 2 ~ 3 }}'));
    }


    testShouldParseOperatorsWithCorrectPrecedence() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.And(0, 3,
                    new Node.In(0, 3,
                        new Node.SymbolNode(0, 3, 'x'),
                        new Node.SymbolNode(0, 8, 'y')
                    ),
                    new Node.SymbolNode(0, 14, 'z')
                ),
            ]) ]), Parser.parse('{{ x in y and z }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.Not(0, 3,
                        new Node.In(0, 3,
                            new Node.SymbolNode(0, 3, 'x'),
                            new Node.SymbolNode(0, 12, 'y')
                        ),
                    ),
                    new Node.SymbolNode(0, 17, 'z')
                ),
            ]) ]), Parser.parse('{{ x not in y or z }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Or(0, 3,
                    new Node.SymbolNode(0, 3, 'x'),
                    new Node.And(0, 8,
                        new Node.SymbolNode(0, 8, 'y'),
                        new Node.SymbolNode(0, 14, 'z')
                    ),
                ),
            ]) ]), Parser.parse('{{ x or y and z }}'));
    }


    testShouldParseBlocks() {
        let n = Parser.parse('want some {% if hungry %}pizza{% else %}water{% endif %}?');
        __self.assertEquals('If', n.children[1].typename);

        n = Parser.parse('{% block foo %}stuff{% endblock %}');
        __self.assertEquals('Block', n.children[0].typename);

        n = Parser.parse('{% block foo %}stuff{% endblock foo %}');
        __self.assertEquals('Block', n.children[0].typename);

        n = Parser.parse('{% extends "test.kumis" %}stuff');
        __self.assertEquals('Extends', n.children[0].typename);

        n = Parser.parse('{% include "test.kumis" %}');
        __self.assertEquals('Include', n.children[0].typename);
    }


    testShouldAcceptAttributesAndMethodsOfStaticArraysObjectsAndPrimitives() {
        Parser.parse('{{ ([1, 2, 3]).indexOf(1) }}');

        Parser.parse('{{ [1, 2, 3].length }}');

        Parser.parse('{{ "Some String".replace("S", "$") }}');

        Parser.parse('{{ ({ name : "Khalid" }).name }}');

        Parser.parse('{{ 1.618.toFixed(2) }}');
    }


    testShouldParseIncludeTags() {
        let n = Parser.parse('{% include "test.kumis" %}');
        __self.assertEquals('Include', n.children[0].typename);

        n = Parser.parse('{% include "test.html"|replace("html","j2") %}');
        __self.assertEquals('Include', n.children[0].typename);

        n = Parser.parse('{% include ""|default("test.kumis") %}');
        __self.assertEquals('Include', n.children[0].typename);
    }


    testShouldParseForLoops() {
        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse('{% for x in [1, 2] %}{{ x }}{% endfor %}'));
    }


    testShouldParseForLoopsWithElse() {
        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse('{% for x in [] %}{{ x }}{% else %}empty{% endfor %}'));
    }


    testShouldParseFilters() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Filter(0, 9,
                    new Node.SymbolNode(0, 9, 'bar'),
                    new Node.NodeList(0, 9, [
                        new Node.SymbolNode(0, 3, 'foo'),
                    ])
                ),
            ]) ]), Parser.parse('{{ foo | bar }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
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
            ]) ]), Parser.parse('{{ foo | bar | baz }}'));

        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
                new Node.Filter(0, 9,
                    new Node.SymbolNode(0, 9, 'bar'),
                    new Node.NodeList(0, 9, [
                        new Node.SymbolNode(0, 3, 'foo'),
                        new Node.Literal(0, 13, 3),
                    ])
                ),
            ]) ]), Parser.parse('{{ foo | bar(3) }}'));
    }


    testShouldParseMacroDefinitions() {
        const ast = Parser.parse('{% macro foo(bar, baz="foobar") %}' +
            'This is a macro' +
            '{% endmacro %}');

        this.assertDumpEquals(new Node.Root(0, 0, [
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
        ]), ast);
    }


    testShouldParseCallBlocks() {
        const ast = Parser.parse('{% call foo("bar") %}' +
            'This is the caller' +
            '{% endcall %}');

        const sym = new Node.SymbolNode(0, 3, 'caller');
        this.assertDumpEquals(new Node.Root(0, 0, [
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
        ]), ast);
    }


    testShouldParseCallBlocksWithArgs() {
        const ast = Parser.parse('{% call(i) foo("bar", baz="foobar") %}' +
            'This is {{ i }}' +
            '{% endcall %}');

        const sym = new Node.SymbolNode(0, 3, 'caller');
        this.assertDumpEquals(new Node.Root(0, 0, [
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
        ]), ast);
    }


    testShouldParseRaw() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, 'hello {{ {% %} }}'),
            ]) ]), Parser.parse('{% raw %}hello {{ {% %} }}{% endraw %}'));
    }


    testShouldParseRawWithBrokenVariables() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{{ x }}'),
            ]) ]), Parser.parse('{% raw %}{{ x }}{% endraw %}'));
    }


    testShouldParseRawWithBrokenBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{% if i_am_stupid }Still do your job well'),
            ]) ]), Parser.parse('{% raw %}{% if i_am_stupid }Still do your job well{% endraw %}'));
    }


    testShouldParseRawWithPureText() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, 'abc'),
            ]) ]), Parser.parse('{% raw %}abc{% endraw %}'));
    }



    testShouldParseRawWithRawBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{% raw %}{{ x }{% endraw %}'),
            ]) ]), Parser.parse('{% raw %}{% raw %}{{ x }{% endraw %}{% endraw %}'));
    }


    testShouldParseRawWithCommentBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 7, [
                new Node.TemplateData(0, 7, '{# test '),
            ]) ]), Parser.parse('{% raw %}{# test {% endraw %}'));
    }


    testShouldParseMultipleRawBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 7, [ new Node.TemplateData(0, 7, '{{ var }}') ]),
                new Node.Output(0, 30, [ new Node.SymbolNode(0, 33, 'var') ]),
                new Node.Output(0, 46, [ new Node.TemplateData(0, 46, '{{ var }}') ]),
            ]), Parser.parse('{% raw %}{{ var }}{% endraw %}{{ var }}{% raw %}{{ var }}{% endraw %}'));
    }


    testShouldParseMultilineMultipleRawBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, '\n') ]),
                new Node.Output(1, 7, [ new Node.TemplateData(1, 7, '{{ var }}') ]),
                new Node.Output(1, 30, [ new Node.TemplateData(1, 30, '\n') ]),
                new Node.Output(2, 0, [ new Node.SymbolNode(2, 3, 'var') ]),
                new Node.Output(2, 9, [ new Node.TemplateData(2, 9, '\n') ]),
                new Node.Output(3, 7, [ new Node.TemplateData(3, 7, '{{ var }}') ]),
                new Node.Output(3, 30, [ new Node.TemplateData(3, 30, '\n') ]),
            ]), Parser.parse('\n{% raw %}{{ var }}{% endraw %}\n{{ var }}\n{% raw %}{{ var }}{% endraw %}\n'));
    }


    testShouldParseVerbatim() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, 'hello {{ {% %} }}'),
            ]) ]), Parser.parse('{% verbatim %}hello {{ {% %} }}{% endverbatim %}'));
    }


    testShouldParseVerbatimWithBrokenVariables() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{{ x }'),
            ]) ]), Parser.parse('{% verbatim %}{{ x }{% endverbatim %}'));
    }


    testShouldParseVerbatimWithBrokenBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{% if i_am_stupid }Still do your job well'),
            ]) ]), Parser.parse('{% verbatim %}{% if i_am_stupid }Still do your job well{% endverbatim %}'));
    }


    testShouldParseVerbatimWithPureText() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, 'abc'),
            ]) ]), Parser.parse('{% verbatim %}abc{% endverbatim %}'));
    }



    testShouldParseVerbatimWithVerbatimBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{% verbatim %}{{ x }{% endverbatim %}'),
            ]) ]), Parser.parse('{% verbatim %}{% verbatim %}{{ x }{% endverbatim %}{% endverbatim %}'));
    }


    testShouldParseVerbatimWithCommentBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 12, [
                new Node.TemplateData(0, 12, '{# test '),
            ]) ]), Parser.parse('{% verbatim %}{# test {% endverbatim %}'));
    }


    testShouldParseMultipleVerbatimBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 12, [ new Node.TemplateData(0, 12, '{{ var }}') ]),
                new Node.Output(0, 40, [ new Node.SymbolNode(0, 43, 'var') ]),
                new Node.Output(0, 61, [ new Node.TemplateData(0, 61, '{{ var }}') ]),
            ]), Parser.parse('{% verbatim %}{{ var }}{% endverbatim %}{{ var }}{% verbatim %}{{ var }}{% endverbatim %}'));
    }


    testShouldParseMultilineMultipleVerbatimBlocks() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, '\n') ]),
                new Node.Output(1, 12, [ new Node.TemplateData(1, 12, '{{ var }}') ]),
                new Node.Output(1, 40, [ new Node.TemplateData(1, 40, '\n') ]),
                new Node.Output(2, 0, [ new Node.SymbolNode(2, 3, 'var') ]),
                new Node.Output(2, 9, [ new Node.TemplateData(2, 9, '\n') ]),
                new Node.Output(3, 12, [ new Node.TemplateData(3, 12, '{{ var }}') ]),
                new Node.Output(3, 40, [ new Node.TemplateData(3, 40, '\n') ]),
            ]), Parser.parse('\n{% verbatim %}{{ var }}{% endverbatim %}\n{{ var }}\n{% verbatim %}{{ var }}{% endverbatim %}\n'));
    }


    testShouldParseSwitchStatements() {
        const tpl = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse(tpl));
    }


    testShouldParseKeywordAndNonKeywordArguments() {
        this.assertDumpEquals(new Node.Root(0, 0, [ new Node.Output(0, 0, [
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
            ]) ]), Parser.parse('{{ foo("bar", falalalala, baz="foobar") }}'));
    }


    testShouldParseImports() {
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Import(0, 3,
                    new Node.Literal(0, 10, 'foo/bar.kumis'),
                    new Node.SymbolNode(0, 29, 'baz'),
                ),
            ]), Parser.parse('{% import "foo/bar.kumis" as baz %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.Literal(0, 8, 'foo/bar.kumis'),
                    new Node.NodeList(undefined, undefined, [
                        new Node.SymbolNode(0, 31, 'baz'),
                        new Node.Pair(0, 36, new Node.SymbolNode(0, 36, 'foobar'), new Node.SymbolNode(0, 46, 'foobarbaz')),
                    ])
                ),
            ]), Parser.parse('{% from "foo/bar.kumis" import baz, foobar as foobarbaz %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse('{% import "foo/bar.html"|replace("html", "j2") as baz %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse('{% from ""|default("foo/bar.kumis") import baz, foobar as foobarbaz %}'));
    }


    testShouldParseWhitespaceControl() {
        // Every start/end tag with "-" should trim the whitespace
        // Before or after it

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 10, [ new Node.TemplateData(0, 10, '\n  hi \n') ]),
                    ])
                ),
            ]), Parser.parse('{% if x %}\n  hi \n{% endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.TemplateData(0, 11, 'hi \n') ]),
                    ])
                ),
            ]), Parser.parse('{% if x -%}\n  hi \n{% endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 10, [ new Node.TemplateData(0, 10, '\n  hi') ]),
                    ])
                ),
            ]), Parser.parse('{% if x %}\n  hi \n{%- endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.TemplateData(0, 11, 'hi') ]),
                    ])
                ),
            ]), Parser.parse('{% if x -%}\n  hi \n{%- endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'poop') ]),
                new Node.If(1, 4,
                    new Node.SymbolNode(1, 7, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(1, 12, [ new Node.TemplateData(1, 12, 'hi') ]),
                    ])
                ),
            ]), Parser.parse('poop  \n{%- if x -%}\n  hi \n{%- endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello') ]),
            ]), Parser.parse('hello \n{#- comment #}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 14, [ new Node.TemplateData(0, 14, 'world') ]),
            ]), Parser.parse('{# comment -#} \n world'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello') ]),
                new Node.Output(1, 15, [ new Node.TemplateData(1, 15, 'world') ]),
            ]), Parser.parse('hello \n{#- comment -#} \n world'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.Output(0, 0, [ new Node.TemplateData(0, 0, 'hello \n') ]),
                new Node.Output(1, 17, [ new Node.TemplateData(1, 17, ' \n world') ]),
            ]), Parser.parse('hello \n{# - comment - #} \n world'));

        // The from statement required a special case so make sure to test it
        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.SymbolNode(0, 8, 'x'),
                    new Node.NodeList(undefined, undefined, [ new Node.SymbolNode(0, 17, 'y') ])
                ),
                new Node.Output(0, 21, [ new Node.TemplateData(0, 21, '\n  hi \n') ]),
            ]), Parser.parse('{% from x import y %}\n  hi \n'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.FromImport(0, 3,
                    new Node.SymbolNode(0, 8, 'x'),
                    new Node.NodeList(undefined, undefined, [ new Node.SymbolNode(0, 17, 'y') ])
                ),
                new Node.Output(0, 22, [ new Node.TemplateData(0, 22, 'hi \n') ]),
            ]), Parser.parse('{% from x import y -%}\n  hi \n'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 11, [ new Node.SymbolNode(0, 13, 'y') ]),
                        // The value of TemplateData should be ' ' instead of ''
                        new Node.Output(0, 16, [ new Node.TemplateData(0, 16, ' ') ]),
                        new Node.Output(0, 17, [ new Node.SymbolNode(0, 19, 'z') ]),
                    ])
                ),
            ]), Parser.parse('{% if x -%}{{y}} {{z}}{% endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
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
            ]), Parser.parse('{% if x -%}{% if y %} {{z}}{% endif %}{% endif %}'));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.If(0, 3,
                    new Node.SymbolNode(0, 6, 'x'),
                    new Node.NodeList(0, 0, [
                        // The value of TemplateData should be ' ' instead of ''
                        new Node.Output(0, 24, [ new Node.TemplateData(0, 24, ' ') ]),
                        new Node.Output(0, 25, [ new Node.SymbolNode(0, 27, 'z') ]),
                    ])
                ),
            ]), Parser.parse('{% if x -%}{# comment #} {{z}}{% endif %}'));
    }


    testShouldThrowErrors() {
        this.expectExceptionMessageRegex(/expected variable end/);
            Parser.parse('hello {{ foo');


        this.expectExceptionMessageRegex(/expected expression/);
            Parser.parse('hello {% if');


        this.expectExceptionMessageRegex(/expected block end/);
            Parser.parse('hello {% if sdf zxc');


        this.expectExceptionMessageRegex(/expected block end/);
            Parser.parse('{% include "foo %}');


        this.expectExceptionMessageRegex(/expected elif, else, or endif/);
            Parser.parse('hello {% if sdf %} data');


        this.expectExceptionMessageRegex(/expected endblock/);
            Parser.parse('hello {% block sdf %} data');


        this.expectExceptionMessageRegex(/expected block end/);
            Parser.parse('hello {% block sdf %} data{% endblock foo %}');


        this.expectExceptionMessageRegex(/Unknown block tag/);
            Parser.parse('hello {% bar %} dsfsdf');


        this.expectExceptionMessageRegex(/expected comma after expression/);
            Parser.parse('{{ foo(bar baz) }}');


        this.expectExceptionMessageRegex(/expected "as" keyword/);
            Parser.parse('{% import "foo" %}');


        this.expectExceptionMessageRegex(/expected import/);
            Parser.parse('{% from "foo" %}');


        this.expectExceptionMessageRegex(/expected comma/);
            Parser.parse('{% from "foo" import bar baz %}');


        this.expectExceptionMessageRegex(/names starting with an underscore cannot be imported/);
            Parser.parse('{% from "foo" import _bar %}');

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

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[0], 'foo'),
            ]), Parser.parse('{% testtag %}', extensions));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[1], 'bar', null, [
                    1,
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 18, [ new Node.TemplateData(0, 18, 'sdfd') ]),
                    ]),
                ]),
            ]), Parser.parse('{% testblocktag %}sdfd{% endtestblocktag %}', extensions));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[1], 'bar', null, [
                    1,
                    new Node.NodeList(0, 0, [
                        new Node.Output(0, 18, [ new Node.Literal(0, 21, 123) ]),
                    ]),
                ]),
            ]), Parser.parse('{% testblocktag %}{{ 123 }}{% endtestblocktag %}', extensions));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[2], 'biz',
                    new Node.NodeList(0, 11, [
                        new Node.Literal(0, 12, 123),
                        new Node.Literal(0, 17, 'abc'),
                        new Node.KeywordArgs(0, 11, [
                            new Node.Pair(0, 24, new Node.SymbolNode(0, 24, 'foo'), new Node.Literal(0, 28, 'bar')),
                        ]),
                    ])
                ),
            ]), Parser.parse('{% testargs(123, "abc", foo="bar") %}', extensions));

        this.assertDumpEquals(new Node.Root(0, 0, [
                new Node.CallExtension(extensions[2], 'biz', null),
            ]), Parser.parse('{% testargs %}', extensions));
    }
}
