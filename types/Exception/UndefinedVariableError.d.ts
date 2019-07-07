declare namespace Kumis.Exception {
    export class UndefinedVariableError extends TemplateError {
        __construct(name: string, lineno?: number, colno?: number): void;
        constructor(name: string, lineno?: number, colno?: number);
    }
}
