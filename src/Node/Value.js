const Node = Kumis.Node.Node;

/**
 * Abstract nodes
 *
 * @memberOf Kumis.Node
 * @abstract
 */
class Value extends Node {
    get fields() {
        return [ 'value' ];
    }
}

module.exports = Value;
