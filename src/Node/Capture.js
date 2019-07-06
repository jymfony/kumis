const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Capture extends Node {
    get fields() {
        return [ 'body' ];
    }
}

module.exports = Capture;
