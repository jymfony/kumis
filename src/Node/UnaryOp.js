const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class UnaryOp extends Node {
    get fields() {
        return [ 'target' ];
    }
}

module.exports = UnaryOp;
