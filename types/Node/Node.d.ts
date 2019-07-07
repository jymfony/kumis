declare namespace Kumis.Node {
    export class Node {
        public lineno: number;
        public colno: number;

        /**
         * Constructor
         */
        __construct(lineno: number, colno: number, ...args: any[]): void;
        constructor(lineno: number, colno: number, ...args: any[]);

        /**
         * The node type name.
         */
        public readonly typename: string;

        /**
         * Node fields.
         */
        public readonly fields: string[];

        /**
         * Finds all the children node of the given type.
         */
        findAll(type: Newable<Node>, results?: Node[]): Node[];

        /**
         * Traverses a node, searching for nodes of a given type.
         */
        private static _traverseAndCheck(obj: Node, type: Newable<Node>, results: Node[]): void;
    }
}
