/* eslint-disable indent */

const TreeBuilder = Jymfony.Component.Config.Definition.Builder.TreeBuilder;
const ConfigurationInterface = Jymfony.Component.Config.Definition.ConfigurationInterface;

/**
 * @memberOf Kumis.Bundle.DependencyInjection
 */
class Configuration extends implementationOf(ConfigurationInterface) {
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
        ;

        return treeBuilder;
    }
}

module.exports = Configuration;
