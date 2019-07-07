const whitespaceChars = ' \n\t\r\u00A0';
const delimChars = '()[]{}%*-+~/#,:|.<>=!';
const intChars = '0123456789';

const BLOCK_START = '{%';
const BLOCK_END = '%}';
const VARIABLE_START = '{{';
const VARIABLE_END = '}}';
const COMMENT_START = '{#';
const COMMENT_END = '#}';

const TOKEN_STRING = 'string';
const TOKEN_WHITESPACE = 'whitespace';
const TOKEN_DATA = 'data';
const TOKEN_BLOCK_START = 'block-start';
const TOKEN_BLOCK_END = 'block-end';
const TOKEN_VARIABLE_START = 'variable-start';
const TOKEN_VARIABLE_END = 'variable-end';
const TOKEN_COMMENT = 'comment';
const TOKEN_LEFT_PAREN = 'left-paren';
const TOKEN_RIGHT_PAREN = 'right-paren';
const TOKEN_LEFT_BRACKET = 'left-bracket';
const TOKEN_RIGHT_BRACKET = 'right-bracket';
const TOKEN_LEFT_CURLY = 'left-curly';
const TOKEN_RIGHT_CURLY = 'right-curly';
const TOKEN_OPERATOR = 'operator';
const TOKEN_COMMA = 'comma';
const TOKEN_COLON = 'colon';
const TOKEN_TILDE = 'tilde';
const TOKEN_PIPE = 'pipe';
const TOKEN_INT = 'int';
const TOKEN_FLOAT = 'float';
const TOKEN_BOOLEAN = 'boolean';
const TOKEN_NONE = 'none';
const TOKEN_SYMBOL = 'symbol';
const TOKEN_SPECIAL = 'special';
const TOKEN_REGEX = 'regex';

/**
 * Token.
 *
 * @public
 * @typedef {Object} Token
 * @property {string} type Node type
 * @property {*} value Value of the token
 * @property {number} lineno 0-based line number
 * @property {number} colno 0-base column number
 */

/**
 * Creates a token.
 *
 * @param {string} type
 * @param {*} value
 * @param {int} lineno
 * @param {int} colno
 *
 * @returns {Token}
 */
function token(type, value, lineno, colno) {
    return {
        type: type,
        value: value,
        lineno: lineno,
        colno: colno,
    };
}

/**
 * @memberOf Kumis.Compiler
 */
class Tokenizer {
    __construct(str, opts = {}) {
        /**
         * Input string.
         *
         * @type {string}
         *
         * @private
         */
        this._input = str;

        /**
         * Current input position.
         *
         * @type {int}
         *
         * @private
         */
        this._index = 0;

        /**
         * Length of input.
         *
         * @type {int}
         *
         * @private
         */
        this._len = str.length;

        /**
         * Current line number.
         *
         * @type {int}
         */
        this.lineno = 0;

        /**
         * Current col number.
         *
         * @type {int}
         */
        this.colno = 0;

        /**
         * Whether we are processing a code block or not.
         *
         * @type {boolean}
         *
         * @private
         */
        this._inCode = false;

        const tags = opts.tags || {};

        /**
         * Custom delimiters.
         *
         * @type {Object.<string, string>}
         */
        this.tags = {
            BLOCK_START: tags.blockStart || BLOCK_START,
            BLOCK_END: tags.blockEnd || BLOCK_END,
            VARIABLE_START: tags.variableStart || VARIABLE_START,
            VARIABLE_END: tags.variableEnd || VARIABLE_END,
            COMMENT_START: tags.commentStart || COMMENT_START,
            COMMENT_END: tags.commentEnd || COMMENT_END,
        };

        /**
         * Whether to trim blocks while parsing.
         *
         * @type {boolean}
         *
         * @private
         */
        this._trimBlocks = !! opts.trimBlocks;

        /**
         * Whether to strip left spaces in blocks.
         *
         * @type {boolean}
         *
         * @private
         */
        this._lstripBlocks = !! opts.lstripBlocks;
    }

