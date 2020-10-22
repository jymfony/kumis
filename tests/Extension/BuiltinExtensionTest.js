import { render, equal } from '../util';
import { expect } from 'chai';

const Environment = Kumis.Environment;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const SafeString = Kumis.Util.SafeString;

describe('global', function() {
    it('should have range', async () => {
        await equal('{% for i in range(0, 10) %}{{ i }}{% endfor %}', '0123456789');
        await equal('{% for i in range(10) %}{{ i }}{% endfor %}', '0123456789');
        await equal('{% for i in range(5, 10) %}{{ i }}{% endfor %}', '56789');
        await equal('{% for i in range(-2, 0) %}{{ i }}{% endfor %}', '-2-1');
        await equal('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}', '579');
        await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');
        await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');

        await equal('{% for i in range(10, 5, -1) %}{{ i }}{% endfor %}', '109876');
        await equal('{% for i in range(10, 5, -2.5) %}{{ i }}{% endfor %}', '107.5');
    });

    it('should have cycler', async () => {
        await equal(
            '{% set cls = cycler("odd", "even") %}' +
            '{{ cls.next() }}' +
            '{{ cls.next() }}' +
            '{{ cls.next() }}',
            'oddevenodd');

        await equal(
            '{% set cls = cycler("odd", "even") %}' +
            '{{ cls.next() }}' +
            '{{ cls.reset() }}' +
            '{{ cls.next() }}',
            'oddodd');

        await equal(
            '{% set cls = cycler("odd", "even") %}' +
            '{{ cls.next() }}' +
            '{{ cls.next() }}' +
            '{{ cls.current }}',
            'oddeveneven');
    });

    it('should have joiner', async () => {
        await equal(
            '{% set comma = joiner() %}' +
            'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}',
            'foobar,baz,');

        await equal(
            '{% set pipe = joiner("|") %}' +
            'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}',
            'foobar|baz|');
    });

    it('should allow addition of globals', async () => {
        const env = Environment.create();
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello: arg1 => 'Hello ' + arg1,
                };
            }
        }());

        await equal('{{ hello("World!") }}', 'Hello World!', env);
    });

    it('should allow chaining of globals', async () => {
        const env = Environment.create();
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello: arg1 => 'Hello ' + arg1,
                    goodbye: arg1 => 'Goodbye ' + arg1,
                };
            }
        }());

        await equal('{{ hello("World!") }}', 'Hello World!', env);
        await equal('{{ goodbye("World!") }}', 'Goodbye World!', env);
    });

    it('should allow getting of globals', async () => {
        const env = Environment.create();
        const hello = arg1 => 'Hello ' + arg1;
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello,
                };
            }
        }());

        expect(env.globals.hello).to.be.equal(hello);
    });

    it('should allow getting boolean globals', async () => {
        const env = Environment.create();
        const hello = false;
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello,
                };
            }
        }());

        expect(env.globals.hello).to.be.equal(hello);
    });

    it('should pass context as this to global functions', async () => {
        const env = Environment.create();
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello: function() {
                        return 'Hello ' + this.lookup('user');
                    },
                };
            }
        }());

        await equal('{{ hello() }}', {
            user: 'James',
        }, 'Hello James', env);
    });

    it('should be exclusive to each environment', async () => {
        const env = Environment.create();
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello: 'konichiwa',
                };
            }
        }());

        const env2 = Environment.create();
        expect(env2.globals.hello).to.be.undefined;
    });

    it('should return errors from globals', async () => {
        const env = Environment.create();
        env.addExtension(new class extends AbstractExtension {
            get name() {
                return 'test';
            }

            get globals() {
                return {
                    hello: () => {
                        throw new Error('Global error');
                    },
                };
            }
        }());

        try {
            await render('{{ err() }}', null, {}, env);
        } catch (e) {
            expect(e).to.be.instanceOf(Error);
        }
    });
});

