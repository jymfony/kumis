const TemplateError = Kumis.Exception.TemplateError;
const Runtime = Kumis.Runtime;
const SafeString = Kumis.Util.SafeString;

export function normalize(value, defaultValue) {
    if (null === value || value === undefined || false === value) {
        return defaultValue;
    }
    return value;
}

export const abs = Math.abs;

export function isNaN(num) {
    return num !== num; // eslint-disable-line no-self-compare
}

export function batch(arr, linecount, fillWith) {
    let i;
    const res = [];
    let tmp = [];

    for (i = 0; i < arr.length; i++) {
        if (0 === i % linecount && tmp.length) {
            res.push(tmp);
            tmp = [];
        }

        tmp.push(arr[i]);
    }

    if (tmp.length) {
        if (fillWith) {
            for (i = tmp.length; i < linecount; i++) {
                tmp.push(fillWith);
            }
        }

        res.push(tmp);
    }

    return res;
}

export function capitalize(str) {
    str = normalize(str, '');
    const ret = str.toLowerCase();

    return SafeString.copy(str, ret.charAt(0).toUpperCase() + ret.slice(1));
}

export function center(str, width) {
    str = normalize(str, '');
    width = width || 80;

    if (str.length >= width) {
        return str;
    }

    const spaces = width - str.length;
    const pre = ' '.repeat((spaces / 2) - (spaces % 2));
    const post = ' '.repeat(spaces / 2);

    return SafeString.copy(str, pre + str + post);
}

export function defaultValue(val, def, bool) {
    if (bool) {
        return val || def;
    }

    return (val !== undefined) ? val : def;
}

export default defaultValue;

export function dictsort(val, caseSensitive, by) {
    if (! isObjectLiteral(val)) {
        throw new TemplateError('dictsort filter: val must be an object');
    }

    const array = [];
    // Deliberately include properties from the object's prototype
    for (const k in val) { // eslint-disable-line guard-for-in, no-restricted-syntax
        array.push([ k, val[k] ]);
    }

    let si;
    if (by === undefined || 'key' === by) {
        si = 0;
    } else if ('value' === by) {
        si = 1;
    } else {
        throw new TemplateError(
            'dictsort filter: You can only sort by either key or value');
    }

    array.sort((t1, t2) => {
        let a = t1[si];
        let b = t2[si];

        if (!caseSensitive) {
            if (isString(a)) {
                a = a.toUpperCase();
            }
            if (isString(b)) {
                b = b.toUpperCase();
            }
        }

        return a > b ? 1 : (a === b ? 0 : -1); // eslint-disable-line no-nested-ternary
    });

    return array;
}

export function dump(obj, spaces) {
    return JSON.stringify(obj, null, spaces);
}

export function escape(str) {
    if (str instanceof SafeString) {
        return str;
    }

    str = (null === str || str === undefined) ? '' : str;
    return SafeString.markSafe(__jymfony.htmlentities(str.toString(), 'ENT_QUOTES'));
}

export function safe(str) {
    if (str instanceof SafeString) {
        return str;
    }

    str = (null === str || str === undefined) ? '' : str;
    return SafeString.markSafe(str.toString());
}

export function first(arr) {
    return arr[0];
}

export function forceescape(str) {
    str = (null === str || str === undefined) ? '' : str;
    return SafeString.markSafe(__jymfony.htmlentities(str.toString(), 'ENT_QUOTES'));
}

export function groupby(obj, val) {
    const result = {};
    const iterator = isFunction(val) ? val : (o) => o[val];

    for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        const key = iterator(value, i);
        (result[key] || (result[key] = [])).push(value);
    }

    return result;
}

export function indent(str, width, indentfirst) {
    str = normalize(str, '');

    if ('' === str) {
        return '';
    }

    width = width || 4;
    // Let res = '';
    const lines = str.split('\n');
    const sp = ' '.repeat(width);

    const res = lines.map((l, i) => {
        return (0 === i && !indentfirst) ? `${l}\n` : `${sp}${l}\n`;
    }).join('');

    return SafeString.copy(str, res);
}

export function join(arr, del, attr) {
    del = del || '';

    if (attr) {
        arr = arr.map(v => v[attr]);
    }

    return arr.join(del);
}

export function last(arr) {
    return arr[arr.length - 1];
}

export function length(val) {
    const value = normalize(val, '');

    if (value !== undefined) {
        if (value instanceof Map || value instanceof Set) {
            // ECMAScript 2015 Maps and Sets
            return value.size;
        }
        if (isObjectLiteral(value) && ! (value instanceof SafeString)) {
            // Objects (besides SafeStrings), non-primative Arrays
            return __jymfony.keys(value).length;
        }
        return value.length;
    }
    return 0;
}

