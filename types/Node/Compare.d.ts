declare namespace Kumis.Node {
    export class Compare extends Node {
        public expr: Node;
        public ops: CompareOperand[];
    }
}