describe('filter', function () {
    it('abs', async () => {
        await equal('{{ -3|abs }}', '3');
        await equal('{{ -3.456|abs }}', '3.456');
    });

    it('batch', async () => {
        await equal([
            '{% for a in [1,2,3,4,5,6]|batch(2) %}',
            '-{% for b in a %}',
            '{{ b }}',
            '{% endfor %}-',
            '{% endfor %}',
        ].join(''), '-12--34--56-');
    });

    it('capitalize', async () => {
        await equal('{{ "foo" | capitalize }}', 'Foo');
        await equal('{{ str | capitalize }}', {
            str: SafeString.markSafe('foo'),
        }, 'Foo');
        await equal('{{ null | capitalize }}', '');
        await equal('{{ nothing | capitalize }}', { nothing: undefined }, '');
    });

    it('center', async () => {
        await equal('{{ "fooo" | center }}', ' '.repeat(38) + 'fooo' + ' '.repeat(38));
        await equal('{{ str | center }}', {
            str: SafeString.markSafe('fooo'),
        }, ' '.repeat(38) + 'fooo' + ' '.repeat(38));

        await equal('{{ null | center }}', ' '.repeat(40) + '' + ' '.repeat(40));
        await equal('{{ nothing | center }}', { nothing: undefined }, ' '.repeat(40) + '' + ' '.repeat(40));
        await equal('{{ "foo" | center }}', ' '.repeat(37) + 'foo' + ' '.repeat(38));
    });

    it('default', async () => {
        await equal('{{ bar | default("foo") }}', {
            bar: null,
        }, '');
        await equal('{{ false | default("foo") }}', 'false');
        await equal('{{ false | default("foo", true) }}', 'foo');
        await equal('{{ bar | default("foo") }}', 'foo');
        await equal('{{ "bar" | default("foo") }}', 'bar');
    });

    it('escape', async () => {
        await equal('{{ "<html>" | escape }}', {}, { autoescape: false }, '&lt;html&gt;');
    });

    it('escape skip safe', async () => {
        await equal('{{ "<html>" | safe | escape }}', {}, { autoescape: false }, '<html>');
    });

    it('should not double escape strings', async () => {
        await equal('{{ "<html>" | escape | escape }}', {}, { autoescape: false }, '&lt;html&gt;');
    });

    it('should not double escape with autoescape on', async () => {
        await equal('{% set val = "<html>" | escape %}{{ val }}', {}, { autoescape: true }, '&lt;html&gt;');
    });

    it('should work with non-string values', async () => {
        await equal('{{ foo | escape }}', { foo: [ '<html>' ] }, { autoescape: false }, '&lt;html&gt;');
        await equal('{{ foo | escape }}', {
            foo: { toString: () => '<html>' },
        }, { autoescape: false }, '&lt;html&gt;');

        await equal('{{ foo | escape }}', { foo: null }, { autoescape: false }, '');
    });

    it('should not escape safe strings with autoescape on', async () => {
        await equal('{{ "<html>" | safe | escape }}', {}, { autoescape: true }, '<html>');
        await equal('{% set val = "<html>" | safe | e %}{{ val }}', {}, { autoescape: true }, '<html>');
    });

    it('should keep strings escaped after they have been escaped', async () => {
        await equal('{% set val = "<html>" | e | safe %}{{ val }}', {}, { autoescape: false }, '&lt;html&gt;');
    });

    it('dictsort', async () => {
        // No real foolproof way to test that a js obj has been transformed
        // From unsorted -> sorted, as its enumeration ordering is undefined
        // And might fluke being sorted originally .. lets just init with some jumbled
        // Keys

        // No params - should be case insensitive, by key
        await equal('{% for item in items | dictsort %}' +
            '{{ item[0] }}{% endfor %}', {
            items: {
                e: 1,
                d: 2,
                c: 3,
                a: 4,
                f: 5,
                b: 6,
            },
        }, 'abcdef');

        // Case sensitive = true
        await equal('{% for item in items | dictsort(true) %}{{ item[0] }},{% endfor %}', {
            items: {
                ABC: 6,
                ABc: 5,
                Abc: 1,
                abc: 2,
            },
        }, 'ABC,ABc,Abc,abc,');

        // Use values for sort
        await equal('{% for item in items | dictsort(false, "value") %}{{ item[0] }}{% endfor %}', {
            items: {
                a: 6,
                b: 5,
                c: 1,
                d: 2,
            },
        }, 'cdba');
    });

    it('first', async () => {
        await equal('{{ [1,2,3] | first }}', '1');
    });

    it('float', async () => {
        await equal('{{ "3.5" | float }}', '3.5');
        await equal('{{ "0" | float }}', '0');
    });

    it('forceescape', async () => {
        await equal('{{ str | forceescape }}', { str: SafeString.markSafe('<html>')}, '&lt;html&gt;');
        await equal('{{ "<html>" | safe | forceescape }}', '&lt;html&gt;');
    });

    it('int', async () => {
        await equal('{{ "3.5" | int }}', '3');
        await equal('{{ "0" | int }}', '0');
    });

    it('int (default value)', async () => {
        await equal('{{ "bob" | int("cat") }}', 'cat');
    });

    it('float (default value)', async () => {
        await equal('{{ "bob" | float("cat") }}', 'cat');
    });

    it('groupby', async () => {
        await equal(
            '{% for type, items in items | groupby("type") %}' +
            ':{{ type }}:' +
            '{% for item in items %}' +
            '{{ item.name }}' +
            '{% endfor %}' +
            '{% endfor %}',
            {
                items: [ {
                    name: 'james',
                    type: 'green',
                },
                {
                    name: 'john',
                    type: 'blue',
                },
                {
                    name: 'jim',
                    type: 'blue',
                },
                {
                    name: 'jessie',
                    type: 'green',
                } ],
            },
            ':green:jamesjessie:blue:johnjim');
    });

    it('indent', async () => {
        await equal('{{ "one\ntwo\nthree" | indent }}', 'one\n    two\n    three\n');
        await equal('{{ "one\ntwo\nthree" | indent(2) }}', 'one\n  two\n  three\n');
        await equal('{{ "one\ntwo\nthree" | indent(2, true) }}', '  one\n  two\n  three\n');

        await equal('{{ str | indent }}', {
            str: SafeString.markSafe('one\ntwo\nthree'),
        }, 'one\n    two\n    three\n');

        await equal('{{ "" | indent }}', '');

        await equal('{{ null | indent }}', '');
        await equal('{{ null | indent(2) }}', '');
        await equal('{{ null | indent(2, true) }}', '');

        await equal('{{ nothing | indent }}', { nothing: undefined }, '');
        await equal('{{ nothing | indent(2) }}', { nothing: undefined }, '');
        await equal('{{ nothing | indent(2, true) }}', { nothing: undefined }, '');
    });

    it('join', async () => {
        await equal('{{ items | join }}', {
            items: [ 1, 2, 3 ],
        }, '123');

        await equal('{{ items | join(",") }}', {
            items: [ 'foo', 'bar', 'bear' ],
        }, 'foo,bar,bear');

        await equal('{{ items | join(",", "name") }}', {
            items: [ {
                name: 'foo',
            },
            {
                name: 'bar',
            },
            {
                name: 'bear',
            } ],
        }, 'foo,bar,bear');
    });

    it('last', async () => {
        await equal('{{ [1,2,3] | last }}', '3');
    });

    describe('the length filter', function() {
        it('should return length of a list literal', async () => {
            await equal('{{ [1,2,3] | length }}', '3');
        });

        it('should output string length for string variables', async () => {
            await equal('{{ str | length }}', {
                str: 'blah',
            }, '4');
        });

        it('should output string length for a SafeString variable', async () => {
            await equal('{{ str | length }}', {
                str: SafeString.markSafe('<blah>'),
            }, '6');
        });

        it('should output the correct length of a string created with new String()', async () => {
            await equal('{{ str | length }}', {
                str: new String('blah'), // eslint-disable-line no-new-wrappers
            }, '4');
        });

        it('should output 0 for a literal "null"', async () => {
            await equal('{{ null | length }}', '0');
        });

        it('should output 0 for an Object with no properties', async () => {
            await equal('{{ obj | length }}', {
                obj: {},
            }, '0');
        });

        it('should output 1 for an Object with 1 property', async () => {
            await equal('{{ obj | length }}', {
                obj: {
                    key: 'value',
                },
            }, '1');
        });

        it('should output the number of properties for a plain Object, not the value of its length property', async () => {
            await equal('{{ obj | length }}', {
                obj: {
                    key: 'value',
                    length: 5,
                },
            }, '2');
        });

        it('should output the length of an array', async () => {
            await equal('{{ arr | length }}', {
                arr: [ 0, 1 ],
            }, '2');
        });

        it('should output the full length of a sparse array', async () => {
            await equal('{{ arr | length }}', {
                arr: [0,, 2]  // eslint-disable-line
            }, '3');
        });

        it('should output the length of an array created with "new Array"', async () => {
            await equal('{{ arr | length }}', {
                arr: new Array(0, 1), // eslint-disable-line no-array-constructor
            }, '2');
        });

        it('should output the length of an array created with "new Array" with user-defined properties', async () => {
            const arr = new Array(0, 1); // eslint-disable-line no-array-constructor
            arr.key = 'value';
            await equal('{{ arr | length }}', {
                arr: arr,
            }, '2');
        });

        it('should output the length of a Map', async () => {
            /* global Map */
            const map = new Map([ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ]);
            map.set('key3', 'value3');
            await equal('{{ map | length }}', {
                map: map,
            }, '3');
        });

        it('should output the length of a Set', async () => {
            /* global Set */
            const set = new Set([ 'value1' ]);
            set.add('value2');
            await equal('{{ set | length }}', { set: set }, '2');
        });
    });

    it('list', async () => {
        const person = {
            name: 'Joe',
            age: 83,
        };
        await equal('{% for i in "foobar" | list %}{{ i }},{% endfor %}',
            'f,o,o,b,a,r,');
        await equal('{% for pair in person | list %}{{ pair.key }}: {{ pair.value }} - {% endfor %}',
            {
                person: person,
            }, 'name: Joe - age: 83 - ');
        await equal('{% for i in [1, 2] | list %}{{ i }}{% endfor %}', '12');
    });

    it('lower', async () => {
        await equal('{{ "fOObAr" | lower }}', 'foobar');
        await equal('{{ str | lower }}', {
            str: SafeString.markSafe('fOObAr'),
        }, 'foobar');
        await equal('{{ null | lower }}', '');
        await equal('{{ nothing | lower }}', { nothing: undefined }, '');
    });

    it('nl2br', async () => {
        await equal('{{ null | nl2br }}', '');
        await equal('{{ nothing | nl2br }}', { nothing: undefined }, '');
        await equal('{{ str | nl2br }}', {
            str: SafeString.markSafe('foo\r\nbar'),
        }, 'foo<br />\nbar');
        await equal('{{ str | nl2br }}', {
            str: SafeString.markSafe('foo\nbar'),
        }, 'foo<br />\nbar');
        await equal('{{ str | nl2br }}', {
            str: SafeString.markSafe('foo\n\nbar'),
        }, 'foo<br />\n<br />\nbar');
        await equal('{{ "foo\nbar" | nl2br }}', 'foo&lt;br /&gt;\nbar');
    });

    it('random', async () => {
        let i;
        for (i = 0; 100 > i; i++) {
            const val = ~~(await render('{{ [1,2,3,4,5,6,7,8,9] | random }}'));
            expect(val).to.be.within(1, 9);
        }
    });

    it('rejectattr', async () => {
        const foods = [ {
            tasty: true,
        }, {
            tasty: false,
        }, {
            tasty: true,
        } ];
        await equal('{{ foods | rejectattr("tasty") | length }}', {
            foods: foods,
        }, '1');
    });

    it('selectattr', async () => {
        const foods = [ {
            tasty: true,
        }, {
            tasty: false,
        }, {
            tasty: true,
        } ];
        await equal('{{ foods | selectattr("tasty") | length }}', {
            foods: foods,
        }, '2');
    });

    it('replace', async () => {
        await equal('{{ 123456 | replace("4", ".") }}', '123.56');
        await equal('{{ 123456 | replace("4", ".") }}', '123.56');
        await equal('{{ 12345.6 | replace("4", ".") }}', '123.5.6');
        await equal('{{ 12345.6 | replace(4, ".") }}', '123.5.6');
        await equal('{{ 12345.6 | replace("4", "7") }}', '12375.6');
        await equal('{{ 12345.6 | replace(4, 7) }}', '12375.6');
        await equal('{{ 123450.6 | replace(0, 7) }}', '123457.6');
        await equal('{{ "aaabbbccc" | replace("", ".") }}', '.a.a.a.b.b.b.c.c.c.');
        await equal('{{ "aaabbbccc" | replace(null, ".") }}', 'aaabbbccc');
        await equal('{{ "aaabbbccc" | replace({}, ".") }}', 'aaabbbccc');
        await equal('{{ "aaabbbccc" | replace(true, ".") }}', 'aaabbbccc');
        await equal('{{ "aaabbbccc" | replace(false, ".") }}', 'aaabbbccc');
        await equal('{{ "aaabbbccc" | replace(["wrong"], ".") }}', 'aaabbbccc');
        await equal('{{ "aaabbbccc" | replace("a", "x") }}', 'xxxbbbccc');
        await equal('{{ "aaabbbccc" | replace("a", "x", 2) }}', 'xxabbbccc');
        await equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
        await equal('{{ "aaabbbbbccc" | replace("", "") }}', 'aaabbbbbccc');
        await equal('{{ "aaabbbbbccc" | replace("b", "") }}', 'aaaccc');
        await equal('{{ "aaabbbbbccc" | replace("b", "", 4) }}', 'aaabccc');
        await equal('{{ "aaabbbbbccc" | replace("ab", "y", 4) }}', 'aaybbbbccc');
        await equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
        await equal('{{ "aaabbbbbccc" | replace("d", "y", 4) }}', 'aaabbbbbccc');
        await equal('{{ "aaabbcccbbb" | replace("b", "y", 4) }}', 'aaayycccyyb');


        // Bad initial inputs
        await equal('{{ null | replace("b", "y", 4) }}', '');
        await equal('{{ {} | replace("b", "y", 4) }}', '[object Object]'); // End up with the object passed out of replace, then toString called on it
        await equal('{{ [] | replace("b", "y", 4) }}', '');
        await equal('{{ true | replace("rue", "afafasf", 4) }}', 'true');
        await equal('{{ false | replace("rue", "afafasf", 4) }}', 'false');

        // Will result in an infinite loop if unbounded otherwise test will pass
        await equal('{{ "<img src=" | replace("<img", "<img alt=val") | safe }}',
            '<img alt=val src=');
        await equal('{{ "<img src=\\"http://www.example.com\\" />" | replace("<img", "replacement text") | safe }}',
            'replacement text src=\"http://www.example.com\" />');

        // Regex
        await equal('{{ "aabbbb" | replace(r/ab{2}/, "z") }}', 'azbb');
        await equal('{{ "aaaAAA" | replace(r/a/i, "z") }}', 'zaaAAA');
        await equal('{{ "aaaAAA" | replace(r/a/g, "z") }}', 'zzzAAA');
        await equal('{{ "aaaAAA" | replace(r/a/gi, "z") }}', 'zzzzzz');
        await equal('{{ str | replace("a", "x") }}', {
            str: SafeString.markSafe('aaabbbccc'),
        }, 'xxxbbbccc');
    });

    it('reverse', async () => {
        await equal('{{ "abcdef" | reverse }}', 'fedcba');
        await equal('{% for i in [1, 2, 3, 4] | reverse %}{{ i }}{% endfor %}', '4321');
    });

    it('round', async () => {
        await equal('{{ 4.5 | round }}', '5');
        await equal('{{ 4.5 | round(0, "floor") }}', '4');
        await equal('{{ 4.12345 | round(4) }}', '4.1235');
        await equal('{{ 4.12344 | round(4) }}', ('4.1234'));
    });

    it('slice', async () => {
        const tmpl = '{% for items in arr | slice(3) %}' +
            '--' +
            '{% for item in items %}' +
            '{{ item }}' +
            '{% endfor %}' +
            '--' +
            '{% endfor %}'
        ;

        await equal(tmpl,
            {
                arr: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
            },
            '--123----456----789--');

        await equal(tmpl,
            {
                arr: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
            },
            '--1234----567----8910--');
    });

    it('sum', async () => {
        await equal('{{ items | sum }}',
            {
                items: [ 1, 2, 3 ],
            },
            '6');

        await equal('{{ items | sum("value") }}',
            {
                items: [ {
                    value: 1,
                },
                {
                    value: 2,
                },
                {
                    value: 3,
                } ],
            },
            '6');

        await equal('{{ items | sum("value", 10) }}',
            {
                items: [
                    {value: 1},
                    {value: 2},
                    {value: 3},
                ],
            },
            '16');
    });

    it('sort', async () => {
        await equal('{% for i in [3,5,2,1,4,6] | sort %}{{ i }}{% endfor %}', '123456');
        await equal('{% for i in ["fOo", "Foo"] | sort %}{{ i }}{% endfor %}', 'fOoFoo');
        await equal('{% for i in [1,6,3,7] | sort(true) %}{{ i }}{% endfor %}', '7631');
        await equal('{% for i in ["fOo", "Foo"] | sort(false, true) %}{{ i }}{% endfor %}', 'FoofOo');

        await equal('{% for item in items | sort(false, false, "name") %}{{ item.name }}{% endfor %}', {
            items: [
                {name: 'james'},
                {name: 'fred'},
                {name: 'john'},
            ],
        }, 'fredjamesjohn');

        await equal('{% for i in [ {n:3},{n:5},{n:2},{n:1},{n:4},{n:6}] | sort(attribute="n") %}{{ i.n }}{% endfor %}', '123456');
    });

    it('string', async () => {
        await equal('{% for i in 1234 | string | list %}{{ i }},{% endfor %}', '1,2,3,4,');
    });

    it('striptags', async () => {
        await equal('{{ html | striptags }}', {
            html: '<foo>bar',
        }, 'bar');
        await equal('{{ html | striptags }}', {
            html: '  <p>an  \n <a href="#">example</a> link</p>\n<p>to a webpage</p> ' +
                '<!-- <p>and some comments</p> -->',
        }, 'an example link to a webpage');
        await equal('{{ null | striptags }}', '');
        await equal('{{ nothing | striptags }}', { nothing: undefined }, '');
        await equal('{{ html | striptags(true) }}', {
            html: '<div>\n  row1\nrow2  \n  <strong>row3</strong>\n</div>\n\n' +
            ' HEADER \n\n<ul>\n  <li>option  1</li>\n<li>option  2</li>\n</ul>',
        }, 'row1\nrow2\nrow3\n\nHEADER\n\noption 1\noption 2');
    });

    it('title', async () => {
        await equal('{{ "foo bar baz" | title }}', 'Foo Bar Baz');
        await equal('{{ str | title }}', {
            str: SafeString.markSafe('foo bar baz'),
        }, 'Foo Bar Baz');
        await equal('{{ null | title }}', '');
        await equal('{{ nothing | title }}', { nothing: undefined }, '');
    });

    it('trim', async () => {
        await equal('{{ "  foo " | trim }}', 'foo');
        await equal('{{ str | trim }}', {
            str: SafeString.markSafe('  foo '),
        }, 'foo');
    });

    it('truncate', async () => {
        await equal('{{ "foo bar" | truncate(3) }}', 'foo...');
        await equal('{{ "foo bar baz" | truncate(6) }}', 'foo...');
        await equal('{{ "foo bar baz" | truncate(7) }}', 'foo bar...');
        await equal('{{ "foo bar baz" | truncate(5, true) }}', 'foo b...');
        await equal('{{ "foo bar baz" | truncate(6, true, "?") }}', 'foo ba?');
        await equal('{{ "foo bar" | truncate(3) }}', {
            str: SafeString.markSafe('foo bar'),
        }, 'foo...');

        await equal('{{ null | truncate(3) }}', '');
        await equal('{{ null | truncate(6) }}', '');
        await equal('{{ null | truncate(7) }}', '');
        await equal('{{ null | truncate(5, true) }}', '');
        await equal('{{ null | truncate(6, true, "?") }}', '');

        await equal('{{ nothing | truncate(3) }}', { nothing: undefined }, '');
        await equal('{{ nothing | truncate(6) }}', { nothing: undefined }, '');
        await equal('{{ nothing | truncate(7) }}', { nothing: undefined }, '');
        await equal('{{ nothing | truncate(5, true) }}', { nothing: undefined }, '');
        await equal('{{ nothing | truncate(6, true, "?") }}', { nothing: undefined }, '');
    });

    it('upper', async () => {
        await equal('{{ "foo" | upper }}', 'FOO');
        await equal('{{ str | upper }}', {
            str: SafeString.markSafe('foo'),
        }, 'FOO');
        await equal('{{ null | upper }}', '');
        await equal('{{ nothing | upper }}', { nothing: undefined }, '');
    });

    it('urlencode', async () => {
        await equal('{{ "&" | urlencode }}', '%26');
        await equal('{{ arr | urlencode | safe }}', {
            arr: [ [ 1, 2 ], [ '&1', '&2' ] ],
        }, '1=2&%261=%262');
        await equal('{{ obj | urlencode | safe }}', {
            obj: {
                1: 2,
                '&1': '&2',
            },
        }, '1=2&%261=%262');
    });

    it('urlencode - object without prototype', async () => {
        const obj = Object.create(null);
        obj['1'] = 2;
        obj['&1'] = '&2';

        await equal('{{ obj | urlencode | safe }}', {
            obj: obj,
        }, '1=2&%261=%262');
    });

    it('urlize', async () => {
        // From jinja test suite:
        // https://github.com/mitsuhiko/jinja2/blob/8db47916de0e888dd8664b2511e220ab5ecf5c15/jinja2/testsuite/filters.py#L236-L239
        await equal('{{ "foo http://www.example.com/ bar" | urlize | safe }}',
            'foo <a href="http://www.example.com/">' +
            'http://www.example.com/</a> bar');

        // Additional tests
        await equal('{{ "" | urlize }}', '');
        await equal('{{ "foo" | urlize }}', 'foo');

        // Http
        await equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

        // Https
        await equal('{{ "https://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="https://jinja.pocoo.org/docs/templates/">https://jinja.pocoo.org/docs/templates/</a>');

        // Www without protocol
        await equal('{{ "www.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://www.pocoo.org/docs/templates/">www.pocoo.org/docs/templates/</a>');

        // .org, .net, .com without protocol or www
        await equal('{{ "pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://pocoo.org/docs/templates/">pocoo.org/docs/templates/</a>');
        await equal('{{ "pocoo.net/docs/templates/" | urlize | safe }}',
            '<a href="http://pocoo.net/docs/templates/">pocoo.net/docs/templates/</a>');
        await equal('{{ "pocoo.com/docs/templates/" | urlize | safe }}',
            '<a href="http://pocoo.com/docs/templates/">pocoo.com/docs/templates/</a>');
        await equal('{{ "pocoo.com:80" | urlize | safe }}',
            '<a href="http://pocoo.com:80">pocoo.com:80</a>');
        await equal('{{ "pocoo.com" | urlize | safe }}',
            '<a href="http://pocoo.com">pocoo.com</a>');
        await equal('{{ "pocoo.commune" | urlize | safe }}',
            'pocoo.commune');

        // Truncate the printed URL
        await equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize(12, true) | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/" rel="nofollow">http://jinja</a>');

        // Punctuation on the beginning of line.
        await equal('{{ "(http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
        await equal('{{ "<http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
        await equal('{{ "&lt;http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

        // Punctuation on the end of line
        await equal('{{ "http://jinja.pocoo.org/docs/templates/," | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
        await equal('{{ "http://jinja.pocoo.org/docs/templates/." | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
        await equal('{{ "http://jinja.pocoo.org/docs/templates/)" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
        await equal('{{ "http://jinja.pocoo.org/docs/templates/\n" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>\n');
        await equal('{{ "http://jinja.pocoo.org/docs/templates/&gt;" | urlize | safe }}',
            '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

        // Http url with username
        await equal('{{ "http://testuser@testuser.com" | urlize | safe }}',
            '<a href="http://testuser@testuser.com">http://testuser@testuser.com</a>');

        // Email addresses
        await equal('{{ "testuser@testuser.com" | urlize | safe }}',
            '<a href="mailto:testuser@testuser.com">testuser@testuser.com</a>');

        // Periods in the text
        await equal('{{ "foo." | urlize }}', 'foo.');
        await equal('{{ "foo.foo" | urlize }}', 'foo.foo');

        // Markup in the text
        await equal('{{ "<b>what up</b>" | urlize | safe }}', '<b>what up</b>');

        // Breaklines and tabs in the text
        await equal('{{ "what\nup" | urlize | safe }}', 'what\nup');
        await equal('{{ "what\tup" | urlize | safe }}', 'what\tup');
    });

    it('wordcount', async () => {
        await equal('{{ "foo bar baz" | wordcount }}', '3');
        await equal('{{ str | wordcount }}', { str: SafeString.markSafe('foo bar baz') }, '3');
        await equal('{{ null | wordcount }}', '');
        await equal('{{ nothing | wordcount }}', { nothing: undefined }, '');
    });
});

describe('tests', function() {
    it('callable should detect callability', async () => {
        const callable = await render('{{ foo is callable }}', {
            foo: function() {
                return '!!!';
            },
        });
        const uncallable = await render('{{ foo is not callable }}', {
            foo: '!!!',
        });
        expect(callable).to.be.equal('true');
        expect(uncallable).to.be.equal('true');
    });

    it('defined should detect definedness', async () => {
        expect(await render('{{ foo is defined }}')).to.be.equal('false');
        expect(await render('{{ foo is not defined }}')).to.be.equal('true');
        expect(await render('{{ foo is defined }}', {
            foo: null,
        })).to.be.equal('true');
        expect(await render('{{ foo is not defined }}', {
            foo: null,
        })).to.be.equal('false');
    });

    it('should support "is defined" in {% if %} expressions', async () => {
        expect(
            await render('{% if foo is defined %}defined{% else %}undefined{% endif %}', {})
        ).to.be.equal('undefined');
        expect(
            await render('{% if foo is defined %}defined{% else %}undefined{% endif %}', {foo: null})
        ).to.be.equal('defined');
    });

    it('should support "is not defined" in {% if %} expressions', async () => {
        expect(
            await render('{% if foo is not defined %}undefined{% else %}defined{% endif %}', {})
        ).to.be.equal('undefined');
        expect(
            await render('{% if foo is not defined %}undefined{% else %}defined{% endif %}', {foo: null})
        ).to.be.equal('defined');
    });

    it('undefined should detect undefinedness', async () => {
        expect(await render('{{ foo is undefined }}')).to.be.equal('true');
        expect(await render('{{ foo is not undefined }}')).to.be.equal('false');
        expect(await render('{{ foo is undefined }}', {
            foo: null,
        })).to.be.equal('false');
        expect(await render('{{ foo is not undefined }}', {
            foo: null,
        })).to.be.equal('true');
    });

    it('none/null should detect strictly null values', async () => {
        // Required a change in lexer.js @ 220
        expect(await render('{{ null is null }}')).to.be.equal('true');
        expect(await render('{{ none is none }}')).to.be.equal('true');
        expect(await render('{{ none is null }}')).to.be.equal('true');
        expect(await render('{{ foo is null }}', { foo: undefined })).to.be.equal('false');
        expect(await render('{{ foo is not null }}', {
            foo: null,
        })).to.be.equal('false');
    });

    it('divisibleby should detect divisibility', async () => {
        const divisible = await render('{{ "6" is divisibleby(3) }}');
        const notDivisible = await render('{{ 3 is not divisibleby(2) }}');
        expect(divisible).to.be.equal('true');
        expect(notDivisible).to.be.equal('true');
    });

    it('escaped should test whether or not something is escaped', async () => {
        const escaped = await render('{{ (foo | safe) is escaped }}', {
            foo: 'foobarbaz',
        });
        const notEscaped = await render('{{ foo is escaped }}', {
            foo: 'foobarbaz',
        });
        expect(escaped).to.be.equal('true');
        expect(notEscaped).to.be.equal('false');
    });

    it('even should detect whether or not a number is even', async () => {
        const fiveEven = await render('{{ "5" is even }}');
        const fourNotEven = await render('{{ 4 is not even }}');
        expect(fiveEven).to.be.equal('false');
        expect(fourNotEven).to.be.equal('false');
    });

    it('odd should detect whether or not a number is odd', async () => {
        const fiveOdd = await render('{{ "5" is odd }}');
        const fourNotOdd = await render('{{ 4 is not odd }}');
        expect(fiveOdd).to.be.equal('true');
        expect(fourNotOdd).to.be.equal('true');
    });

    it('mapping should detect Maps or hashes', async () => {
        const map1 = new Map();
        const map2 = {};

        const mapOneIsMapping = await render('{{ map is mapping }}', {
            map: map1,
        });
        const mapTwoIsMapping = await render('{{ map is mapping }}', {
            map: map2,
        });
        expect(mapOneIsMapping).to.be.equal('true');
        expect(mapTwoIsMapping).to.be.equal('true');
    });

    it('falsy should detect whether or not a value is falsy', async () => {
        const zero = await render('{{ 0 is falsy }}');
        const pancakes = await render('{{ "pancakes" is not falsy }}');
        expect(zero).to.be.equal('true');
        expect(pancakes).to.be.equal('true');
    });

    it('truthy should detect whether or not a value is truthy', async () => {
        const nullTruthy = await render('{{ null is truthy }}');
        const pancakesNotTruthy = await render('{{ "pancakes" is not truthy }}');
        expect(nullTruthy).to.be.equal('false');
        expect(pancakesNotTruthy).to.be.equal('false');
    });

    it('greaterthan than should detect whether or not a value is less than another', async () => {
        const fiveGreaterThanFour = await render('{{ "5" is greaterthan(4) }}');
        const fourNotGreaterThanTwo = await render('{{ 4 is not greaterthan(2) }}');
        expect(fiveGreaterThanFour).to.be.equal('true');
        expect(fourNotGreaterThanTwo).to.be.equal('false');
    });

    it('ge should detect whether or not a value is greater than or equal to another', async () => {
        const fiveGreaterThanEqualToFive = await render('{{ "5" is ge(5) }}');
        const fourNotGreaterThanEqualToTwo = await render('{{ 4 is not ge(2) }}');
        expect(fiveGreaterThanEqualToFive).to.be.equal('true');
        expect(fourNotGreaterThanEqualToTwo).to.be.equal('false');
    });

    it('lessthan than should detect whether or not a value is less than another', async () => {
        const fiveLessThanFour = await render('{{ "5" is lessthan(4) }}');
        const fourNotLessThanTwo = await render('{{ 4 is not lessthan(2) }}');
        expect(fiveLessThanFour).to.be.equal('false');
        expect(fourNotLessThanTwo).to.be.equal('true');
    });

    it('le should detect whether or not a value is less than or equal to another', async () => {
        const fiveLessThanEqualToFive = await render('{{ "5" is le(5) }}');
        const fourNotLessThanEqualToTwo = await render('{{ 4 is not le(2) }}');
        expect(fiveLessThanEqualToFive).to.be.equal('true');
        expect(fourNotLessThanEqualToTwo).to.be.equal('true');
    });

    it('ne should detect whether or not a value is not equal to another', async () => {
        const five = await render('{{ 5 is ne(5) }}');
        const four = await render('{{ 4 is not ne(2) }}');
        expect(five).to.be.equal('false');
        expect(four).to.be.equal('false');
    });

    it('iterable should detect that a generator is iterable', async () => {
        await equal('{{ fn is iterable }}', { fn: (function * iterable() {
            yield true;
        }()) }, 'true');
    });

    it('iterable should detect that an Array is not non-iterable', async () => {
        await equal('{{ arr is not iterable }}', { arr: [] }, 'false');
    });

    it('iterable should detect that a Map is iterable', async () => {
        await equal('{{ map is iterable }}', { map: new Map() }, 'true');
    });

    it('iterable should detect that a Set is not non-iterable', async () => {
        await equal('{{ set is not iterable }}', { set: new Set() }, 'false');
    });

    it('number should detect whether a value is numeric', async () => {
        const num = await render('{{ 5 is number }}');
        const str = await render('{{ "42" is number }}');
        expect(num).to.be.equal('true');
        expect(str).to.be.equal('false');
    });

    it('string should detect whether a value is a string', async () => {
        const num = await render('{{ 5 is string }}');
        const str = await render('{{ "42" is string }}');
        expect(num).to.be.equal('false');
        expect(str).to.be.equal('true');
    });

    it('equalto should detect value equality', async () => {
        const same = await render('{{ 1 is equalto(2) }}');
        const notSame = await render('{{ 2 is not equalto(2) }}');
        expect(same).to.be.equal('false');
        expect(notSame).to.be.equal('false');
    });

    it('sameas should alias to equalto', async () => {
        const obj = {};
        const same = await render('{{ obj1 is sameas(obj2) }}', {
            obj1: obj,
            obj2: obj,
        });
        expect(same).to.be.equal('true');
    });

    it('lower should detect whether or not a string is lowercased', async () => {
        expect(await render('{{ "foobar" is lower }}')).to.be.equal('true');
        expect(await render('{{ "Foobar" is lower }}')).to.be.equal('false');
    });

    it('upper should detect whether or not a string is uppercased', async () => {
        expect(await render('{{ "FOOBAR" is upper }}')).to.be.equal('true');
        expect(await render('{{ "Foobar" is upper }}')).to.be.equal('false');
    });
});
