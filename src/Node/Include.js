const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Include extends Node {
    get fields() {
        return [ 'template', 'ignoreMissing' ];
    }
}

module.exports = Include;
