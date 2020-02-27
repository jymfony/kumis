const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Compare extends Node {
    get fields() {
        return [ 'expr', 'ops' ];
    }
}
