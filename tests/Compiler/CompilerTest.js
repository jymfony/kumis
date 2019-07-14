const Tokenizer = Kumis.Compiler.Tokenizer;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const TagInterface = Kumis.Extension.TagInterface;
const Environment = Kumis.Environment;
const Loader = Kumis.Loader.FilesystemLoader;
const Node = Kumis.Node;
const Template = Kumis.Template;

const { expect } = require('chai');
const { render, equal, isSlim } = require('../util');
const fs = require('fs');
const { promisify } = require('util');

describe('Compiler', function() {
    it('should compile templates', async () => {
        await Promise.all([
            equal('Hello world', 'Hello world'),
            equal('Hello world, {{ name }}', {
                name: 'James',
            }, 'Hello world, James'),

            equal('Hello world, {{name}}{{suffix}}, how are you', {
                name: 'James',
                suffix: ' Long',
            }, 'Hello world, James Long, how are you'),
        ]);
    });

    it('should escape newlines', async () => {
        await equal('foo\\nbar', 'foo\\nbar');
    });

    it('should escape Unicode line seperators', async () => {
        await equal('\u2028', '\u2028');
    });

    it('should compile references', async () => {
        await equal('{{ foo.bar }}', {
            foo: {
                bar: 'baz',
            },
        }, 'baz');

        await equal('{{ foo["bar"] }}', {
            foo: {
                bar: 'baz',
            },
        },
        'baz');
    });

    it('should compile references - object without prototype', async () => {
        const context = Object.create(null);
        context.foo = Object.create(null);
        context.foo.bar = 'baz';

        await equal('{{ foo.bar }}', context, 'baz');
        await equal('{{ foo["bar"] }}', context, 'baz');
    });

    it('should not treat falsy values the same as undefined', async () => {
        await equal('{{ foo }}', {
            foo: 0,
        }, '0');
        await equal('{{ foo }}', {
            foo: false,
        }, 'false');
    });

    it('should display none as empty string', async () => {
        await equal('{{ none }}', '');
    });

    it('should compile none as falsy', async () => {
        await equal('{% if not none %}yes{% endif %}', 'yes');
    });

    it('should compile none as null, not undefined', async () => {
        await equal('{{ none|default("d", false) }}', '');
    });

    it('should compile function calls', async () => {
        await equal('{{ foo("msg") }}', {
            foo: function(str) {
                return str + 'hi';
            },
        }, 'msghi');
    });

    it('should compile function calls with correct scope', async () => {
        await equal('{{ foo.bar() }}', {
            foo: {
                bar: function() {
                    return this.baz;
                },
                baz: 'hello',
            },
        }, 'hello');
    });

    it('should compile switch statements', async () => {
        // Standard switches
        const tpl1 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
        // Test no-default switches
        const tpl2 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% endswitch %}';
        // Test fall-through cases
        const tpl3 = '{% switch foo %}{% case "bar" %}{% case "baz" %}BAR{% endswitch %}';
        await equal(tpl1, { foo: null }, 'NEITHER FOO NOR BAR');
        await equal(tpl1, {
            foo: 'bar',
        }, 'BAR');
        await equal(tpl1, {
            foo: 'baz',
        }, 'BAZ');
        await equal(tpl2, { foo: null }, '');
        await equal(tpl3, {
            foo: 'bar',
        }, 'BAR');
        await equal(tpl3, {
            foo: 'baz',
        }, 'BAR');
    });

    it('should compile if blocks', async () => {
        const tmpl = ('Give me some {% if hungry %}pizza' +
    '{% else %}water{% endif %}');

        await equal(tmpl, {
            hungry: true,
        }, 'Give me some pizza');
        await equal(tmpl, {
            hungry: false,
        }, 'Give me some water');
        await equal('{% if not hungry %}good{% endif %}', {
            hungry: false,
        }, 'good');

        await equal('{% if hungry and like_pizza %}good{% endif %}', {
            hungry: true,
            like_pizza: true,
        }, 'good');

        await equal('{% if hungry or like_pizza %}good{% endif %}', {
            hungry: false,
            like_pizza: true,
        }, 'good');

        await equal('{% if (hungry or like_pizza) and anchovies %}good{% endif %}', {
            hungry: false,
            like_pizza: true,
            anchovies: true,
        }, 'good');

        await equal(
            '{% if food == "pizza" %}pizza{% endif %}' +
    '{% if food =="beer" %}beer{% endif %}', {
                food: 'beer',
            }, 'beer');

        await equal('{% if "pizza" in food %}yum{% endif %}', {
            food: {
                pizza: true,
            },
        }, 'yum');

        await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}', {
            pizza: true,
        }, 'yum');

        await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}', {
            pizza: true,
        }, 'yum');

        await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}', {
            pizza: null,
            anchovies: true,
        }, 'yuck');

        await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}', {
            pizza: null,
            anchovies: true,
        }, 'yuck');

        await equal(
            '{% if topping == "pepperoni" %}yum{% elseif topping == "anchovies" %}' +
    'yuck{% else %}hmmm{% endif %}', {
                topping: 'sausage',
            },
            'hmmm');
    });

    it('should compile the ternary operator', async () => {
        await equal('{{ "foo" if bar else "baz" }}', { bar: null }, 'baz');
        await equal('{{ "foo" if bar else "baz" }}', {
            bar: true,
        }, 'foo');
    });

    it('should compile inline conditionals', async () => {
        const tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

        await equal(tmpl, {
            hungry: true,
        }, 'Give me some pizza');
        await equal(tmpl, {
            hungry: false,
        }, 'Give me some water');
        await equal('{{ "good" if not hungry }}', {
            hungry: false,
        }, 'good');
        await equal('{{ "good" if hungry and like_pizza }}', {
            hungry: true,
            like_pizza: true,
        }, 'good');
        await equal('{{ "good" if hungry or like_pizza }}', {
            hungry: false,
            like_pizza: true,
        }, 'good');
        await equal('{{ "good" if (hungry or like_pizza) and anchovies }}', {
            hungry: false,
            like_pizza: true,
            anchovies: true,
        }, 'good');
        await equal(
            '{{ "pizza" if food == "pizza" }}' +
    '{{ "beer" if food == "beer" }}', {
                food: 'beer',
            }, 'beer');
    });

    function runLoopTests(block) {
        const end = {
            for: 'endfor',
        }[block];

        describe('the ' + block + ' tag', function() {
            it('should loop over simple arrays', async () => {
                await equal(
                    '{% ' + block + ' i in arr %}{{ i }}{% ' + end + ' %}',
                    { arr: [ 1, Promise.resolve(2), 3, 4, 5 ] },
                    '12345');
            });

            it('should loop normally with an {% else %} tag and non-empty array', async () => {
                await equal(
                    '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
                    { arr: [ 1, 2, 3, 4, 5 ] },
                    '12345');
            });

            it('should execute the {% else %} block when looping over an empty array', async () => {
                await equal(
                    '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
                    { arr: [] },
                    'empty');
            });

            it('should support destructured looping', async () => {
                await equal(
                    '{% ' + block + ' a, b, c in arr %}' +
                    '{{ a }},{{ b }},{{ c }}.{% ' + end + ' %}',
                    { arr: [ [ 'x', 'y', 'z' ], [ '1', '2', '3' ] ] },
                    'x,y,z.1,2,3.');
            });

            it('should do loop over key-values of a literal in-template Object', async () => {
                await equal(
                    '{% ' + block + ' k, v in { one: 1, two: 2 } %}' +
                    '-{{ k }}:{{ v }}-{% ' + end + ' %}', '-one:1--two:2-');
            });

            it('should support loop.index', async () => {
                await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index }}{% ' + end + ' %}', '123');
            });

            it('should support loop.index0', async () => {
                await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index0 }}{% ' + end + ' %}', '012');
            });

            it('should support loop.revindex', async () => {
                await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex }}{% ' + end + ' %}', '321');
            });

            it('should support loop.revindex0', async () => {
                await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex0 }}{% ' + end + ' %}', '210');
            });

            it('should support loop.first', async () => {
                await equal(
                    '{% ' + block + ' i in [7,3,6] %}' +
                    '{% if loop.first %}{{ i }}{% endif %}' +
                    '{% ' + end + ' %}',
                    '7');
            });

            it('should support loop.last', async () => {
                await equal(
                    '{% ' + block + ' i in [7,3,6] %}' +
                    '{% if loop.last %}{{ i }}{% endif %}' +
                    '{% ' + end + ' %}',
                    '6');
            });

            it('should support loop.length', async () => {
                await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.length }}{% ' + end + ' %}', '333');
            });

            it('should fail silently when looping over an undefined property', async () => {
                await equal(
                    '{% ' + block + ' i in foo.bar %}{{ i }}{% ' + end + ' %}',
                    { foo: {} },
                    '');
            });

            // TODO: this behavior differs from jinja2
            it('should fail silently when looping over a null variable', async () => {
                await equal(
                    '{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}',
                    { foo: null },
                    '');
            });

            it('should loop over two-dimensional arrays', async () => {
                await equal('{% ' + block + ' x, y in points %}[{{ x }},{{ y }}]{% ' + end + ' %}',
                    { points: [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] },
                    '[1,2][3,4][5,6]');
            });

            it('should loop over four-dimensional arrays', async () => {
                await equal(
                    '{% ' + block + ' a, b, c, d in arr %}[{{ a }},{{ b }},{{ c }},{{ d }}]{% ' + end + '%}',
                    { arr: [ [ 1, 2, 3, 4 ], [ 5, 6, 7, 8 ] ] },
                    '[1,2,3,4][5,6,7,8]');
            });

            it('should support loop.index with two-dimensional loops', async () => {
                await equal('{% ' + block + ' x, y in points %}{{ loop.index }}{% ' + end + ' %}',
                    {
                        points: [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ],
                    },
                    '123');
            });

            it('should support loop.revindex with two-dimensional loops', async () => {
                await equal('{% ' + block + ' x, y in points %}{{ loop.revindex }}{% ' + end + ' %}',
                    {
                        points: [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ],
                    },
                    '321');
            });

            it('should support key-value looping over an Object variable', async () => {
                await equal('{% ' + block + ' k, v in items %}({{ k }},{{ v }}){% ' + end + ' %}',
                    {
                        items: {
                            foo: 1,
                            bar: 2,
                        },
                    },
                    '(foo,1)(bar,2)');
            });

            it('should support loop.index when looping over an Object\'s key-value pairs', async () => {
                await equal('{% ' + block + ' k, v in items %}{{ loop.index }}{% ' + end + ' %}',
                    {
                        items: {
                            foo: 1,
                            bar: 2,
                        },
                    },
                    '12');
            });

            it('should support loop.revindex when looping over an Object\'s key-value pairs', async () => {
                await equal('{% ' + block + ' k, v in items %}{{ loop.revindex }}{% ' + end + ' %}',
                    {
                        items: {
                            foo: 1,
                            bar: 2,
                        },
                    },
                    '21');
            });

            it('should support loop.length when looping over an Object\'s key-value pairs', async () => {
                await equal('{% ' + block + ' k, v in items %}{{ loop.length }}{% ' + end + ' %}',
                    {
                        items: {
                            foo: 1,
                            bar: 2,
                        },
                    },
                    '22');
            });

            it('should support include tags in the body of the loop', async () => {
                await equal('{% ' + block + ' item, v in items %}{% include "item.kumis" %}{% ' + end + ' %}',
                    {
                        items: {
                            foo: 1,
                            bar: 2,
                        },
                    },
                    'showing fooshowing bar');
            });

            it('should work with {% set %} and {% include %} tags', async () => {
                await equal(
                    '{% set item = passed_var %}' +
                    '{% include "item.kumis" %}\n' +
                    '{% ' + block + ' i in passed_iter %}' +
                    '{% set item = i %}' +
                    '{% include "item.kumis" %}\n' +
                    '{% ' + end + ' %}',
                    {
                        passed_var: 'test',
                        passed_iter: [ '1', '2', '3' ],
                    },
                    'showing test\nshowing 1\nshowing 2\nshowing 3\n');
            });

            /* global Set */
            it('should work with Set builtin', async () => {
                if ('undefined' === typeof Set) {
                    this.skip();
                } else {
                    await equal('{% ' + block + ' i in set %}{{ i }}{% ' + end + ' %}',
                        { set: new Set([ 1, 2, 3, 4, 5 ]) },
                        '12345');

                    await equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
                        { set: new Set([ 1, 2, 3, 4, 5 ]) },
                        '12345');

                    await equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
                        { set: new Set() },
                        'empty');
                }
            });

            it('should work with Map builtin', async () => {
                await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% ' + end + ' %}',
                    { map: new Map([ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ]) },
                    '[1,2][3,4][5,6]');

                await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
                    { map: new Map([ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ]) },
                    '[1,2][3,4][5,6]');

                await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
                    { map: new Map() },
                    'empty');
            });
        });
    }

    runLoopTests('for');

    it('should allow overriding var with none inside nested scope', async () => {
        await equal(
            '{% set var = "foo" %}' +
            '{% for i in [1] %}{% set var = none %}{{ var }}{% endfor %}',
            '');


    });

    it('should compile async control', async () => {
        let opts;
        if (!fs) {
            this.skip();
        } else {
            opts = {
                filters: {
                    getContents: async (templ) => {
                        return await promisify(fs.readFile)(templ, 'utf-8');
                    },

                    getContentsArr: async (arr) => {
                        return [ await promisify(fs.readFile)(arr[0], 'utf-8') ];
                    },
                },
            };

            expect(await render('{{ tmpl | getContents }}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere');

            expect(await render('{% if tmpl %}{{ tmpl | getContents }}{% endif %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere');

            expect(await render('{% if tmpl | getContents %}yes{% endif %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('yes');

            expect(await render('{% for t in [tmpl, tmpl] %}{{ t | getContents }}*{% endfor %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere*somecontenthere*');

            expect(await render('{% for t in [tmpl, tmpl] | getContentsArr %}{{ t }}{% endfor %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere');

            expect(await render('{% if test %}{{ tmpl | getContents }}{% endif %}oof', {
                tmpl: 'tests/templates/for-async-content.kumis',
                test: null,
            }, opts)).to.be.equal('oof');

            expect(await render(
                '{% if tmpl %}' +
                '{% for i in [0, 1] %}{{ tmpl | getContents }}*{% endfor %}' +
                '{% endif %}', {
                    tmpl: 'tests/templates/for-async-content.kumis',
                }, opts)).to.be.equal('somecontenthere*somecontenthere*');

            expect(await render('{% block content %}{{ tmpl | getContents }}{% endblock %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere');

            expect(await render('{% block content %}hello{% endblock %} {{ tmpl | getContents }}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('hello somecontenthere');

            expect(await render('{% block content %}{% set foo = tmpl | getContents %}{{ foo }}{% endblock %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere');

            expect(await render('{% block content %}{% include "async.kumis" %}{% endblock %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere\n');

            expect(await render('{% for i in [0, 1] %}{% include "async.kumis" %}{% endfor %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('somecontenthere\nsomecontenthere\n');

            expect(await render('{% for i in [0, 1, 2, 3, 4] %}-{{ i }}:{% include "async.kumis" %}-{% endfor %}', {
                tmpl: 'tests/templates/for-async-content.kumis',
            }, opts)).to.be.equal('-0:somecontenthere\n-' +
                '-1:somecontenthere\n-' +
                '-2:somecontenthere\n-' +
                '-3:somecontenthere\n-' +
                '-4:somecontenthere\n-'
            );
        }
    });

    it('should compile basic arithmetic operators', async () => {
        await equal('{{ 3 + 4 - 5 * 6 / 10 }}', '4');
    });

    it('should compile the exponentiation (**) operator', async () => {
        await equal('{{ 4**5 }}', '1024');
    });

    it('should compile the integer division (//) operator', async () => {
        await equal('{{ 9//5 }}', '1');
    });

    it('should compile the modulus operator', async () => {
        await equal('{{ 9%5 }}', '4');
    });

    it('should compile numeric negation operator', async () => {
        await equal('{{ -5 }}', '-5');
    });

    it('should compile comparison operators', async () => {
        await equal('{% if 3 < 4 %}yes{% endif %}', 'yes');
        await equal('{% if 3 > 4 %}yes{% endif %}', '');
        await equal('{% if 9 >= 10 %}yes{% endif %}', '');
        await equal('{% if 10 >= 10 %}yes{% endif %}', 'yes');
        await equal('{% if 9 <= 10 %}yes{% endif %}', 'yes');
        await equal('{% if 10 <= 10 %}yes{% endif %}', 'yes');
        await equal('{% if 11 <= 10 %}yes{% endif %}', '');

        await equal('{% if 10 != 10 %}yes{% endif %}', '');
        await equal('{% if 10 == 10 %}yes{% endif %}', 'yes');

        await equal('{% if "0" == 0 %}yes{% endif %}', 'yes');
        await equal('{% if "0" === 0 %}yes{% endif %}', '');
        await equal('{% if "0" !== 0 %}yes{% endif %}', 'yes');
        await equal('{% if 0 == false %}yes{% endif %}', 'yes');
        await equal('{% if 0 === false %}yes{% endif %}', '');

        await equal('{% if foo(20) > bar %}yes{% endif %}',
            {
                foo: function(n) {
                    return n - 1;
                },
                bar: 15,
            },
            'yes');
    });

    it('should compile python-style ternary operators', async () => {
        await equal('{{ "yes" if 1 is odd else "no"  }}', 'yes');
        await equal('{{ "yes" if 2 is even else "no"  }}', 'yes');
        await equal('{{ "yes" if 2 is odd else "no"  }}', 'no');
        await equal('{{ "yes" if 1 is even else "no"  }}', 'no');
    });

    it('should compile the "in" operator for Arrays', async () => {
        await equal('{% if 1 in [1, 2] %}yes{% endif %}', 'yes');
        await equal('{% if 1 in [2, 3] %}yes{% endif %}', '');
        await equal('{% if 1 not in [1, 2] %}yes{% endif %}', '');
        await equal('{% if 1 not in [2, 3] %}yes{% endif %}', 'yes');
        await equal('{% if "a" in vals %}yes{% endif %}',
            { vals: [ 'a', 'b' ] },
            'yes');
    });

    it('should compile the "in" operator for objects', async () => {
        await equal('{% if "a" in obj %}yes{% endif %}',
            { obj: { a: true } },
            'yes');
        await equal('{% if "a" in obj %}yes{% endif %}',
            { obj: { b: true } },
            '');
    });

    it('should compile the "in" operator for strings', async () => {
        await equal('{% if "foo" in "foobar" %}yes{% endif %}', 'yes');
    });

    it('should throw an error when using the "in" operator on unexpected types', async () => {
        try {
            await render('{% if "a" in 1 %}yes{% endif %}', {});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(
                /Cannot use "in" operator to search for "a" in unexpected types\./
            );
        }

        try {
            await render('{% if "a" in obj %}yes{% endif %}', { obj: undefined });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(
                /Cannot use "in" operator to search for "a" in unexpected types\./
            );
        }
    });

    if (!isSlim) {
        it('should include error line in raised TemplateError', async () => {
            const tmplStr = [
                '{% set items = ["a", "b",, "c"] %}',
                '{{ items | join(",") }}',
            ].join('\n');

            const loader = new Loader('tests/templates');
            const env = Environment.create(loader);
            const tmpl = new Template(tmplStr, env, 'parse-error.kumis');

            try {
                await tmpl.render({});
            } catch (err) {
                expect(err.toString()).to.be.equal([
                    'TemplateError: (parse-error.kumis) [Line 1, Column 26]',
                    '  unexpected token: ,',
                ].join('\n'));

                return;
            }

            throw new Error('FAIL');
        });

        it('should include error line when exception raised in user function', async () => {
            const tmplStr = [
                '{% block content %}',
                '<div>{{ foo() }}</div>',
                '{% endblock %}',
            ].join('\n');
            const env = Environment.create(new Loader('tests/templates'));
            const tmpl = new Template(tmplStr, env, 'user-error.kumis');

            function foo() {
                throw new Error('ERROR');
            }

            try {
                await tmpl.render({ foo });
            } catch (err) {
                expect(err.toString()).to.be.equal([
                    'TemplateError: (user-error.kumis) [Line 1, Column 8]',
                    '  Error: ERROR',
                ].join('\n'));

                return;
            }

            throw new Error('FAIL');
        });
    }

    it('should compile string concatenations with tilde', async () => {
        await equal('{{ 4 ~ \'hello\' }}', '4hello');
        await equal('{{ 4 ~ 5 }}', '45');
        await equal('{{ \'a\' ~ \'b\' ~ 5 }}', 'ab5');
    });

    it('should compile macros', async () => {
        await equal(
            '{% macro foo() %}This is a macro{% endmacro %}' +
            '{{ foo() }}',
            'This is a macro');
    });

    it('should compile macros with optional args', async () => {
        await equal(
            '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
            '{{ foo(1) }}',
            '');
    });

    it('should compile macros with args that can be passed to filters', async () => {
        await equal(
            '{% macro foo(x) %}{{ x|title }}{% endmacro %}' +
            '{{ foo("foo") }}',
            'Foo');
    });

    it('should compile macros with positional args', async () => {
        await equal(
            '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
            '{{ foo(1, 2) }}',
            '2');
    });

    it('should compile macros with arg defaults', async () => {
        await equal(
            '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
            '{{ foo(1, 2) }}',
            '2');
        await equal(
            '{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
            '{{ foo(1, 2) }}',
            '5');
    });

    it('should compile macros with keyword args', async () => {
        await equal(
            '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
            '{{ foo(1, y=2) }}',
            '2');
    });

    it('should compile macros with only keyword args', async () => {
        await equal(
            '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{{ foo(x=1, y=2) }}',
            '125');
    });

    it('should compile macros with keyword args overriding defaults', async () => {
        await equal(
            '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{{ foo(x=1, y=2, z=3) }}',
            '123');
    });

    it('should compile macros with out-of-order keyword args', async () => {
        await equal(
            '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{{ foo(1, z=3) }}',
            '123');
    });

    it('should compile macros', async () => {
        await equal(
            '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{{ foo(1) }}',
            '125');
    });

    it('should compile macros with multiple overridden arg defaults', async () => {
        await equal(
            '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{{ foo(1, 10, 20) }}',
            '11020');
    });

    it('should compile macro calls inside blocks', async () => {
        await equal(
            '{% extends "base.kumis" %}' +
            '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{% block block1 %}' +
            '{{ foo(1) }}' +
            '{% endblock %}',
            'Foo125BazFizzle');
    });

    it('should compile macros defined in one block and called in another', async () => {
        await equal(
            '{% block bar %}' +
            '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
            '{% endmacro %}' +
            '{% endblock %}' +
            '{% block baz %}' +
            '{{ foo(1) }}' +
            '{% endblock %}',
            '125');
    });

    it('should compile macros that include other templates', async () => {
        await equal(
            '{% macro foo() %}{% include "include.kumis" %}{% endmacro %}' +
            '{{ foo() }}',
            {
                name: 'james',
            },
            'FooInclude james');
    });

    it('should compile macros that set vars', async () => {
        await equal(
            '{% macro foo() %}{% set x = "foo"%}{{ x }}{% endmacro %}' +
            '{% set x = "bar" %}' +
            '{{ x }}' +
            '{{ foo() }}' +
            '{{ x }}',
            'barfoobar');
    });

    it('should not leak variables set in macro to calling scope', async () => {
        await equal(
            '{% macro setFoo() %}' +
            '{% set x = "foo" %}' +
            '{{ x }}' +
            '{% endmacro %}' +
            '{% macro display() %}' +
            '{% set x = "bar" %}' +
            '{{ setFoo() }}' +
            '{{ x }}' +
            '{% endmacro %}' +
            '{{ display() }}',
            'foobar');
    });

    it('should not leak variables set in nested scope within macro out to calling scope', async () => {
        await equal(
            '{% macro setFoo() %}' +
            '{% for y in [1] %}{% set x = "foo" %}{{ x }}{% endfor %}' +
            '{% endmacro %}' +
            '{% macro display() %}' +
            '{% set x = "bar" %}' +
            '{{ setFoo() }}' +
            '{{ x }}' +
            '{% endmacro %}' +
            '{{ display() }}',
            'foobar');
    });

    it('should compile macros without leaking set to calling scope', async () => {
        // This test checks that the issue #577 is resolved.
        // If the bug is not fixed, and set variables leak into the
        // Caller scope, there will be too many "foo"s here ("foofoofoo"),
        // Because each recursive call will append a "foo" to the
        // Variable x in its caller's scope, instead of just its own.
        await equal(
            '{% macro foo(topLevel, prefix="") %}' +
            '{% if topLevel %}' +
            '{% set x = "" %}' +
            '{% for i in [1,2] %}' +
            '{{ foo(false, x) }}' +
            '{% endfor %}' +
            '{% else %}' +
            '{% set x = prefix + "foo" %}' +
            '{{ x }}' +
            '{% endif %}' +
            '{% endmacro %}' +
            '{{ foo(true) }}',
            'foofoo');
    });

    it('should compile macros that cannot see variables in caller scope', async () => {
        try {
            await render(
                '{% macro one(var) %}{{ two() }}{% endmacro %}' +
                '{% macro two() %}{{ var }}{% endmacro %}' +
                '{{ one("foo") }}');
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Undefined variable "var"/);
        }
    });

    it('should compile call blocks', async () => {
        await equal(
            '{% macro wrap(el) %}' +
            '<{{ el }}>{{ caller() }}</{{ el }}>' +
            '{% endmacro %}' +
            '{% call wrap("div") %}Hello{% endcall %}',
            '<div>Hello</div>');
    });

    it('should compile call blocks with args', async () => {
        await equal(
            '{% macro list(items) %}' +
            '<ul>{% for i in items %}' +
            '<li>{{ caller(i) }}</li>' +
            '{% endfor %}</ul>' +
            '{% endmacro %}' +
            '{% call(item) list(["a", "b"]) %}{{ item }}{% endcall %}',
            '<ul><li>a</li><li>b</li></ul>');
    });

    it('should compile call blocks using imported macros', async () => {
        await equal(
            '{% import "import.kumis" as imp %}' +
            '{% call imp.wrap("span") %}Hey{% endcall %}',
            '<span>Hey</span>');
    });

    it('should import templates', async () => {
        await equal(
            '{% import "import.kumis" as imp %}' +
            '{{ imp.foo() }} {{ imp.bar }}',
            'Here\'s a macro baz');

        await equal(
            '{% from "import.kumis" import foo as baz, bar %}' +
            '{{ bar }} {{ baz() }}',
            'baz Here\'s a macro');

        // TODO: Should the for loop create a new frame for each
        // Iteration? As it is, `num` is set on all iterations after
        // The first one sets it
        await equal(
            '{% for i in [1,2] %}' +
            'start: {{ num }}' +
            '{% from "import.kumis" import bar as num %}' +
            'end: {{ num }}' +
            '{% endfor %}' +
            'final: {{ num }}',
            { num: undefined }, 'start: end: bazstart: bazend: bazfinal: ');
    });

    it('should import templates with context', async () => {
        await equal(
            '{% set bar = "BAR" %}' +
            '{% import "import-context.kumis" as imp with context %}' +
            '{{ imp.foo() }}',
            'Here\'s BAR');

        await equal(
            '{% set bar = "BAR" %}' +
            '{% from "import-context.kumis" import foo with context %}' +
            '{{ foo() }}',
            'Here\'s BAR');

        await equal(
            '{% set bar = "BAR" %}' +
            '{% import "import-context-set.kumis" as imp %}' +
            '{{ bar }}',
            'BAR');

        await equal(
            '{% set bar = "BAR" %}' +
            '{% import "import-context-set.kumis" as imp %}' +
            '{{ imp.bar }}',
            'FOO');

        await equal(
            '{% set bar = "BAR" %}' +
            '{% import "import-context-set.kumis" as imp with context %}' +
            '{{ bar }} {{ buzz is defined }}',
            'FOO false');

        await equal(
            '{% set bar = "BAR" %}' +
            '{% import "import-context-set.kumis" as imp with context %}' +
            '{{ imp.bar }} {{ buzz is defined }}',
            'FOO false');
    });

    it('should import templates without context', async () => {
        try {
            await render(
                '{% set bar = "BAR" %}' +
                '{% import "import-context.kumis" as imp without context %}' +
                '{{ imp.foo() }}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "bar"/);
        }

        try {
            await render(
                '{% set bar = "BAR" %}' +
                '{% from "import-context.kumis" import foo without context %}' +
                '{{ foo() }}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "bar"/);
        }
    });

    it('should default to importing without context', async () => {
        try {
            await render(
                '{% set bar = "BAR" %}' +
                '{% import "import-context.kumis" as imp %}' +
                '{{ imp.foo() }}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "bar"/);
        }

        try {
            await render(
                '{% set bar = "BAR" %}' +
                '{% from "import-context.kumis" import foo %}' +
                '{{ foo() }}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "bar"/);
        }
    });

    it('should inherit templates', async () => {
        await equal('{% extends "base.kumis" %}', 'FooBarBazFizzle');
        await equal('hola {% extends "base.kumis" %} hizzle mumble', 'FooBarBazFizzle');

        await equal('{% extends "base.kumis" %}{% block block1 %}BAR{% endblock %}',
            'FooBARBazFizzle');

        await equal(
            '{% extends "base.kumis" %}' +
            '{% block block1 %}BAR{% endblock %}' +
            '{% block block2 %}BAZ{% endblock %}',
            'FooBARBAZFizzle');

        await equal('hola {% extends tmpl %} hizzle mumble',
            { tmpl: 'base.kumis' },
            'FooBarBazFizzle');
    });
    it('should not call blocks not defined from template inheritance', async () => {
        let count = 0;
        await render(
            '{% extends "base.kumis" %}' +
            '{% block notReal %}{{ foo() }}{% endblock %}',
            { foo: function() {
                count++;
            } });
        expect(count).to.be.equal(0);
    });

    it('should conditionally inherit templates', async () => {
        await equal(
            '{% if false %}{% extends "base.kumis" %}{% endif %}' +
            '{% block block1 %}BAR{% endblock %}',
            'BAR');

        await equal(
            '{% if true %}{% extends "base.kumis" %}{% endif %}' +
            '{% block block1 %}BAR{% endblock %}',
            'FooBARBazFizzle');

        await equal(
            '{% if true %}' +
            '{% extends "base.kumis" %}' +
            '{% else %}' +
            '{% extends "base2.kumis" %}' +
            '{% endif %}' +
            '{% block block1 %}HELLO{% endblock %}',
            'FooHELLOBazFizzle');

        await equal(
            '{% if false %}' +
            '{% extends "base.kumis" %}' +
            '{% else %}' +
            '{% extends "base2.kumis" %}' +
            '{% endif %}' +
            '{% block item %}hello{{ item }}{% endblock %}',
            'hello1hello2');
    });

    it('should error if same block is defined multiple times', async () => {
        try {
            await render('{% extends "simple-base.kumis" %}' +
                '{% block test %}{% endblock %}' +
                '{% block test %}{% endblock %}');
        } catch (err) {
            expect(err).to.match(/Block "test" defined more than once./);
        }
    });

    it('should render nested blocks in child template', async () => {
        await equal(
            '{% extends "base.kumis" %}' +
            '{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}',
            'FooBARBazFizzle');
    });

    it('should render parent blocks with super()', async () => {
        await equal(
            '{% extends "base.kumis" %}' +
            '{% block block1 %}{{ super() }}BAR{% endblock %}',
            'FooBarBARBazFizzle');

        // Two levels of `super` should work
        await equal(
            '{% extends "base-inherit.kumis" %}' +
            '{% block block1 %}*{{ super() }}*{% endblock %}',
            'Foo**Bar**BazFizzle');
    });

    it('should let super() see global vars from child template', async () => {
        await equal(
            '{% extends "base-show.kumis" %}{% set var = "child" %}' +
            '{% block main %}{{ super() }}{% endblock %}',
            'child');
    });

    it('should not let super() see vars from child block', async () => {
        try {
            await render(
                '{% extends "base-show.kumis" %}' +
                '{% block main %}{% set var = "child" %}{{ super() }}{% endblock %}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "var"/);
        }
    });

    it('should let child templates access parent global scope', async () => {
        await equal(
            '{% extends "base-set.kumis" %}' +
            '{% block main %}{{ var }}{% endblock %}',
            'parent');
    });

    it('should not let super() modify calling scope', async () => {
        try {
            await render(
                '{% extends "base-set-inside-block.kumis" %}' +
                '{% block main %}{{ super() }}{{ var }}{% endblock %}');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "var"/);
        }
    });

    it('should not let child templates set vars in parent scope', async () => {
        await equal(
            '{% extends "base-set-and-show.kumis" %}' +
            '{% block main %}{% set var = "child" %}{% endblock %}',
            'parent');
    });

    it('should render blocks in their own scope', async () => {
        await equal(
            '{% set var = "parent" %}' +
            '{% block main %}{% set var = "inner" %}{% endblock %}' +
            '{{ var }}',
            'parent');
    });

    it('should include templates', async () => {
        await equal('hello world {% include "include.kumis" %}', { name: null }, 'hello world FooInclude ');
    });

    it('should include 130 templates without call stack size exceed', async () => {
        await equal('{% include "includeMany.kumis" %}', { name: null },
            new Array(131).join('FooInclude \n'));
    });

    it('should include templates with context', async () => {
        await equal('hello world {% include "include.kumis" %}',
            {
                name: 'james',
            },
            'hello world FooInclude james');
    });

    it('should include templates that can see including scope, but not write to it', async () => {
        await equal('{% set var = 1 %}{% include "include-set.kumis" %}{{ var }}', '12\n1');
    });

    it('should include templates dynamically', async () => {
        await equal('hello world {% include tmpl %}',
            {
                name: 'thedude',
                tmpl: 'include.kumis',
            },
            'hello world FooInclude thedude');
    });

    it('should include templates dynamically based on a set var', async () => {
        await equal('hello world {% set tmpl = "include.kumis" %}{% include tmpl %}',
            {
                name: 'thedude',
            },
            'hello world FooInclude thedude');
    });

    it('should include templates dynamically based on an object attr', async () => {
        await equal('hello world {% include data.tmpl %}',
            {
                name: 'thedude',
                data: {
                    tmpl: 'include.kumis',
                },
            },
            'hello world FooInclude thedude');
    });

    it('should throw an error when including a file that does not exist', async () => {
        try {
            await render('{% include "missing.kumis" %}', {});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Template not found: missing\.kumis/);
        }
    });

    it('should fail silently on missing templates if requested', async () => {
        await equal('hello world {% include "missing.kumis" ignore missing %}',
            'hello world ');

        await equal('hello world {% include "missing.kumis" ignore missing %}',
            {
                name: 'thedude',
            },
            'hello world ');
    });

    it('should have access to "loop" inside an include', async () => {
        await equal('{% for item in [1,2,3] %}{% include "include-in-loop.kumis" %}{% endfor %}',
            '1,0,true\n2,1,false\n3,2,false\n');

        await equal('{% for k,v in items %}{% include "include-in-loop.kumis" %}{% endfor %}',
            {
                items: {
                    a: 'A',
                    b: 'B',
                },
            },
            '1,0,true\n2,1,false\n');
    });

    it('should maintain nested scopes', async () => {
        await equal(
            '{% for i in [1,2] %}' +
            '{% for i in [3,4] %}{{ i }}{% endfor %}' +
            '{{ i }}{% endfor %}',
            '341342');
    });

    it('should allow blocks in for loops', async () => {
        await equal(
            '{% extends "base2.kumis" %}' +
            '{% block item %}hello{{ item }}{% endblock %}',
            'hello1hello2');
    });

    it('should make includes inherit scope', async () => {
        await equal(
            '{% for item in [1,2] %}' +
            '{% include "item.kumis" %}' +
            '{% endfor %}',
            'showing 1showing 2');
    });

    it('should compile a set block', async () => {
        await equal('{% set username = "foo" %}{{ username }}', { username: 'james' }, 'foo');
        await equal('{% set x, y = "foo" %}{{ x }}{{ y }}', 'foofoo');
        await equal('{% set x = 1 + 2 %}{{ x }}', '3');

        await equal('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
            {
                foo: 2,
            },
            '2');

        await equal('{% include "set.kumis" %}{{ foo }}',
            {
                foo: 'bar',
            },
            'bar');

        await equal('{% set username = username + "pasta" %}{{ username }}',
            {
                username: 'basta',
            },
            'bastapasta');

        // `set` should only set within its current scope
        await equal('{% for i in [1] %}{% set val=5 %}{% endfor %}{{ val|default(\'\') }}', '');

        await equal(
            '{% for i in [1,2,3] %}' +
            '{% if val is not defined %}{% set val=5 %}{% endif %}' +
            '{% set val=val+1 %}{{ val }}' +
            '{% endfor %}' +
            'afterwards: {{ val|default(\'\') }}',
            '678afterwards: ');

        // However, like Python, if a variable has been set in an
        // Above scope, any other set should correctly resolve to
        // That frame
        await equal(
            '{% set val=1 %}' +
            '{% for i in [1] %}{% set val=5 %}{% endfor %}' +
            '{{ val }}',
            '5');

        await equal(
            '{% set val=5 %}' +
            '{% for i in [1,2,3] %}' +
            '{% set val=val+1 %}{{ val }}' +
            '{% endfor %}' +
            'afterwards: {{ val }}',
            '678afterwards: 8');
    });

    it('should compile set with frame references', async () => {
        await equal('{% set username = user.name %}{{ username }}',
            {
                user: {
                    name: 'james',
                },
            },
            'james');
    });

    it('should compile set assignments of the same variable', async () => {
        await equal(
            '{% set x = "hello" %}' +
            '{% if false %}{% set x = "world" %}{% endif %}' +
            '{{ x }}',
            'hello');

        await equal(
            '{% set x = "blue" %}' +
            '{% if true %}{% set x = "green" %}{% endif %}' +
            '{{ x }}',
            'green');
    });

    it('should compile block-set', async () => {
        await equal(
            '{% set block_content %}{% endset %}' +
            '{{ block_content }}',
            ''
        );

        await equal(
            '{%- macro foo(bar) -%}' +
            '{%- set test -%}foo{%- endset -%}' +
            '{{ bar }}{{ test }}' +
            '{%- endmacro -%}' +
            '{{ foo("bar") }}',
            'barfoo'
        );

        await equal(
            '{% set block_content %}test string{% endset %}' +
            '{{ block_content }}',
            'test string'
        );

        await equal(
            '{% set block_content %}' +
            '{% for item in [1, 2, 3] %}' +
            '{% include "item.kumis" %} ' +
            '{% endfor %}' +
            '{% endset %}' +
            '{{ block_content }}',
            'showing 1 showing 2 showing 3 '
        );

        await equal(
            '{% set block_content %}' +
            '{% set inner_block_content %}' +
            '{% for i in [1, 2, 3] %}' +
            'item {{ i }} ' +
            '{% endfor %}' +
            '{% endset %}' +
            '{% for i in [1, 2, 3] %}' +
            'inner {{i}}: "{{ inner_block_content }}" ' +
            '{% endfor %}' +
            '{% endset %}' +
            '{{ block_content | safe }}',
            'inner 1: "item 1 item 2 item 3 " ' +
            'inner 2: "item 1 item 2 item 3 " ' +
            'inner 3: "item 1 item 2 item 3 " '
        );

        await equal(
            '{% set x,y,z %}' +
            'cool' +
            '{% endset %}' +
            '{{ x }} {{ y }} {{ z }}',
            'cool cool cool'
        );
    });

    it('should compile block-set wrapping an inherited block', async () => {
        await equal(
            '{% extends "base-set-wraps-block.kumis" %}' +
            '{% block somevar %}foo{% endblock %}',
            'foo\n'
        );
    });

    it('should throw errors', async () => {
        try {
            await render('{% from "import.kumis" import boozle %}', {});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/cannot import 'boozle'/);
        }
    });

    it('should allow custom tag compilation', async () => {
        class TestExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'test';
                        }

                        parse(parser, extension) {
                            parser.advanceAfterBlockEnd();

                            const content = parser.parseUntilBlocks('endtest');
                            const tag = new Node.CallExtension(extension, 'run', null, [ content ]);
                            parser.advanceAfterBlockEnd();

                            return tag;
                        }
                    }(),
                ];
            }

            async run(context, content) {
                // Reverse the string
                return (await content()).split('').reverse().join('');
            }
        }

        await equal('{% test %}123456789{% endtest %}', null,
            { extensions: [ new TestExtension() ] },
            '987654321');
    });

    it('should allow custom tag compilation without content', async () => {
        class TestExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'test';
                        }

                        parse(parser, extension) {
                            const tok = parser.nextToken();
                            const args = parser.parseSignature(null, true);
                            parser.advanceAfterBlockEnd(tok.value);

                            return new Node.CallExtension(extension, 'run', args, null);
                        }
                    }(),
                ];
            }

            run(context, arg1) {
                // Reverse the string
                return arg1.split('').reverse().join('');
            }
        }

        await equal('{% test "123456" %}', null,
            { extensions: [ new TestExtension() ] },
            '654321');
    });

    it('should allow complicated custom tag compilation', async () => {
        class TestExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'test';
                        }

                        parse(parser, extension) {
                            let intermediate = null;

                            parser.advanceAfterBlockEnd();
                            const body = parser.parseUntilBlocks('intermediate', 'endtest');

                            if (parser.skipSymbol('intermediate')) {
                                parser.skip(Tokenizer.TOKEN_BLOCK_END);
                                intermediate = parser.parseUntilBlocks('endtest');
                            }

                            parser.advanceAfterBlockEnd();

                            return new Node.CallExtension(extension, 'run', null, [ body, intermediate ]);
                        }
                    }(),
                ];
            }

            async run(context, body, intermediate) {
                let output = (await body()).split('').join(',');
                if (intermediate) {
                    // Reverse the string.
                    output += (await intermediate()).split('').reverse().join('');
                }

                return output;
            }
        }

        await equal('{% test %}abcdefg{% endtest %}', null,
            { extensions: [ new TestExtension() ] },
            'a,b,c,d,e,f,g');

        await equal('{% test %}abcdefg{% intermediate %}second half{% endtest %}',
            null,
            { extensions: [ new TestExtension() ] },
            'a,b,c,d,e,f,gflah dnoces');
    });

    it('should allow custom tag with args compilation', async () => {
        class TestExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'test';
                        }

                        parse(parser, extension) {
                            const tok = parser.nextToken();

                            // Passing true makes it tolerate when no args exist
                            const args = parser.parseSignature(true);
                            parser.advanceAfterBlockEnd(tok.value);

                            const body = parser.parseUntilBlocks('endtest');
                            parser.advanceAfterBlockEnd();

                            return new Node.CallExtension(extension, 'run', args, [ body ]);
                        }
                    }(),
                ];
            }

            async run(context, prefix, kwargs, body) {
                let output;
                if ('function' === typeof prefix) {
                    body = prefix;
                    prefix = '';
                    kwargs = {};
                } else if ('function' === typeof kwargs) {
                    body = kwargs;
                    kwargs = {};
                }

                output = prefix + (await body()).split('').reverse().join('');
                if (kwargs.cutoff) {
                    output = output.slice(0, kwargs.cutoff);
                }

                return output;
            }
        }

        const opts = {
            extensions: [
                new TestExtension(),
            ],
        };

        await equal(
            '{% test %}foobar{% endtest %}', null, opts,
            'raboof');

        await equal(
            '{% test("biz") %}foobar{% endtest %}', null, opts,
            'bizraboof');

        await equal(
            '{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts,
            'bizra');
    });

    it('should autoescape by default', async () => {
        await equal('{{ foo }}', {
            foo: '"\'<>&',
        }, '&quot;&#39;&lt;&gt;&amp;');
    });

    it('should autoescape if autoescape is on', async () => {
        await equal(
            '{{ foo }}',
            { foo: '"\'<>&' },
            { autoescape: true },
            '&quot;&#39;&lt;&gt;&amp;');

        await equal('{{ foo|reverse }}',
            { foo: '"\'<>&' },
            { autoescape: true },
            '&amp;&gt;&lt;&#39;&quot;');

        await equal(
            '{{ foo|reverse|safe }}',
            { foo: '"\'<>&' },
            { autoescape: true },
            '&><\'"');

        await equal(
            '{{ foo }}',
            { foo: null },
            { autoescape: true },
            '');

        await equal(
            '{{ foo }}',
            { foo: [ '<p>foo</p>' ] },
            { autoescape: true },
            '&lt;p&gt;foo&lt;/p&gt;');

        await equal(
            '{{ foo }}',
            { foo: { toString: function() {
                return '<p>foo</p>';
            } } },
            { autoescape: true },
            '&lt;p&gt;foo&lt;/p&gt;');

        await equal('{{ foo | safe }}',
            { foo: null },
            { autoescape: true },
            '');

        await equal(
            '{{ foo | safe }}',
            { foo: '<p>foo</p>' },
            { autoescape: true },
            '<p>foo</p>');

        await equal(
            '{{ foo | safe }}',
            { foo: [ '<p>foo</p>' ] },
            { autoescape: true },
            '<p>foo</p>');

        await equal(
            '{{ foo | safe }}',
            { foo: { toString: function() {
                return '<p>foo</p>';
            } } },
            { autoescape: true },
            '<p>foo</p>');
    });

    it('should not autoescape safe strings', async () => {
        await equal(
            '{{ foo|safe }}',
            { foo: '"\'<>&' },
            { autoescape: true },
            '"\'<>&');
    });

    it('should not autoescape macros', async () => {
        expect(await render(
            '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
            '{{ foo("<>&", "<>") }}', null, {
                autoescape: true,
            })).to.be.equal('&lt;&gt;&amp; and &lt;&gt;');

        expect(await render(
            '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
            '{{ foo("<>&", "<>") }}', null, {
                autoescape: true,
            })).to.be.equal('<>& and &lt;&gt;');
    });

    it('should not autoescape super()', async () => {
        expect(await render('{% extends "base3.kumis" %}' +
            '{% block block1 %}{{ super() }}{% endblock %}',
        null, {
            autoescape: true,
        })).to.be.equal('<b>Foo</b>');
    });

    it('should not autoescape when extension set false', async () => {
        class TestExtension extends AbstractExtension {
            get tags() {
                return [
                    new class extends implementationOf(TagInterface) {
                        get name() {
                            return 'test';
                        }

                        parse(parser, extension) {
                            const tok = parser.nextToken();
                            const args = parser.parseSignature(null, true);
                            parser.advanceAfterBlockEnd(tok.value);

                            return new Node.CallExtension(extension, 'run', args, null, { autoescape: false });
                        }
                    }(),
                ];
            }

            run() {
                // Reverse the string
                return '<b>Foo</b>';
            }
        }

        expect(await render('{% test "123456" %}', null, {
            extensions: [ new TestExtension() ],
            autoescape: true,
        })).to.be.equal('<b>Foo</b>');
    });

    it('should pass context as this to filters', async () => {
        expect(await render(
            '{{ foo | hallo }}',
            { foo: 1, bar: 2 }, {
                filters: {
                    hallo: function(foo) {
                        return foo + this.lookup('bar');
                    },
                },
            })).to.be.equal('3');
    });

    it('should render regexs', async () => {
        await equal('{{ r/name [0-9] \\// }}', '/name [0-9] \\//');
        await equal('{{ r/x/gi }}', '/x/gi');
    });

    it('should throw an error when {% call %} is passed an object that is not a function', async () => {
        try {
            await render('{% call foo() %}{% endcall %}', {foo: 'bar'});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Unable to call `\w+`, which is not a function/);
        }
    });

    it('should throw an error when including a file that calls an undefined macro', async () => {
        try {
            await render('{% include "undefined-macro.kumis" %}', {});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Undefined variable "\w+"/);
        }
    });

    it('should throw an error when including a file that calls an undefined macro even inside {% if %} tag', async () => {
        try {
            await render('{% if true %}{% include "undefined-macro.kumis" %}{% endif %}', {});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Undefined variable "\w+"/);
        }
    });

    it('should throw an error when including a file that imports macro that calls an undefined macro', async () => {
        try {
            await render('{% include "import-macro-call-undefined-macro.kumis" %}', { list: [ 1, 2, 3 ] });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Undefined variable "\w+"/);
        }
    });

    it('should control whitespaces correctly', async () => {
        await equal(
            '{% if true -%}{{"hello"}} {{"world"}}{% endif %}',
            'hello world');

        await equal(
            '{% if true -%}{% if true %} {{"hello"}} {{"world"}}'
            + '{% endif %}{% endif %}',
            ' hello world');

        await equal(
            '{% if true -%}{# comment #} {{"hello"}}{% endif %}',
            ' hello');
    });

    it('should control expression whitespaces correctly', async () => {
        await equal(
            'Well, {{- \' hello, \' -}} my friend',
            'Well, hello, my friend'
        );

        await equal(' {{ 2 + 2 }} ', ' 4 ');
        await equal(' {{-2 + 2 }} ', '4 ');
        await equal(' {{ -2 + 2 }} ', ' 0 ');
        await equal(' {{ 2 + 2 -}} ', ' 4');
    });

    it('should get right value when macro parameter conflict with global macro name', async () => {
        expect((await render(
            '{# macro1 and macro2 definition #}' +
            '{% macro macro1() %}' +
            '{% endmacro %}' +
            '' +
            '{% macro macro2(macro1="default") %}' +
            '{{macro1}}' +
            '{% endmacro %}' +
            '' +
            '{# calling macro2 #}' +
            '{{macro2("this should be outputted") }}', {}, {})).trim())
            .to.eql('this should be outputted');
    });

    it('should get right value when macro include macro', async () => {
        expect((await render(
            '{# macro1 and macro2 definition #}' +
            '{% macro macro1() %} foo' +
            '{% endmacro %}' +
            '' +
            '{% macro macro2(text="default") %}' +
            '{{macro1()}}' +
            '{% endmacro %}' +
            '' +
            '{# calling macro2 #}' +
            '{{macro2("this should not be outputted") }}', {}, {})).trim())
            .to.eql('foo');
    });

    it('should allow access to outer scope in call blocks', async () => {
        expect((await render(
            '{% macro inside() %}' +
            '{{ caller() }}' +
            '{% endmacro %}' +
            '{% macro outside(var) %}' +
            '{{ var }}\n' +
            '{% call inside() %}' +
            '{{ var }}' +
            '{% endcall %}' +
            '{% endmacro %}' +
            '{{ outside("foobar") }}', {}, {})).trim())
            .to.eql('foobar\nfoobar');
    });

    it('should not leak scope from call blocks to parent', async () => {
        expect((await render(
            '{% set var = "expected" %}' +
            '{% macro inside() %}' +
            '{% set var = "incorrect-value" %}' +
            '{{ caller() }}' +
            '{% endmacro %}' +
            '{% macro outside() %}' +
            '{% call inside() %}' +
            '{% endcall %}' +
            '{% endmacro %}' +
            '{{ outside() }}' +
            '{{ var }}', {}, {})).trim())
            .to.eql('expected');
    });


    it('should import template objects', async () => {
        const tmpl = new Template('{% macro foo() %}Inside a macro{% endmacro %}' +
            '{% set bar = "BAZ" %}');

        await equal(
            '{% import tmpl as imp %}' +
                '{{ imp.foo() }} {{ imp.bar }}',
            {
                tmpl: tmpl,
            },
            'Inside a macro BAZ');

        await equal(
            '{% from tmpl import foo as baz, bar %}' +
            '{{ bar }} {{ baz() }}',
            {
                tmpl: tmpl,
            },
            'BAZ Inside a macro');
    });

    it('should inherit template objects', async () => {
        const tmpl = new Template('Foo{% block block1 %}Bar{% endblock %}' +
            '{% block block2 %}Baz{% endblock %}Whizzle');

        await equal('hola {% extends tmpl %} fizzle mumble',
            {
                tmpl: tmpl,
            },
            'FooBarBazWhizzle');

        await equal(
            '{% extends tmpl %}' +
                '{% block block1 %}BAR{% endblock %}' +
                '{% block block2 %}BAZ{% endblock %}',
            {
                tmpl: tmpl,
            },
            'FooBARBAZWhizzle');
    });

    it('should include template objects', async () => {
        const tmpl = new Template('FooInclude {{ name }}');

        await equal('hello world {% include tmpl %}',
            {
                name: 'thedude',
                tmpl: tmpl,
            },
            'hello world FooInclude thedude');
    });

    it('should throw an error when invalid expression whitespaces are used', async () => {
        try {
            await render(' {{ 2 + 2- }}');
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/unexpected token: }}/);
        }
    });
});

describe('the filter tag', function() {
    it('should apply the title filter to the body', async () => {
        await equal('{% filter title %}may the force be with you{% endfilter %}',
            'May The Force Be With You');
    });

    it('should apply the replace filter to the body', async () => {
        await equal('{% filter replace("force", "forth") %}may the force be with you{% endfilter %}',
            'may the forth be with you');
    });

    it('should work with variables in the body', async () => {
        await equal('{% set foo = "force" %}{% filter replace("force", "forth") %}may the {{ foo }} be with you{% endfilter %}',
            'may the forth be with you');
    });

    it('should work with blocks in the body', async () => {
        await equal(
            '{% extends "filter-block.html" %}' +
            '{% block block1 %}force{% endblock %}',
            'may the forth be with you\n');

    });
});
