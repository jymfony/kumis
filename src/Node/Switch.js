const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Switch extends Node {
    get fields() {
        return [ 'expr', 'cases', 'default' ];
    }
}

module.exports = Switch;
