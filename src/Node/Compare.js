const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Compare extends Node {
    get fields() {
        return [ 'expr', 'ops' ];
    }
}

module.exports = Compare;
