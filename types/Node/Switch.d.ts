declare namespace Kumis.Node {
    export class Switch extends Node {
        public expr: Node;
        public cases: Case[];
        public default?: Case;
    }
}