    /**
     * Gets the next token.
     *
     * @returns {Token|null}
     */
    nextToken() {
        const lineno = this.lineno;
        const colno = this.colno;
        let tok;

        if (this._inCode) {
            // Otherwise, if we are in a block parse it as code
            let cur = this.current();

            if (this.isFinished()) {
                // We have nothing else to parse
                return null;
            } else if ('"' === cur || '\'' === cur) {
                // We've hit a string
                return token(TOKEN_STRING, this._parseString(cur), lineno, colno);
            } else if ((tok = this._extract(whitespaceChars))) {
                // We hit some whitespace
                return token(TOKEN_WHITESPACE, tok, lineno, colno);
            } else if ((tok = this._extractString(this.tags.BLOCK_END)) ||
                (tok = this._extractString('-' + this.tags.BLOCK_END))) {
                // Special check for the block end tag
                //
                // It is a requirement that start and end tags are composed of
                // Delimiter characters (%{}[] etc), and our code always
                // Breaks on delimiters so we can assume the token parsing
                // Doesn't consume these elsewhere
                this._inCode = false;
                if (this._trimBlocks) {
                    cur = this.current();
                    if ('\n' === cur) {
                        // Skip newline
                        this.forward();
                    } else if ('\r' === cur) {
                        // Skip CRLF newline
                        this.forward();
                        cur = this.current();
                        if ('\n' === cur) {
                            this.forward();
                        } else {
                            // Was not a CRLF, so go back
                            this.back();
                        }
                    }
                }
                return token(TOKEN_BLOCK_END, tok, lineno, colno);
            } else if ((tok = this._extractString(this.tags.VARIABLE_END)) ||
                (tok = this._extractString('-' + this.tags.VARIABLE_END))) {
                // Special check for variable end tag (see above)
                this._inCode = false;
                return token(TOKEN_VARIABLE_END, tok, lineno, colno);
            } else if ('r' === cur && '/' === this._input.charAt(this._index + 1)) {
                // Skip past 'r/'.
                this.forwardN(2);

                // Extract until the end of the regex -- / ends it, \/ does not.
                let regexBody = '';
                while (!this.isFinished()) {
                    if ('/' === this.current() && '\\' !== this.previous()) {
                        this.forward();
                        break;
                    } else {
                        regexBody += this.current();
                        this.forward();
                    }
                }

                // Check for flags.
                // The possible flags are according to https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
                const POSSIBLE_FLAGS = [ 'g', 'i', 'm', 'y' ];
                let regexFlags = '';
                while (!this.isFinished()) {
                    const isCurrentAFlag = -1 !== POSSIBLE_FLAGS.indexOf(this.current());
                    if (isCurrentAFlag) {
                        regexFlags += this.current();
                        this.forward();
                    } else {
                        break;
                    }
                }

                return token(TOKEN_REGEX, {
                    body: regexBody,
                    flags: regexFlags,
                }, lineno, colno);
            } else if (-1 !== delimChars.indexOf(cur)) {
                // We've hit a delimiter (a special char like a bracket)
                this.forward();
                const complexOps = [ '==', '===', '!=', '!==', '<=', '>=', '//', '**' ];
                const curComplex = cur + this.current();
                let type;

                if (-1 !== complexOps.indexOf(curComplex)) {
                    this.forward();
                    cur = curComplex;

                    // See if this is a strict equality/inequality comparator
                    if (-1 !== complexOps.indexOf(curComplex + this.current())) {
                        cur = curComplex + this.current();
                        this.forward();
                    }
                }

                switch (cur) {
                    case '(':
                        type = TOKEN_LEFT_PAREN;
                        break;
                    case ')':
                        type = TOKEN_RIGHT_PAREN;
                        break;
                    case '[':
                        type = TOKEN_LEFT_BRACKET;
                        break;
                    case ']':
                        type = TOKEN_RIGHT_BRACKET;
                        break;
                    case '{':
                        type = TOKEN_LEFT_CURLY;
                        break;
                    case '}':
                        type = TOKEN_RIGHT_CURLY;
                        break;
                    case ',':
                        type = TOKEN_COMMA;
                        break;
                    case ':':
                        type = TOKEN_COLON;
                        break;
                    case '~':
                        type = TOKEN_TILDE;
                        break;
                    case '|':
                        type = TOKEN_PIPE;
                        break;
                    default:
                        type = TOKEN_OPERATOR;
                }

                return token(type, cur, lineno, colno);
            }
            // We are not at whitespace or a delimiter, so extract the
            // Text and parse it
            tok = this._extractUntil(whitespaceChars + delimChars);

            if (tok.match(/^[-+]?[0-9]+$/)) {
                if ('.' === this.current()) {
                    this.forward();
                    const dec = this._extract(intChars);
                    return token(TOKEN_FLOAT, tok + '.' + dec, lineno, colno);
                }
                return token(TOKEN_INT, tok, lineno, colno);

            } else if (tok.match(/^(true|false)$/)) {
                return token(TOKEN_BOOLEAN, tok, lineno, colno);
            } else if ('none' === tok) {
                return token(TOKEN_NONE, tok, lineno, colno);
            } else if ('null' === tok) {
                /*
                 * Added to make the test `null is null` evaluate truthily.
                 * Otherwise, Kumis will look up null in the context and
                 * return `undefined`, which is not what we want. This *may* have
                 * consequences is someone is using null in their templates as a
                 * variable.
                 */
                return token(TOKEN_NONE, tok, lineno, colno);
            } else if (tok) {
                return token(TOKEN_SYMBOL, tok, lineno, colno);
            }

            throw new Error('Unexpected value while parsing: ' + tok);
        } else {
            // Parse out the template text, breaking on tag
            // Delimiters because we need to look for block/variable start
            // Tags (don't use the full delimChars for optimization)
            const beginChars = (this.tags.BLOCK_START.charAt(0) +
                this.tags.VARIABLE_START.charAt(0) +
                this.tags.COMMENT_START.charAt(0) +
                this.tags.COMMENT_END.charAt(0));

            if (this.isFinished()) {
                return null;
            } else if ((tok = this._extractString(this.tags.BLOCK_START + '-')) ||
                (tok = this._extractString(this.tags.BLOCK_START))) {
                this._inCode = true;
                return token(TOKEN_BLOCK_START, tok, lineno, colno);
            } else if ((tok = this._extractString(this.tags.VARIABLE_START + '-')) ||
                (tok = this._extractString(this.tags.VARIABLE_START))) {
                this._inCode = true;
                return token(TOKEN_VARIABLE_START, tok, lineno, colno);
            }

            tok = '';
            let data;
            let inComment = false;

            if (this._matches(this.tags.COMMENT_START)) {
                inComment = true;
                tok = this._extractString(this.tags.COMMENT_START);
            }

            // Continually consume text, breaking on the tag delimiter
            // Characters and checking to see if it's a start tag.
            //
            // We could hit the end of the template in the middle of
            // Our looping, so check for the null return value from
            // _extractUntil
            while (null !== (data = this._extractUntil(beginChars))) {
                tok += data;

                if ((this._matches(this.tags.BLOCK_START) ||
                    this._matches(this.tags.VARIABLE_START) ||
                    this._matches(this.tags.COMMENT_START)) &&
                    !inComment) {
                    if (this._lstripBlocks &&
                        this._matches(this.tags.BLOCK_START) &&
                        0 < this.colno &&
                        this.colno <= tok.length) {
                        const lastLine = tok.slice(-this.colno);
                        if (/^\s+$/.test(lastLine)) {
                            // Remove block leading whitespace from beginning of the string
                            tok = tok.slice(0, -this.colno);
                            if (!tok.length) {
                                // All data removed, collapse to avoid unnecessary nodes
                                // By returning next token (block start)
                                return this.nextToken();
                            }
                        }
                    }
                    // If it is a start tag, stop looping
                    break;
                } else if (this._matches(this.tags.COMMENT_END)) {
                    if (!inComment) {
                        throw new Error('unexpected end of comment');
                    }
                    tok += this._extractString(this.tags.COMMENT_END);
                    break;
                } else {
                    // It does not match any tag, so add the character and
                    // Carry on
                    tok += this.current();
                    this.forward();
                }
            }

            if (null === data && inComment) {
                throw new Error('expected end of comment, got end of file');
            }

            return token(inComment ? TOKEN_COMMENT : TOKEN_DATA, tok, lineno, colno);
        }
    }

