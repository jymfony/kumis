import { render } from './util';

const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class RuntimeTest extends TestCase {
    async testShouldReportTheFailedFunctionCallsToSymbols() {
        try {
            await render('{{ foo("cvan") }}', { foo: undefined });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/Unable to call `foo`, which is undefined/, err.toString());
        }
    }

    async testShouldReportTheFailedFunctionCallsToLookups() {
        try {
            await render('{{ foo["bar"]("cvan") }}', { foo: {} });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/foo\["bar"\]/, err.toString());
        }
    }

    async testShouldReportTheFailedFunctionCallsToCalls() {
        try {
            await render('{{ foo.bar("second call") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/foo\["bar"\]/, err.toString());
        }
    }

    async testShouldReportFullFunctionNameInError() {
        try {
            await render('{{ foo.barThatIsLongerThanTen() }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/foo\["barThatIsLongerThanTen"\]/, err.toString());
        }
    }

    async testShouldReportTheFailedFunctionCallsWithMultipleArgs() {
        try {
            await render('{{ foo.bar("multiple", "args") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/foo\["bar"\]/, err.toString());
        }

        try {
            await render('{{ foo["bar"]["zip"]("multiple", "args") }}', { foo: { bar: null } });
            throw new Error('FAIL');
        } catch (err) {
            __self.assertMatchesRegularExpression(/foo\["bar"\]\["zip"\]/, err.toString());
        }
    }

    async testShouldAllowForObjectsWithoutAPrototypeMacroArgumentsInTheLastPosition() {
        const noProto = Object.create(null);
        noProto.qux = 'world';

        __self.assertEquals('hello world', await render('{% macro foo(bar, baz) %}' +
            '{{ bar }} {{ baz.qux }}{% endmacro %}' +
            '{{ foo("hello", noProto) }}', {
            noProto: noProto,
        }));
    }
}
