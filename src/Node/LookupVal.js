const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class LookupVal extends Node {
    get fields() {
        return [ 'target', 'val' ];
    }
}

module.exports = LookupVal;
