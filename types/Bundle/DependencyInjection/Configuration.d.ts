declare namespace Kumis.Bundle.DependencyInjection {
    import ConfigurationInterface = Jymfony.Component.Config.Definition.ConfigurationInterface;
    import TreeBuilder = Jymfony.Component.Config.Definition.Builder.TreeBuilder;

    export class Configuration extends implementationOf(ConfigurationInterface) {
        /**
         * @inheritdoc
         */
        public readonly configTreeBuilder: TreeBuilder;
    }
}
