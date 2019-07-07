declare namespace Kumis.Exception {
    export class TemplateError extends RuntimeException {
        /**
         * Constructor
         *
         * @param {string|Error} message
         * @param {int} lineno
         * @param {int} colno
         */
        // @ts-ignore
        __construct(message: string|Error, lineno?: number, colno?: number): void;
        constructor(message: string|Error, lineno?: number, colno?: number);

        public message: string;

        /**
         * Wraps an error into a TemplateError.
         */
        static create(path: string, previous: Error): TemplateError;
    }
}
