const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class InlineIf extends Node {
    get fields() {
        return [ 'cond', 'body', 'else_' ];
    }
}
