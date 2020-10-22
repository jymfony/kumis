/* eslint-disable indent */

const ConfigurationInterface = Jymfony.Component.Config.Definition.ConfigurationInterface;
const TreeBuilder = Jymfony.Component.Config.Definition.Builder.TreeBuilder;

/**
 * @memberOf Kumis.Bundle.DependencyInjection
 */
export default class Configuration extends implementationOf(ConfigurationInterface) {
    /**
     * @inheritdoc
     */
    get configTreeBuilder() {
        const treeBuilder = new TreeBuilder('kumis');
        const rootNode = treeBuilder.rootNode;

        rootNode
            .children()
            .arrayNode('paths')
                .beforeNormalization()
                    .ifTrue((v) => ! isArray(v))
                    .then((v) => [ v ])
                .end()
                .defaultValue([])
                .scalarPrototype().end()
            .end()
            .arrayNode('globals')
                .defaultValue({})
                .variablePrototype()
            .end()
        ;

        return treeBuilder;
    }
}
