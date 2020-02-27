const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Super extends Node {
    get fields() {
        return [ 'blockName', 'symbol' ];
    }
}
