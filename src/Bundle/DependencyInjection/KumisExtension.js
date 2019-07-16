const FileLocator = Jymfony.Component.Config.FileLocator;
const JsFileLoader = Jymfony.Component.DependencyInjection.Loader.JsFileLoader;
const Extension = Jymfony.Component.DependencyInjection.Extension.Extension;

const path = require('path');

/**
 * @memberOf Kumis.Bundle.DependencyInjection
 */
class KumisExtension extends Extension {
    /**
     * Load a configuration
     *
     * @param {*} configs
     * @param {Jymfony.Component.DependencyInjection.ContainerBuilder} container
     */
    load(configs, container) {
        const config = this._processConfiguration(this.getConfiguration(configs, container), configs);
        const loader = new JsFileLoader(container, new FileLocator(path.join(__dirname, '..', 'Resources', 'config')));
        loader.load('services.js');

        if (ReflectionClass.exists('Jymfony.Component.Security.Security')) {
            loader.load('security_extensions.js');
        }

        const fsLoader = container.findDefinition(Kumis.Bundle.Loader.FilesystemLoader);
        fsLoader.replaceArgument(1, config.paths.map(path.normalize));

        container.findDefinition(Kumis.Bundle.CacheWarmer.TemplatesCacheWarmer)
            .replaceArgument(2, config.paths.map(path.normalize));
    }
}

module.exports = KumisExtension;
