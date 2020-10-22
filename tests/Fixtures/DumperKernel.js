const path = require("path");
const AppKernel = Tests.Fixtures.AppKernel;

/**
 * @memberOf Tests.Fixtures
 */
class DumperKernel extends AppKernel {
    /**
     * Get the application cache dir
     *
     * @returns {string}
     */
    getCacheDir() {
        return path.normalize(path.join(this.getRootDir(), '..', 'var', 'cache-var-dumper', this.environment));
    }
}

module.exports = DumperKernel;
