const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class If extends Node {
    get fields() {
        return [ 'cond', 'body', 'else_' ];
    }
}

module.exports = If;
