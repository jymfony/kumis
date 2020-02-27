const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Switch extends Node {
    get fields() {
        return [ 'expr', 'cases', 'default' ];
    }
}