    /**
     * Whether is finished.
     *
     * @returns {boolean}
     */
    isFinished() {
        return this._index >= this._len;
    }

    /**
     * Forward N characters
     *
     * @param {int} n
     */
    forwardN(n) {
        for (let i = 0; i < n; i++) {
            this.forward();
        }
    }

    /**
     * Forward
     */
    forward() {
        this._index++;

        if ('\n' === this.previous()) {
            this.lineno++;
            this.colno = 0;
        } else {
            this.colno++;
        }
    }

    /**
     * Back n characters.
     *
     * @param {int} n
     */
    backN(n) {
        for (let i = 0; i < n; i++) {
            this.back();
        }
    }

    /**
     * Go back.
     */
    back() {
        this._index--;

        if ('\n' === this.current()) {
            this.lineno--;

            const idx = this._input.lastIndexOf('\n', this._index - 1);
            if (-1 === idx) {
                this.colno = this._index;
            } else {
                this.colno = this._index - idx;
            }
        } else {
            this.colno--;
        }
    }

    /**
     * Returns the current character
     *
     * @returns {string}
     */
    current() {
        if (!this.isFinished()) {
            return this._input.charAt(this._index);
        }

        return '';
    }

    /**
     * Returns what's left of the unparsed string
     *
     * @returns {string}
     */
    currentStr() {
        if (!this.isFinished()) {
            return this._input.substr(this._index);
        }

        return '';
    }

