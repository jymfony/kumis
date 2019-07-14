const AppKernel = Tests.Fixtures.AppKernel;
const { expect } = require('chai');

describe('KumisExtension', function () {
    it('should boot', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();

            expect(kernel.container.has(Kumis.Bundle.Engine)).to.be.true;
            expect(await kernel.container.get('kumis').exists('async.kumis')).to.be.true;
            expect(await kernel.container.get('templating').exists('async.kumis')).to.be.true;
        } finally {
            await kernel.shutdown();
        }
    });

    it('should render the template', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();

            const stream = new __jymfony.StreamBuffer();
            await kernel.container.get('templating').render(stream, 'item.kumis', {
                item: 'item',
            });

            expect(stream.buffer.toString()).to.be.equal('showing item');
        } finally {
            await kernel.shutdown();
        }
    });

    // it('should pre-compile templates during warmup', async () => {
    //     const kernel = new AppKernel({
    //         paths: __dirname + '/../../templates',
    //     });
    //
    //     try {
    //         await kernel.boot();
    //
    //         const container = kernel.container.get('test.service_container');
    //         await container.get('cache_warmer').warmUp(kernel.getCacheDir());
    //         const cached = container.get(Kumis.Bundle.Loader.CachedLoader).resolve('item.kumis');
    //
    //         expect(cached).to.be.not.null;
    //
    //         const stream = new __jymfony.StreamBuffer();
    //         await kernel.container.get('templating').render(stream, 'item.kumis', {
    //             item: 'item',
    //         });
    //
    //         expect(stream.buffer.toString()).to.be.equal('showing item');
    //     } finally {
    //         await kernel.shutdown();
    //     }
    // });
});
