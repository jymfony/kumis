import { promisify } from 'util';

const EngineInterface = Jymfony.Component.Templating.Engine.EngineInterface;
const TemplateReferenceInterface = Jymfony.Component.Templating.TemplateReferenceInterface;
const streamOut = promisify(require('stream').Writable.prototype.write);

/**
 * @memberOf Kumis.Bundle
 */
export default class Engine extends implementationOf(EngineInterface) {
    /**
     * Constructor.
     *
     * @param {Kumis.Environment} environment
     */
    __construct(environment) {
        /**
         * @type {Kumis.Environment}
         *
         * @private
         */
        this._environment = environment;
    }

    /**
     * @inheritDoc
     */
    async render(out, name, parameters = {}) {
        if (name instanceof TemplateReferenceInterface) {
            name = name.toString();
        }

        await streamOut.call(out, await this._environment.render(name, parameters));
    }

    /**
     * @inheritDoc
     */
    exists(name) {
        return this._environment.hasTemplate(name);
    }

    /**
     * @inheritDoc
     */
    supports(name) {
        if (name instanceof TemplateReferenceInterface) {
            name = name.toString();
        }

        return name.endsWith('.kumis');
    }
}
