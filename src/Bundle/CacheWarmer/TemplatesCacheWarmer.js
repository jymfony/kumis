import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, normalize, relative } from 'path';

const Compiler = Kumis.Compiler.Compiler;
const CacheWarmerInterface = Jymfony.Component.Kernel.CacheWarmer.CacheWarmerInterface;
const ConfigCacheFactory = Jymfony.Component.Config.ConfigCacheFactory;
const FileResource = Jymfony.Component.Config.Resource.FileResource;

/**
 * @memberOf Kumis.Bundle.CacheWarmer
 */
export default class TemplatesCacheWarmer extends implementationOf(CacheWarmerInterface) {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Kernel.KernelInterface} kernel
     * @param {Kumis.Environment} environment
     * @param {string[]} templatePaths
     */
    __construct(kernel, environment, templatePaths = []) {
        /**
         * @type {Jymfony.Component.Kernel.KernelInterface}
         *
         * @private
         */
        this._kernel = kernel;

        /**
         * @type {Kumis.Environment}
         *
         * @private
         */
        this._environment = environment;

        const bundlesResources = Array.from((function * () {
            for (const bundle of kernel.getBundles()) {
                yield bundle.path + '/Resources/templates';
            }
        })());

        /**
         * @type {string[]}
         *
         * @private
         */
        this._paths = [ ...templatePaths, ...bundlesResources ];
    }

    /**
     * @inheritDoc
     */
    warmUp(cacheDir) {
        const factory = new ConfigCacheFactory(this._kernel.debug);
        factory.cache(cacheDir + '/kumis/templates.js', (cache) => {
            __jymfony.mkdir(cacheDir + '/kumis/templates');

            const obj = {};
            const resources = [];

            for (let [ i, templatePath ] of __jymfony.getEntries(this._paths)) {
                templatePath = normalize(templatePath);
                if (! existsSync(templatePath)) {
                    continue;
                }

                const targetDir = __jymfony.sprintf('%s/kumis/templates/%02d', cacheDir, i);
                __jymfony.mkdir(targetDir);

                const iterator = new RecursiveDirectoryIterator(templatePath);
                for (const file of iterator) {
                    if (! file.match(/\.kumis$/)) {
                        continue;
                    }

                    const relativePath = relative(templatePath, file);
                    const code = Compiler.compile(
                        readFileSync(file, { encoding: 'utf-8' }),
                        this._environment.extensionsList,
                        file,
                        this._environment.opts
                    );

                    const tPath = targetDir + '/' + relativePath + '.js';
                    if (! existsSync(dirname(tPath))) {
                        __jymfony.mkdir(dirname(tPath));
                    }

                    writeFileSync(tPath, code);

                    obj[file] = obj[relativePath] = tPath;
                    resources.push(new FileResource(templatePath));
                }
            }

            cache.write('module.exports = ' + JSON.stringify(obj, null, 2) + ';\n', resources);
        });
    }

    /**
     * @inheritDoc
     */
    get optional() {
        return true;
    }
}
