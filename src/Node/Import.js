const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class Import extends Node {
    get fields() {
        return [ 'template', 'target', 'withContext' ];
    }
}

module.exports = Import;
