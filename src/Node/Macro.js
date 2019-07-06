const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Macro extends Node {
    get fields() {
        return [ 'name', 'args', 'body' ];
    }
}

module.exports = Macro;
