const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class BinOp extends Node {
    get fields() {
        return [ 'left', 'right' ];
    }
}
