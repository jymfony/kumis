const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Case extends Node {
    get fields() {
        return [ 'cond', 'body' ];
    }
}

module.exports = Case;
