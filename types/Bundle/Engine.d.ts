declare namespace Kumis.Bundle {
    import EngineInterface = Jymfony.Component.Templating.Engine.EngineInterface;
    import Environment = Kumis.Environment;
    import TemplateReferenceInterface = Jymfony.Component.Templating.TemplateReferenceInterface;

    export class Engine extends implementationOf(EngineInterface) {
        private _environment: Environment;

        /**
         * Constructor.
         */
        __construct(environment: Environment): void;
        constructor(environment: Environment);

        /**
         * @inheritDoc
         */
        render(out: NodeJS.WritableStream, name: string | TemplateReferenceInterface, parameters?: Record<string, any>): Promise<void>;

        /**
         * @inheritDoc
         */
        exists(name: string | TemplateReferenceInterface): Promise<boolean>;

        /**
         * @inheritDoc
         */
        supports(name: string | TemplateReferenceInterface): boolean;
    }
}
