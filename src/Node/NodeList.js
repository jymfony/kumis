const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class NodeList extends Node {
    __construct(lineno, colno, nodes = []) {
        super.__construct(lineno, colno, nodes || []);
    }

    get fields() {
        return [ 'children' ];
    }

    addChild(node) {
        this.children.push(node);
    }
}