export function list(val) {
    if (isString(val)) {
        return val.split('');
    } else if (isObjectLiteral(val)) {
        return [ ...__jymfony.getEntries(val || {}) ].map(([ key, value ]) => ({key, value}));
    } else if (isArray(val)) {
        return val;
    }
    throw new TemplateError('list filter: type not iterable');

}

export function lower(str) {
    str = normalize(str, '');
    return str.toLowerCase();
}

export function nl2br(str) {
    if (null === str || str === undefined) {
        return '';
    }
    return SafeString.copy(str, str.replace(/\r\n|\n/g, '<br />\n'));
}

export function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function rejectattr(arr, attr) {
    return arr.filter((item) => !item[attr]);
}

export function selectattr(arr, attr) {
    return arr.filter((item) => !!item[attr]);
}

export function replace(str, old, new_, maxCount = -1) {
    const originalStr = str;

    if (old instanceof RegExp) {
        return str.replace(old, new_);
    }

    let res = ''; // Output

    // Cast Numbers in the search term to string
    if (isNumber(old)) {
        old = '' + old;
    } else if (! isString(old)) {
        // If it is something other than number or string,
        // Return the original string
        return str;
    }

    // Cast numbers in the replacement to string
    if (isNumber(str)) {
        str = '' + str;
    }

    // If by now, we don't have a string, throw it back
    if (! isString(str) && !(str instanceof SafeString)) {
        return str;
    }

    // ShortCircuits
    if ('' === old) {
    // Mimic the python behaviour: empty string is replaced
    // By replacement e.g. "abc"|replace("", ".") -> .a.b.c.
        res = new_ + str.split('').join(new_) + new_;
        return SafeString.copy(str, res);
    }

    let nextIndex = str.indexOf(old);
    // If # of replacements to perform is 0, or the string to does
    // Not contain the old value, return the string
    if (0 === maxCount || -1 === nextIndex) {
        return str;
    }

    let pos = 0;
    let count = 0; // # of replacements made

    while (-1 < nextIndex && (-1 === maxCount || count < maxCount)) {
    // Grab the next chunk of src string and add it with the
    // Replacement, to the result
        res += str.substring(pos, nextIndex) + new_;
        // Increment our pointer in the src string
        pos = nextIndex + old.length;
        count++;
        // See if there are any more replacements to be made
        nextIndex = str.indexOf(old, pos);
    }

    // We've either reached the end, or done the max # of
    // Replacements, tack on any remaining string
    if (pos < str.length) {
        res += str.substring(pos);
    }

    return SafeString.copy(originalStr, res);
}

export function reverse(val) {
    let arr;
    if (isString(val)) {
        arr = list(val);
    } else {
        // Copy it
        arr = [ ...val ];
    }

    arr.reverse();

    if (isString(val)) {
        return SafeString.copy(val, arr.join(''));
    }
    return arr;
}

export function round(val, precision, method) {
    precision = precision || 0;
    const factor = Math.pow(10, precision);
    let rounder;

    if ('ceil' === method) {
        rounder = Math.ceil;
    } else if ('floor' === method) {
        rounder = Math.floor;
    } else {
        rounder = Math.round;
    }

    return rounder(val * factor) / factor;
}

export function slice(arr, slices, fillWith) {
    const sliceLength = Math.floor(arr.length / slices);
    const extra = arr.length % slices;
    const res = [];
    let offset = 0;

    for (let i = 0; i < slices; i++) {
        const start = offset + (i * sliceLength);
        if (i < extra) {
            offset++;
        }
        const end = offset + ((i + 1) * sliceLength);

        const currSlice = arr.slice(start, end);
        if (fillWith && i >= extra) {
            currSlice.push(fillWith);
        }
        res.push(currSlice);
    }

    return res;
}

export function sum(arr, attr, start = 0) {
    if (attr) {
        arr = Object.values(arr).map(v => v[attr]);
    }

    return start + arr.reduce((a, b) => a + b, 0);
}

export const sort = Runtime.makeMacro(
    [ 'value', 'reverse', 'case_sensitive', 'attribute' ], [],
    (arr, reversed, caseSens, attr) => {
        // Copy it
        const array = [ ...arr ];

        array.sort((a, b) => {
            let x = (attr) ? a[attr] : a;
            let y = (attr) ? b[attr] : b;

            if (!caseSens && isString(x) && isString(y)) {
                x = x.toLowerCase();
                y = y.toLowerCase();
            }

            if (x < y) {
                return reversed ? 1 : -1;
            } else if (x > y) {
                return reversed ? -1 : 1;
            }
            return 0;

        });

        return array;
    });

