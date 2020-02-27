const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class FunCall extends Node {
    get fields() {
        return [ 'name', 'args' ];
    }
}
