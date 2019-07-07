declare namespace Kumis {
    import Frame = Kumis.Util.Frame;

    export class Context {
        private env: Environment;
        private ctx: Record<string, any>;
        private blocks: {};
        private exported: string[];

        /**
         * Constructor.
         */
        __construct(ctx: Record<string, any>, blocks: Record<string, any>, env: Environment): void;
        constructor(ctx: Record<string, any>, blocks: Record<string, any>, env: Environment);

        lookup(name: string): any;

        setVariable(name: string, val: any): void;
        getVariables(): Record<string, any>;

        addBlock(name: string, block: any): this;
        getBlock(name: string): any;

        getSuper(env: Environment, name: string, block: any, frame: Frame): Promise<string>;

        addExport(name: string): void;
        getExported(): Record<string, any>;
    }
}
