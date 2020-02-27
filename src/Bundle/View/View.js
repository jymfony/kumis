const Response = Jymfony.Component.HttpFoundation.Response;

/**
 * @memberOf Kumis.Bundle.View
 */
export default class View {
    /**
     * Constructor.
     *
     * @param {string} template
     * @param {Object.<string, *>} context
     * @param {int} statusCode
     * @param {Object.<string, *>} headers
     */
    __construct(template, context = {}, statusCode = Response.HTTP_OK, headers = {}) {
        /**
         * @type {string}
         *
         * @private
         */
        this._template = template;

        /**
         * @type {Object<string, *>}
         *
         * @private
         */
        this._context = context;

        /**
         * @type {int}
         *
         * @private
         */
        this._statusCode = statusCode;

        /**
         * @type {Object<string, *>}
         *
         * @private
         */
        this._headers = headers;
    }

    /**
     * Gets the template name.
     *
     * @returns {string}
     */
    get template() {
        return this._template;
    }

    /**
     * Returns the template parameters.
     *
     * @returns {Object<string, *>}
     */
    get context() {
        return this._context;
    }

    /**
     * Response status code.
     *
     * @returns {int}
     */
    get statusCode() {
        return this._statusCode;
    }

    /**
     * Additional response headers.
     *
     * @returns {Object<string, *>}
     */
    get headers() {
        return this._headers;
    }
}
