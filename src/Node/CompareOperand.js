const Node = Kumis.Node.Node;

/**
 * @memberOf Kumis.Node
 */
export default class CompareOperand extends Node {
    get fields() {
        return [ 'expr', 'type' ];
    }
}
