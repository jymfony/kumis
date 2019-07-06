const NodeList = Kumis.Node.NodeList;

/**
 * @memberOf Kumis.Node
 */
class Node {
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
        this.body = undefined;
        this.value = undefined;

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

    get typename() {
        return this.constructor.name;
    }

    get fields() {
        return [];
    }

    findAll(type, results) {
        results = results || [];

        if (this instanceof NodeList) {
            this.children.forEach(child => __self.traverseAndCheck(child, type, results));
        } else {
            this.fields.forEach(field => __self.traverseAndCheck(this[field], type, results));
        }

        return results;
    }

    iterFields(func) {
        this.fields.forEach((field) => {
            func(this[field], field);
        });
    }

    static traverseAndCheck(obj, type, results) {
        if (obj instanceof type) {
            results.push(obj);
        }

        if (obj instanceof __self) {
            obj.findAll(type, results);
        }
    }
}

module.exports = Node;
