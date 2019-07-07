declare namespace Kumis {
    import Frame = Kumis.Util.Frame;

    export class Template {
        private env: Environment;
        private blocks: Record<string, any>;
        private rootRenderFunc: (env: Environment, ctx: Context, frame: Frame) => Promise<string>;
        private compiled: boolean;

        private tmplProps: any;
        private tmplStr: string;
        private path: string;

        __construct(src: string|Buffer|any, env: Environment, path: string, eagerCompile: boolean): void;
        constructor(src: string|Buffer|any, env: Environment, path: string, eagerCompile: boolean);

        render(ctx?: any, parentFrame?: null|Frame): Promise<string>;
        getExported(ctx?: any, parentFrame?: null|Frame): Promise<Record<string, any>>;
        compile(): void;

        private _compile(): void;
        private _getBlocks(props: Record<string, any>): Record<string, any>;
    }
}
