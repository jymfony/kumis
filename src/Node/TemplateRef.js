const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
class TemplateRef extends Node {
    get fields() {
        return [ 'template' ];
    }
}

module.exports = TemplateRef;
