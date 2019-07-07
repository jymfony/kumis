declare namespace Kumis.Node {
    export class If extends Node {
        public cond: BinOp;
        public body: NodeList;
        public else_: NodeList;
    }
}
