const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class CompareOperand extends Node {
    get fields() {
        return [ 'expr', 'type' ];
    }
}

module.exports = CompareOperand;
