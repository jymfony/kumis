const { expect } = require('chai');
const { render } = require('./util');

describe('runtime', function() {
    it('should report the failed function calls to symbols', async () => {
        try {
            await render('{{ foo("cvan") }}', { foo: undefined });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/Unable to call `foo`, which is undefined/);
        }
    });

    it('should report the failed function calls to lookups', async () => {
        try {
            await render('{{ foo["bar"]("cvan") }}', { foo: {} });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    });

    it('should report the failed function calls to calls', async () => {
        try {
            await render('{{ foo.bar("second call") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    });

    it('should report full function name in error', async () => {
        try {
            await render('{{ foo.barThatIsLongerThanTen() }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["barThatIsLongerThanTen"\]/);
        }
    });

    it('should report the failed function calls w/multiple args', async () => {
        try {
            await render('{{ foo.bar("multiple", "args") }}', { foo: null });
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }

        try {
            await render('{{ foo["bar"]["zip"]("multiple", "args") }}', { foo: { bar: null }});
            throw new Error('FAIL');
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]\["zip"\]/);
        }
    });

    it('should allow for objects without a prototype macro arguments in the last position', async () => {
        const noProto = Object.create(null);
        noProto.qux = 'world';

        expect(await render('{% macro foo(bar, baz) %}' +
            '{{ bar }} {{ baz.qux }}{% endmacro %}' +
            '{{ foo("hello", noProto) }}', {
            noProto: noProto,
        })).to.equal('hello world');
    });
});
