const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Block extends Node {
    get fields() {
        return [ 'name', 'body' ];
    }
}

module.exports = Block;
