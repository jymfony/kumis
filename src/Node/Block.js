const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Block extends Node {
    get fields() {
        return [ 'name', 'body' ];
    }
}
