declare namespace Kumis.Node {
    export class NodeList extends Node {
        public children: Node[];

        /**
         * Constructor.
         */
        __construct(lineno: number, colno: number, nodes?: Node[]): void;
        constructor(lineno: number, colno: number, nodes?: Node[]);
    }
}
