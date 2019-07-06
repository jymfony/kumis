const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class FunCall extends Node {
    get fields() {
        return [ 'name', 'args' ];
    }
}

module.exports = FunCall;
