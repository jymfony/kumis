const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Pair extends Node {
    get fields() {
        return [ 'key', 'value' ];
    }
}
