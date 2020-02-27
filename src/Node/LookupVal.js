const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class LookupVal extends Node {
    get fields() {
        return [ 'target', 'val' ];
    }
}
