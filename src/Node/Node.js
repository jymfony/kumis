const NodeList = Kumis.Node.NodeList;

/**
 * @memberOf Kumis.Node
 */
export default class Node {
    /**
     * Constructor.
     *
     * @param {int} lineno
     * @param {int} colno
     * @param {*[]} args
     */
    __construct(lineno, colno, ...args) {
        /**
         * @type {int}
         */
        this.lineno = lineno;

        /**
         * @type {int}
         */
        this.colno = colno;

        this.fields.forEach((field, i) => {
            // The first two args are line/col numbers, so offset by 2
            let val = args[i];

            // Fields should never be undefined, but null. It makes
            // Testing easier to normalize values.
            if (val === undefined) {
                val = null;
            }

            this[field] = val;
        });
    }

    /**
     * The node type name.
     *
     * @returns {string}
     */
    get typename() {
        return this.constructor.name || 'Node';
    }

    /**
     * Node fields.
     *
     * @returns {string[]}
     */
    get fields() {
        return [];
    }

    /**
     * Finds all the children node of the given type.
     *
     * @param {Newable<Kumis.Node.Node>} type
     * @param {Kumis.Node.Node[]} [results = []]
     *
     * @returns {Kumis.Node.Node[]}
     */
    findAll(type, results = []) {
        if (this instanceof NodeList) {
            this.children.forEach(child => __self._traverseAndCheck(child, type, results));
        } else {
            this.fields.forEach(field => __self._traverseAndCheck(this[field], type, results));
        }

        return results;
    }

    /**
     * Traverses a node, searching for nodes of a given type.
     *
     * @param {Kumis.Node.Node} obj
     * @param {Newable<Kumis.Node.Node>} type
     * @param {Kumis.Node.Node[]} results
     *
     * @private
     */
    static _traverseAndCheck(obj, type, results) {
        if (obj instanceof type) {
            results.push(obj);
        }

        if (obj instanceof __self) {
            obj.findAll(type, results);
        }
    }
}
