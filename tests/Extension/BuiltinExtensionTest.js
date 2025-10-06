import { render, equal } from '../util';

const Environment = Kumis.Environment;
const AbstractExtension = Kumis.Extension.AbstractExtension;
const SafeString = Kumis.Util.SafeString;
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
}
