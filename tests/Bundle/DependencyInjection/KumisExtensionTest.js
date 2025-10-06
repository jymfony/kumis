const AppKernel = Tests.Fixtures.AppKernel;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class KumisExtensionTest extends TestCase {
    __construct() {
        super.__construct();

        /**
         * @type {Jymfony.Component.Kernel.KernelInterface}
         */
        this.kernel = undefined;
    }

    async beforeEach() {
        this.kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        await this.kernel.boot();
    }

    async afterEach() {
        await this.kernel.shutdown();
    }

    async testShouldBoot() {
        __self.assertTrue(this.kernel.container.has(Kumis.Bundle.Engine));
        __self.assertTrue(await this.kernel.container.get('kumis').exists('async.kumis'));
        __self.assertTrue(await this.kernel.container.get('templating').exists('async.kumis'));
    }

    async testShouldRenderTheTemplate() {
        const stream = new __jymfony.StreamBuffer();
        await this.kernel.container.get('templating').render(stream, 'item.kumis', {
            item: 'item',
        });

        __self.assertEquals('showing item', stream.buffer.toString());
    }

    async testShouldPrecompileTemplatesDuringWarmup() {
        const container = this.kernel.container.get('test.service_container');
        const warmer = await container.get('cache_warmer');

        warmer.enableOptionalWarmers();
        warmer.warmUp(this.kernel.getCacheDir());

        const cached = container.get(Kumis.Bundle.Loader.CachedLoader).resolve('item.kumis');
        __self.assertNotNull(cached);

        const stream = new __jymfony.StreamBuffer();
        await this.kernel.container.get('templating').render(stream, 'item.kumis', {
            item: 'item',
        });

        __self.assertEquals('showing item', stream.buffer.toString());
    }
}
