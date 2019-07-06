const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Super extends Node {
    get fields() {
        return [ 'blockName', 'symbol' ];
    }
}

module.exports = Super;
