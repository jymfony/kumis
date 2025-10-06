import { expect } from 'chai';
import { render } from './util';

const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class RuntimeTest extends TestCase {
    async testShouldReportTheFailedFunctionCallsToSymbols() {
        try {
            await render('{{ foo("cvan") }}', { foo: undefined });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Unable to call `foo`, which is undefined/);
        }
    }

    async testShouldReportTheFailedFunctionCallsToLookups() {
        try {
            await render('{{ foo["bar"]("cvan") }}', { foo: {} });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    }

    async testShouldReportTheFailedFunctionCallsToCalls() {
        try {
            await render('{{ foo.bar("second call") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    }

    async testShouldReportFullFunctionNameInError() {
        try {
            await render('{{ foo.barThatIsLongerThanTen() }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["barThatIsLongerThanTen"\]/);
        }
    }

    async testShouldReportTheFailedFunctionCallsWithMultipleArgs() {
        try {
            await render('{{ foo.bar("multiple", "args") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }

        try {
            await render('{{ foo["bar"]["zip"]("multiple", "args") }}', { foo: { bar: null } });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]\["zip"\]/);
        }
    }

    async testShouldAllowForObjectsWithoutAPrototypeMacroArgumentsInTheLastPosition() {
        const noProto = Object.create(null);
        noProto.qux = 'world';

        expect(await render('{% macro foo(bar, baz) %}' +
            '{{ bar }} {{ baz.qux }}{% endmacro %}' +
            '{{ foo("hello", noProto) }}', {
            noProto: noProto,
        })).to.equal('hello world');
    }
}
