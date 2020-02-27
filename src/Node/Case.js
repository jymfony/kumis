const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Case extends Node {
    get fields() {
        return [ 'cond', 'body' ];
    }
}
