const Response = Jymfony.Component.HttpFoundation.Response;
const EventSubscriberInterface = Jymfony.Contracts.EventDispatcher.EventSubscriberInterface;
const View = Kumis.Bundle.View.View;

/**
 * @memberOf Kumis.Bundle.View
 */
class ViewHandler extends implementationOf(EventSubscriberInterface) {
    /**
     * Constructor.
     *
     * @param {Kumis.Bundle.Engine} engine
     */
    __construct(engine) {
        /**
         * @type {Kumis.Bundle.Engine}
         *
         * @private
         */
        this._engine = engine;
    }

    /**
     * Handles View object returned by controller.
     *
     * @param {Jymfony.Component.HttpServer.Event.GetResponseForControllerResultEvent} event
     */
    async onView(event) {
        const result = event.controllerResult;
        if (! (result instanceof View)) {
            return;
        }

        const request = event.request;
        const buffer = new __jymfony.StreamBuffer();
        const params = result.context;
        params.app = { request, ...(params.app || {}) };

        await this._engine.render(buffer, result.template, params);

        event.response = new Response(buffer.buffer, result.statusCode, result.headers);
    }

    /**
     * @inheritDoc
     */
    static getSubscribedEvents() {
        return {
            'http.view': 'onView',
        }
    }
}

module.exports = ViewHandler;
