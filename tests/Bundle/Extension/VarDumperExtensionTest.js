const AppKernel = Tests.Fixtures.AppKernel;
const { expect } = require('chai');
const { readFileSync } = require('fs');

describe('VarDumperExtension', function () {
    it('dump should emit nothing if debug is false', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });
        kernel._debug = false;

        try {
            await kernel.boot();
            const engine = kernel.container.get('kumis');

            const buffer = new __jymfony.StreamBuffer();
            await engine.render(buffer, 'var_dumper/dumper1.html.kumis', {
                app: 'testfoo',
            });

            expect(__jymfony.trim(buffer.buffer.toString())).to.be.equal('TEST');
        } finally {
            await kernel.shutdown();
        }
    });

    it('dump should emit dump', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();
            const engine = kernel.container.get('kumis');

            const buffer = new __jymfony.StreamBuffer();
            await engine.render(buffer, 'var_dumper/dumper2.html.kumis', {
                app: 'testfoo',
            });

            expect(__jymfony.trim(
                buffer.buffer.toString().replace(/jf-dump-\d+/g, 'jf-dump')
            )).to.be.equal(
                __jymfony.trim(readFileSync(__dirname + '/../../templates/var_dumper/dumper2.html').toString())
            );
        } finally {
            await kernel.shutdown();
        }
    });

    it('dump tag should emit dump', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();
            const engine = kernel.container.get('kumis');

            const buffer = new __jymfony.StreamBuffer();
            await engine.render(buffer, 'var_dumper/dumper2-tag.html.kumis', {
                app: 'testfoo',
            });

            expect(__jymfony.trim(
                buffer.buffer.toString().replace(/jf-dump-\d+/g, 'jf-dump')
            )).to.be.equal(
                __jymfony.trim(readFileSync(__dirname + '/../../templates/var_dumper/dumper2.html').toString())
            );
        } finally {
            await kernel.shutdown();
        }
    });
});
