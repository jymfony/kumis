const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class Import extends Node {
    get fields() {
        return [ 'template', 'target', 'withContext' ];
    }
}
