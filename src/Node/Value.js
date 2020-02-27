const Node = Kumis.Node.Node;

/**
 * Abstract nodes
 *
 * @memberOf Kumis.Node
 * @abstract
 */
export default class Value extends Node {
    get fields() {
        return [ 'value' ];
    }
}