    /**
     * Previous char
     *
     * @returns {string}
     */
    previous() {
        return this._input.charAt(this._index - 1);
    }

    /**
     * @param {string} delimiter
     *
     * @returns {string}
     *
     * @private
     */
    _parseString(delimiter) {
        this.forward();

        let str = '';

        while (!this.isFinished() && this.current() !== delimiter) {
            const cur = this.current();

            if ('\\' === cur) {
                this.forward();
                switch (this.current()) {
                    case 'n':
                        str += '\n';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    default:
                        str += this.current();
                }
                this.forward();
            } else {
                str += cur;
                this.forward();
            }
        }

        this.forward();
        return str;
    }

    /**
     * Whether current string matches.
     *
     * @param {string} str
     *
     * @returns {null|boolean}
     *
     * @private
     */
    _matches(str) {
        if (this._index + str.length > this._len) {
            return null;
        }

        const m = this._input.slice(this._index, this._index + str.length);

        return m === str;
    }

    /**
     * Extracts matched string.
     *
     * @param {string} str
     *
     * @returns {null|string}
     *
     * @private
     */
    _extractString(str) {
        if (this._matches(str)) {
            this.forwardN(str.length);
            return str;
        }

        return null;
    }

    /**
     * Extract all non-matching chars, with the default matching set to everything
     *
     * @param {string} charString
     *
     * @returns {string|null}
     *
     * @private
     */
    _extractUntil(charString) {
        return this._extractMatching(true, charString || '');
    }

