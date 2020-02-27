const TemplateError = Kumis.Exception.TemplateError;

/**
 * @memberOf Kumis.Exception
 */
export default class UndefinedVariableError extends TemplateError {
    __construct(name, lineno = undefined, colno = undefined) {
        super.__construct(__jymfony.sprintf('Undefined variable "%s"', name), lineno, colno);
    }
}
