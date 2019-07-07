declare namespace Kumis.Node {
    export class CallExtension extends Node {
        public extName: string;
        public prop: string;
        public args: Node[];
        public contentArgs: Node[];
        public autoescape: boolean;

        __construct(ext, prop, args, contentArgs, { autoescape }): void;
        constructor(ext, prop, args, contentArgs, { autoescape });
    }
}
