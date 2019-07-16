declare namespace Kumis.Bundle.View {
    export class View {
        private _template: string;
        private _context: Record<string, any>;
        private _statusCode: number;
        private _headers: Record<string, any>;

        /**
         * Constructor.
         */
        __construct(template: string, context?: Record<string, any>, statusCode?: number, headers?: Record<string, any>): void;
        constructor(template: string, context?: Record<string, any>, statusCode?: number, headers?: Record<string, any>);

        /**
         * Gets the template name.
         */
        public template: string;

        /**
         * Returns the template parameters.
         */
        public context: Record<string, any>;

        /**
         * Response status code.
         */
        public statusCode: number;

        /**
         * Additional response headers.
         */
        public headers: Record<string, any>;
    }
}
