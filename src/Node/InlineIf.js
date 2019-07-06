const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class InlineIf extends Node {
    get fields() {
        return [ 'cond', 'body', 'else_' ];
    }
}

module.exports = InlineIf;
