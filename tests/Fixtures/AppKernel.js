const FrameworkBundle = Jymfony.Bundle.FrameworkBundle.FrameworkBundle;
const Filesystem = Jymfony.Component.Filesystem.Filesystem;
const Kernel = Jymfony.Component.Kernel.Kernel;
const KumisBundle = Kumis.Bundle.KumisBundle;

/**
 * @memberOf Tests.Fixtures
 */
class AppKernel extends Kernel {
    __construct(config) {
        this._config = config;

        super.__construct('test', true);
    }

    async shutdown() {
        await super.shutdown();

        const fs = new Filesystem();
        await fs.remove(this.getCacheDir());

        __jymfony.autoload.classLoader.constructor.clearCache();
    }

    * registerBundles() {
        yield new FrameworkBundle();
        yield new KumisBundle();
    }

    _configureContainer(container, loader) {
        container.loadFromExtension('kumis', this._config);
        container.loadFromExtension('framework', {
            test: true,
            debug: true,
            templating: {
                engines: [ 'kumis', 'js' ],
            },
        });
    }
}

module.exports = AppKernel;
