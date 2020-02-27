const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class For extends Node {
    get fields() {
        return [ 'arr', 'name', 'body', 'else_' ];
    }
}
