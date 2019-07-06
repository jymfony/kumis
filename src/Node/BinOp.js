const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class BinOp extends Node {
    get fields() {
        return [ 'left', 'right' ];
    }
}

module.exports = BinOp;
