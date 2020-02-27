const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class If extends Node {
    get fields() {
        return [ 'cond', 'body', 'else_' ];
    }
}
