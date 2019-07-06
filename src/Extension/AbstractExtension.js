const ExtensionInterface = Kumis.Extension.ExtensionInterface;

/**
 * Represents an abstract extension.
 *
 * @memberOf Kumis.Extension
 * @abstract
 */
class AbstractExtension extends implementationOf(ExtensionInterface) {
    /**
     * @inheritDoc
     */
    get globals() {
        return {};
    }

    /**
     * @inheritDoc
     */
    get filters() {
        return {};
    }

    /**
     * @inheritDoc
     */
    get tests() {
        return {};
    }

    /**
     * @inheritDoc
     */
    get tags() {
        return [];
    }

    /**
     * @inheritDoc
     */
    get name() {
        return this.constructor.name
            .replace(/Extension$/, '')
            .replace(/([a-z0-9])([A-Z])/g, (...matches) => matches[1] + '_' + matches[2].toLowerCase())
            .toLowerCase()
        ;
    }
}

module.exports = AbstractExtension;
