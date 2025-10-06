import { render, equal } from '../util';

const Environment = Kumis.Environment;
const SafeString = Kumis.Util.SafeString;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class BuiltinTestsTest extends TestCase {
    async testCallablePredicate() {
        const template = '{% if value is callable %}yes{% else %}no{% endif %}';

        await equal(template, { value: () => {} }, 'yes');
        await equal(template, { value: 42 }, 'no');
    }

    async testDefinedPredicate() {
        const template = '{% if value is defined %}yes{% else %}no{% endif %}';

        await equal(template, { value: 'present' }, 'yes');
        await equal(template, {}, 'no');
    }

    async testDivisibleByPredicate() {
        const template = '{% if value is divisibleby(3) %}yes{% else %}no{% endif %}';

        await equal(template, { value: 9 }, 'yes');
        await equal(template, { value: 10 }, 'no');
    }

    async testEscapedPredicate() {
        const template = '{% if value is escaped %}yes{% else %}no{% endif %}';

        await equal(template, { value: new SafeString('safe') }, 'yes');
        await equal(template, { value: 'unsafe' }, 'no');
    }

    async testEqualToPredicate() {
        const template = '{% if value is equalto(5) %}yes{% else %}no{% endif %}';

        await equal(template, { value: 5 }, 'yes');
        await equal(template, { value: 6 }, 'no');
    }

    async testEqualAliases() {
        const template = '{% if value is eq(5) %}eq{% endif %}{% if value is sameas(5) %}sameas{% endif %}';

        await equal(template, { value: 5 }, 'eqsameas');
        await equal(template, { value: 6 }, '');
    }

    async testEvenPredicate() {
        const template = '{% if value is even %}yes{% else %}no{% endif %}';

        await equal(template, { value: 4 }, 'yes');
        await equal(template, { value: 5 }, 'no');
    }

    async testFalsyPredicate() {
        const template = '{% if value is falsy %}yes{% else %}no{% endif %}';

        await equal(template, { value: 0 }, 'yes');
        await equal(template, { value: 7 }, 'no');
    }

    async testGreaterOrEqualPredicate() {
        const template = '{% if value is ge(10) %}yes{% else %}no{% endif %}';

        await equal(template, { value: 12 }, 'yes');
        await equal(template, { value: 8 }, 'no');
    }

    async testGreaterThanPredicate() {
        const template = '{% if value is greaterthan(3) %}gt{% endif %}{% if value is gt(3) %}alias{% endif %}';

        await equal(template, { value: 4 }, 'gtalias');
        await equal(template, { value: 3 }, '');
    }

    async testLessOrEqualPredicate() {
        const template = '{% if value is le(3) %}yes{% else %}no{% endif %}';

        await equal(template, { value: 3 }, 'yes');
        await equal(template, { value: 4 }, 'no');
    }

    async testLessThanPredicate() {
        const template = '{% if value is lessthan(5) %}lt{% endif %}{% if value is lt(5) %}alias{% endif %}';

        await equal(template, { value: 4 }, 'ltalias');
        await equal(template, { value: 5 }, '');
    }

    async testLowerPredicate() {
        const template = '{% if value is lower %}yes{% else %}no{% endif %}';

        await equal(template, { value: 'lowercase' }, 'yes');
        await equal(template, { value: 'Mixed' }, 'no');
    }

    async testNotEqualPredicate() {
        const template = '{% if value is ne(5) %}yes{% else %}no{% endif %}';

        await equal(template, { value: 7 }, 'yes');
        await equal(template, { value: 5 }, 'no');
    }

    async testNullPredicate() {
        const template = '{% if value is null %}yes{% else %}no{% endif %}';

        await equal(template, { value: null }, 'yes');
        await equal(template, { value: 'value' }, 'no');
    }

    async testNumberPredicate() {
        const template = '{% if value is number %}yes{% else %}no{% endif %}';

        await equal(template, { value: 3 }, 'yes');
        await equal(template, { value: '3' }, 'no');
    }

    async testOddPredicate() {
        const template = '{% if value is odd %}yes{% else %}no{% endif %}';

        await equal(template, { value: 5 }, 'yes');
        await equal(template, { value: 4 }, 'no');
    }

    async testStringPredicate() {
        const template = '{% if value is string %}yes{% else %}no{% endif %}';

        await equal(template, { value: 'kumis' }, 'yes');
        await equal(template, { value: 42 }, 'no');
    }

    async testTruthyPredicate() {
        const template = '{% if value is truthy %}yes{% else %}no{% endif %}';

        await equal(template, { value: 'kumis' }, 'yes');
        await equal(template, { value: '' }, 'no');
    }

    async testUndefinedPredicate() {
        const template = '{% if value is undefined %}yes{% else %}no{% endif %}';

        await equal(template, { value: undefined }, 'yes');
        await equal(template, { value: null }, 'no');
    }

    async testUpperPredicate() {
        const template = '{% if value is upper %}yes{% else %}no{% endif %}';

        await equal(template, { value: 'UPPER' }, 'yes');
        await equal(template, { value: 'Upper' }, 'no');
    }

    async testIterablePredicate() {
        function *generator() {
            yield 1;
            yield 2;
        }

        const template = '{% if value is iterable %}yes{% else %}no{% endif %}';

        await equal(template, { value: [ 1, 2, 3 ] }, 'yes');
        await equal(template, { value: generator() }, 'yes');
        await equal(template, { value: { length: 2 } }, 'no');
    }

    async testMappingPredicate() {
        const template = '{% if value is mapping %}yes{% else %}no{% endif %}';

        await equal(template, { value: new Map([ [ 'key', 'value' ] ]) }, 'yes');
        await equal(template, { value: { key: 'value' } }, 'yes');
        await equal(template, { value: [ 'value' ] }, 'no');
    }

    async testAliasExposure() {
        const env = Environment.create();

        this.assertIsFunction(env.getTest('null'));
        this.assertIsFunction(env.getTest('undefined'));
        this.assertIsFunction(env.getTest('eq'));
        this.assertIsFunction(env.getTest('sameas'));
        this.assertIsFunction(env.getTest('gt'));
        this.assertIsFunction(env.getTest('lt'));

        this.assertSame('yes', await render('{% if value is null %}yes{% endif %}', { value: null }, {}, env));
        this.assertSame('yes', await render('{% if value is undefined %}yes{% else %}no{% endif %}', { value: undefined }, {}, env));

        await this.assertThrows(() => env.getTest('nullTest'), Error, /test not found: nullTest/);
        await this.assertThrows(() => env.getTest('undefinedTest'), Error, /test not found: undefinedTest/);
    }

    async testAliasesBehaveLikeOriginals() {
        const env = Environment.create();
        const context = {};

        this.assertTrue(env.getTest('eq').call(context, 5, 5));
        this.assertFalse(env.getTest('eq').call(context, 5, 6));
        this.assertTrue(env.getTest('gt').call(context, 6, 5));
        this.assertFalse(env.getTest('gt').call(context, 5, 5));
        this.assertTrue(env.getTest('lt').call(context, 4, 5));
        this.assertFalse(env.getTest('lt').call(context, 6, 5));
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
