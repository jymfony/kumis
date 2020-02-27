const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Macro extends Node {
    get fields() {
        return [ 'name', 'args', 'body' ];
    }
}
