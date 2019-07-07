declare namespace Kumis.Node {
    export class For extends Node {
        public arr: Node;
        public name: SymbolNode;
        public body: NodeList;
        public else_: NodeList;
    }
}
