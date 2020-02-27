const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class TemplateRef extends Node {
    get fields() {
        return [ 'template' ];
    }
}
