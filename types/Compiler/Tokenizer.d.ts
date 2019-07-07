declare namespace Kumis.Compiler {
    export interface Token {
        type: string,
        value: any,
        lineno: number,
        colno: number,
    }

    /**
     * @memberOf Kumis.Compiler
     */
    export class Tokenizer {
        public static readonly TOKEN_STRING: string;
        public static readonly TOKEN_WHITESPACE: string;
        public static readonly TOKEN_DATA: string;
        public static readonly TOKEN_BLOCK_START: string;
        public static readonly TOKEN_BLOCK_END: string;
        public static readonly TOKEN_VARIABLE_START: string;
        public static readonly TOKEN_VARIABLE_END: string;
        public static readonly TOKEN_COMMENT: string;
        public static readonly TOKEN_LEFT_PAREN: string;
        public static readonly TOKEN_RIGHT_PAREN: string;
        public static readonly TOKEN_LEFT_BRACKET: string;
        public static readonly TOKEN_RIGHT_BRACKET: string;
        public static readonly TOKEN_LEFT_CURLY: string;
        public static readonly TOKEN_RIGHT_CURLY: string;
        public static readonly TOKEN_OPERATOR: string;
        public static readonly TOKEN_COMMA: string;
        public static readonly TOKEN_COLON: string;
        public static readonly TOKEN_TILDE: string;
        public static readonly TOKEN_PIPE: string;
        public static readonly TOKEN_INT: string;
        public static readonly TOKEN_FLOAT: string;
        public static readonly TOKEN_BOOLEAN: string;
        public static readonly TOKEN_NONE: string;
        public static readonly TOKEN_SYMBOL: string;
        public static readonly TOKEN_SPECIAL: string;
        public static readonly TOKEN_REGEX: string;

        public lineno: number;
        public colno: number;
        public tags: any;
        private _input: string;
        private _index: number;
        private _len: number;
        private _inCode: boolean;
        private _trimBlocks: boolean;

        /**
         * Constructor
         */
        __construct(str: string, opts: ParserOptions): void;
        constructor(str: string, opts: ParserOptions);

        /**
         * Gets the next token.
         */
        nextToken(): Token|null;

        /**
         * Whether is finished.
         */
        isFinished(): boolean;

        /**
         * Forward N characters
         */
        forwardN(n: number);

        /**
         * Forward
         */
        forward(): void;

        /**
         * Back n characters.
         *
         * @param {int} n
         */
        backN(n: number): void;

        /**
         * Go back.
         */
        back(): void;

        /**
         * Returns the current character
         */
        current(): string;

        /**
         * Returns what's left of the unparsed string
         */
        currentStr(): string;

        /**
         * Previous char
         */
        previous(): string;

        private _parseString(delimiter: string): string;

        /**
         * Whether current string matches.
         */
        private _matches(str: string): null|boolean;

        /**
         * Extracts matched string.
         */
        private _extractString(str: string): null|string;

        /**
         * Extract all non-matching chars, with the default matching set to everything
         */
        private _extractUntil(charString: string): null|string;

        /**
         * Extract all matching chars (no default, so charString must be explicit)
         */
        private _extract(charString: string): null|string;

        /**
         * Pull out characters until a breaking char is hit.
         * If breakOnMatch is false, a non-matching char stops it.
         * If breakOnMatch is true, a matching char stops it.
         */
        private _extractMatching(breakOnMatch: boolean, charString: string): null|string;

        /**
         * Extract from current string.
         */
        extractRegex(regex: RegExp): null|RegExpMatchArray;
    }
}