    /**
     * Extract all matching chars (no default, so charString must be explicit)
     *
     * @param {string} charString
     *
     * @returns {string|null}
     *
     * @private
     */
    _extract(charString) {
        return this._extractMatching(false, charString);
    }

    /**
     * Pull out characters until a breaking char is hit.
     * If breakOnMatch is false, a non-matching char stops it.
     * If breakOnMatch is true, a matching char stops it.
     *
     * @param {boolean} breakOnMatch
     * @param {string} charString
     *
     * @returns {string|null}
     *
     * @private
     */
    _extractMatching(breakOnMatch, charString) {
        if (this.isFinished()) {
            return null;
        }

        const first = charString.indexOf(this.current());

        // Only proceed if the first character doesn't meet our condition
        if ((breakOnMatch && -1 === first) ||
            (! breakOnMatch && -1 !== first)) {
            let t = this.current();
            this.forward();

            // And pull out all the chars one at a time until we hit a
            // Breaking char
            let idx = charString.indexOf(this.current());

            while (((breakOnMatch && -1 === idx) ||
                (!breakOnMatch && -1 !== idx)) && ! this.isFinished()) {
                t += this.current();
                this.forward();

                idx = charString.indexOf(this.current());
            }

            return t;
        }

        return '';
    }

    /**
     * Extract from current string.
     *
     * @param {RegExp} regex
     *
     * @returns {null|RegExpMatchArray}
     */
    extractRegex(regex) {
        const matches = this.currentStr().match(regex);
        if (! matches) {
            return null;
        }

        // Move forward whatever was matched
        this.forwardN(matches[0].length);

        return matches;
    }
}

Tokenizer.TOKEN_STRING = TOKEN_STRING;
Tokenizer.TOKEN_WHITESPACE = TOKEN_WHITESPACE;
Tokenizer.TOKEN_DATA = TOKEN_DATA;
Tokenizer.TOKEN_BLOCK_START = TOKEN_BLOCK_START;
Tokenizer.TOKEN_BLOCK_END = TOKEN_BLOCK_END;
Tokenizer.TOKEN_VARIABLE_START = TOKEN_VARIABLE_START;
Tokenizer.TOKEN_VARIABLE_END = TOKEN_VARIABLE_END;
Tokenizer.TOKEN_COMMENT = TOKEN_COMMENT;
Tokenizer.TOKEN_LEFT_PAREN = TOKEN_LEFT_PAREN;
Tokenizer.TOKEN_RIGHT_PAREN = TOKEN_RIGHT_PAREN;
Tokenizer.TOKEN_LEFT_BRACKET = TOKEN_LEFT_BRACKET;
Tokenizer.TOKEN_RIGHT_BRACKET = TOKEN_RIGHT_BRACKET;
Tokenizer.TOKEN_LEFT_CURLY = TOKEN_LEFT_CURLY;
Tokenizer.TOKEN_RIGHT_CURLY = TOKEN_RIGHT_CURLY;
Tokenizer.TOKEN_OPERATOR = TOKEN_OPERATOR;
Tokenizer.TOKEN_COMMA = TOKEN_COMMA;
Tokenizer.TOKEN_COLON = TOKEN_COLON;
Tokenizer.TOKEN_TILDE = TOKEN_TILDE;
Tokenizer.TOKEN_PIPE = TOKEN_PIPE;
Tokenizer.TOKEN_INT = TOKEN_INT;
Tokenizer.TOKEN_FLOAT = TOKEN_FLOAT;
Tokenizer.TOKEN_BOOLEAN = TOKEN_BOOLEAN;
Tokenizer.TOKEN_NONE = TOKEN_NONE;
Tokenizer.TOKEN_SYMBOL = TOKEN_SYMBOL;
Tokenizer.TOKEN_SPECIAL = TOKEN_SPECIAL;
Tokenizer.TOKEN_REGEX = TOKEN_REGEX;

module.exports = Tokenizer;
