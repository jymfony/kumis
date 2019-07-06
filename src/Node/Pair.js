const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Pair extends Node {
    get fields() {
        return [ 'key', 'value' ];
    }
}

module.exports = Pair;
