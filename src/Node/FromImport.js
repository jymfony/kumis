const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class FromImport extends Node {
    __construct(lineno, colno, template, names, withContext) {
        super.__construct(lineno, colno, template, names || new NodeList(), withContext);
    }

    get fields() {
        return [ 'template', 'names', 'withContext' ];
    }
}

module.exports = FromImport;
