const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class UnaryOp extends Node {
    get fields() {
        return [ 'target' ];
    }
}
