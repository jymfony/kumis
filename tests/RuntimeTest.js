const { expect } = require('chai');
const { render } = require('./util');

describe('runtime', function() {
    it('should report the failed function calls to symbols', async () => {
        try {
            await render('{{ foo("cvan") }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/Unable to call `foo`, which is undefined/);
        }
    });

    it('should report the failed function calls to lookups', async () => {
        try {
            await render('{{ foo["bar"]("cvan") }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    });

    it('should report the failed function calls to calls', async () => {
        try {
            await render('{{ foo.bar("second call") }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }
    });

    it('should report full function name in error', async () => {
        try {
            await render('{{ foo.barThatIsLongerThanTen() }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/foo\["barThatIsLongerThanTen"\]/);
        }
    });

    it('should report the failed function calls w/multiple args', async () => {
        try {
            await render('{{ foo.bar("multiple", "args") }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]/);
        }

        try {
            await render('{{ foo["bar"]["zip"]("multiple", "args") }}', {}, {
                noThrow: true,
            });
        } catch (err) {
            expect(err).to.match(/foo\["bar"\]\["zip"\]/);
        }
    });

    it('should allow for undefined macro arguments in the last position', async () => {
        expect(await render('{% macro foo(bar, baz) %}' +
            '{{ bar }} {{ baz }}{% endmacro %}' +
            '{{ foo("hello", nosuchvar) }}', {}, {
            noThrow: true,
        })).to.be.a('string');
    });

    it('should allow for objects without a prototype macro arguments in the last position', async () => {
        const noProto = Object.create(null);
        noProto.qux = 'world';

        expect(await render('{% macro foo(bar, baz) %}' +
            '{{ bar }} {{ baz.qux }}{% endmacro %}' +
            '{{ foo("hello", noProto) }}', {
            noProto: noProto,
        }, {
            noThrow: true,
        })).to.equal('hello world');
    });
});
