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
        const fs = new Filesystem();
        await fs.remove(this.getCacheDir());

        const cache = __jymfony.autoload._finder._require.cache;
        const cacheDir = this.getCacheDir();
        for (const path of Object.keys(cache)) {
            if (path.startsWith(cacheDir)) {
                delete cache[path];
            }
        }
    }

    * registerBundles() {
        yield new FrameworkBundle();
        yield new KumisBundle();
    }

    _configureContainer(container, loader) {
        container.loadFromExtension('kumis', this._config);
        container.loadFromExtension('framework', {
            test: true,
            templating: {
                engines: [ 'kumis', 'js' ],
            },
        });
    }
}

module.exports = AppKernel;
