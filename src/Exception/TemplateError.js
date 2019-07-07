/**
 * @memberOf Kumis.Exception
 */
class TemplateError extends RuntimeException {
    /**
     * Constructor
     *
     * @param {string|Error} message
     * @param {int} lineno
     * @param {int} colno
     */
    __construct(message, lineno = undefined, colno = undefined) {
        const previous = message instanceof Error ? message : undefined;
        if (undefined !== previous) {
            message = `${previous.name}: ${previous.message}`;
        }

        this.lineno = lineno;
        this.colno = colno;
        this.path = undefined;

        super.__construct(message, 0, previous);
    }

    get message() {
        if (!! this.path) {
            return __jymfony.sprintf('(%s) [Line %u, Column %u]\n  %s', this.path, this.lineno, this.colno, super.message);
        }

        return super.message;
    }

    /**
     * Wraps an error into a TemplateError.
     *
     * @param {string} path
     * @param {Error|Kumis.Exception.TemplateError} previous
     *
     * @returns {Kumis.Exception.TemplateError}
     */
    static create(path, previous) {
        if (previous instanceof __self) {
            previous.path = path;

            return previous;
        }

        const obj = new __self(previous);
        obj.path = path;

        return obj;
    }
}

module.exports = TemplateError;
