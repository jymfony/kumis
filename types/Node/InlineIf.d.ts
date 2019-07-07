declare namespace Kumis.Node {
    export class InlineIf extends Node {
        public cond: BinOp;
        public body: NodeList;
        public else_: NodeList;
    }
}
