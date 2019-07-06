const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Set extends Node {
    get fields() {
        return [ 'targets', 'value' ];
    }
}

module.exports = Set;