export function string(obj) {
    return SafeString.copy(obj, obj);
}

export function striptags(input, preserveLinebreaks) {
    input = normalize(input, '');
    const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi;
    const trimmedInput = trim(input.replace(tags, ''));
    let res = '';
    if (preserveLinebreaks) {
        res = trimmedInput
            .replace(/^ +| +$/gm, '') // Remove leading and trailing spaces
            .replace(/ +/g, ' ') // Squash adjacent spaces
            .replace(/(\r\n)/g, '\n') // Normalize linebreaks (CRLF -> LF)
            .replace(/\n\n\n+/g, '\n\n'); // Squash abnormal adjacent linebreaks
    } else {
        res = trimmedInput.replace(/\s+/gi, ' ');
    }
    return SafeString.copy(input, res);
}

export function title(str) {
    str = normalize(str, '');
    const words = str.split(' ').map(word => capitalize(word));
    return SafeString.copy(str, words.join(' '));
}

export function trim(str) {
    return SafeString.copy(str, str.replace(/^\s*|\s*$/g, ''));
}

export function truncate(input, length, killwords, end) {
    const orig = input;
    input = normalize(input, '');
    length = length || 255;

    if (input.length <= length) {
        return input;
    }

    if (killwords) {
        input = input.substring(0, length);
    } else {
        let idx = input.lastIndexOf(' ', length);
        if (-1 === idx) {
            idx = length;
        }

        input = input.substring(0, idx);
    }

    input += (end !== undefined && null !== end) ? end : '...';
    return SafeString.copy(orig, input);
}

export function upper(str) {
    str = normalize(str, '');
    return str.toUpperCase();
}

export function urlencode(obj) {
    const enc = encodeURIComponent;
    if (isString(obj)) {
        return enc(obj);
    }
    const keyvals = (isArray(obj)) ? obj : [ ...__jymfony.getEntries(obj) ];
    return keyvals.map(([ k, v ]) => `${enc(k)}=${enc(v)}`).join('&');

}

// For the jinja regexp, see
// https://github.com/mitsuhiko/jinja2/blob/f15b814dcba6aa12bc74d1f7d0c881d55f7126be/jinja2/utils.py#L20-L23
const puncRe = /^(?:\(|<|&lt;)?(.*?)(?:\.|,|\)|\n|&gt;)?$/;
// From http://blog.gerv.net/2011/05/html5_email_address_regexp/
const emailRe = /^[\w.!#$%&'*+\-\/=?\^`{|}~]+@[a-z\d\-]+(\.[a-z\d\-]+)+$/i;
const httpHttpsRe = /^https?:\/\/.*$/;
const wwwRe = /^www\./;
const tldRe = /\.(?:org|net|com)(?:\:|\/|$)/;

export function urlize(str, length, nofollow) {
    if (isNaN(length)) {
        length = Infinity;
    }

    const noFollowAttr = (true === nofollow ? ' rel="nofollow"' : '');

    const words = str.split(/(\s+)/).filter((word) => {
    // If the word has no length, bail. This can happen for str with
    // Trailing whitespace.
        return word && word.length;
    }).map((word) => {
        const matches = word.match(puncRe);
        const possibleUrl = (matches) ? matches[1] : word;
        const shortUrl = possibleUrl.substr(0, length);

        // Url that starts with http or https
        if (httpHttpsRe.test(possibleUrl)) {
            return `<a href="${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;
        }

        // Url that starts with www.
        if (wwwRe.test(possibleUrl)) {
            return `<a href="http://${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;
        }

        // An email address of the form username@domain.tld
        if (emailRe.test(possibleUrl)) {
            return `<a href="mailto:${possibleUrl}">${possibleUrl}</a>`;
        }

        // Url that ends in .com, .org or .net that is not an email address
        if (tldRe.test(possibleUrl)) {
            return `<a href="http://${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;
        }

        return word;
    });

    return words.join('');
}

export function wordcount(str) {
    str = normalize(str, '');
    const words = (str) ? str.match(/\w+/g) : null;
    return (words) ? words.length : null;
}

export function float(val, def) {
    const res = parseFloat(val);
    return (isNaN(res)) ? def : res;
}

export function int(val, def) {
    const res = parseInt(val, 10);
    return (isNaN(res)) ? def : res;
}

// Aliases
export const d = defaultValue;
export const e = escape;
