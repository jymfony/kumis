import { render, equal } from '../util';

const Environment = Kumis.Environment;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const SafeString = Kumis.Util.SafeString;
const TemplateError = Kumis.Exception.TemplateError;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class BuiltinExtensionTest extends TestCase {
    async testGlobalFeatures() {

        // should have range
        {
            await equal('{% for i in range(0, 10) %}{{ i }}{% endfor %}', '0123456789');
            await equal('{% for i in range(10) %}{{ i }}{% endfor %}', '0123456789');
            await equal('{% for i in range(5, 10) %}{{ i }}{% endfor %}', '56789');
            await equal('{% for i in range(-2, 0) %}{{ i }}{% endfor %}', '-2-1');
            await equal('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}', '579');
            await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');
            await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');

            await equal('{% for i in range(10, 5, -1) %}{{ i }}{% endfor %}', '109876');
            await equal('{% for i in range(10, 5, -2.5) %}{{ i }}{% endfor %}', '107.5');
        }

        // should have cycler
        {
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
        }

        // should have joiner
        {
            await equal(
                '{% set comma = joiner() %}' +
                'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}',
                'foobar,baz,');

            await equal(
                '{% set pipe = joiner("|") %}' +
                'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}',
                'foobar|baz|');
        }

        // should allow addition of globals
        {
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
        }

        // should allow chaining of globals
        {
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
        }

        // should allow getting of globals
        {
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

        __self.assertSame(hello, env.globals.hello);
        }

        // should allow getting boolean globals
        {
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

        __self.assertSame(hello, env.globals.hello);
        }

        // should pass context as this to global functions
        {
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
        }

        // should be exclusive to each environment
        {
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
        __self.assertUndefined(env2.globals.hello);
        }

        // should return errors from globals
        {
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
            __self.assertInstanceOf(Error, e);
        }
        }

    }

    async testBuiltinFiltersProduceExpectedOutput() {
        const env = Environment.create();

        await equal(
            '{% for row in [1, 2, 3, 4, 5] | batch(2, "X") %}[{{ row | join(",") }}]{% endfor %}',
            '[1,2][3,4][5,X]',
            env
        );

        await equal(
            '{% for pair in mapping | dictsort %}{{ pair[0] }}={{ pair[1] }};{% endfor %}',
            { mapping: { b: 2, a: 1 } },
            'a=1;b=2;',
            env
        );

        await equal(
            '{{ "Foo Bar Baz" | replace("Bar", "Quux") }}',
            'Foo Quux Baz',
            env
        );

        await equal(
            '{{ "Check https://example.com" | urlize }}',
            'Check &lt;a href=&quot;https://example.com&quot;&gt;https://example.com&lt;/a&gt;',
            env
        );

        await equal(
            '{{ "Lorem ipsum dolor sit amet" | truncate(12) }}',
            'Lorem ipsum...',
            env
        );

        await equal(
            '{{ [42] | random }}',
            '42',
            env
        );

        await equal(
            '{{ [1, 2, 3] | sum }}',
            '6',
            env
        );

        await equal(
            '{{ users | sum("age", 10) }}',
            { users: [ { name: 'Ada', age: 32 }, { name: 'Linus', age: 28 } ] },
            '70',
            env
        );

        await equal(
            '{% for row in [1, 2, 3, 4, 5] | slice(3, "X") %}[{{ row | join(",") }}]{% endfor %}',
            '[1,2][3,4][5,X]',
            env
        );
    }

    async testBuiltinFiltersHandleSafeStringsAndCollections() {
        const env = Environment.create();
        const safe = new SafeString('<strong>Safe</strong>');

        await equal(
            '{{ safe | escape }}',
            { safe },
            '<strong>Safe</strong>',
            env
        );

        await equal(
            '{{ safe | forceescape }}',
            { safe },
            '&lt;strong&gt;Safe&lt;/strong&gt;',
            env
        );

        await equal(
            '{{ collection | length }}',
            { collection: new Map([ [ 'a', 1 ], [ 'b', 2 ] ]) },
            '2',
            env
        );

        await equal(
            '{% for entry in { first: 1, second: 2 } | list %}{{ entry.key }}={{ entry.value }};{% endfor %}',
            'first=1;second=2;',
            env
        );
    }

    async testBuiltinFilterAliases() {
        const env = Environment.create();

        __self.assertTrue('function' === typeof env.getFilter('default'));
        __self.assertTrue('function' === typeof env.getFilter('d'));
        __self.assertTrue('function' === typeof env.getFilter('e'));

        await this.assertThrows(() => env.getFilter('default_'), Error, /filter not found: default_/);
    }

    async testBuiltinFilterErrors() {
        const env = Environment.create();

        await this.assertThrows(
            () => render('{{ value | dictsort }}', { value: 42 }, {}, env),
            TemplateError,
            /dictsort filter: val must be an object/
        );

        await this.assertThrows(
            () => render('{{ value | list }}', { value: 42 }, {}, env),
            TemplateError,
            /list filter: type not iterable/
        );
    }

    async assertThrows(executable, expected, messageRegex = undefined) {
        let caught;

        try {
            const result = executable();
            if (result && 'function' === typeof result.then) {
                await result;
            }
        } catch (error) {
            caught = error;
        }

        if (! caught) {
            this.fail('Expected exception to be thrown.');
        }

        this.assertInstanceOf(expected, caught);

        if (messageRegex) {
            this.assertMatchesRegularExpression(messageRegex, String(caught));
        }
    }
}
