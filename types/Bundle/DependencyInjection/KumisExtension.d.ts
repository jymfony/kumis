declare namespace Kumis.Bundle.DependencyInjection {
    import ContainerBuilder = Jymfony.Component.DependencyInjection.ContainerBuilder;
    import Extension = Jymfony.Component.DependencyInjection.Extension;

    export class KumisExtension extends Extension {
        /**
         * Load a configuration
         */
        load(configs: any[], container: ContainerBuilder): void;
    }
}
