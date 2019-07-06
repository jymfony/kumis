const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class For extends Node {
    get fields() {
        return [ 'arr', 'name', 'body', 'else_' ];
    }
}

module.exports = For;
