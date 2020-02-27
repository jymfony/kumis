const Node = Kumis.Node.Node;
const NodeList = Kumis.Node.NodeList;

/**
 * @memberOf Kumis.Node
 */
export default class FromImport extends Node {
    __construct(lineno, colno, template, names, withContext) {
        super.__construct(lineno, colno, template, names || new NodeList(), withContext);
    }

    get fields() {
        return [ 'template', 'names', 'withContext' ];
    }
}
