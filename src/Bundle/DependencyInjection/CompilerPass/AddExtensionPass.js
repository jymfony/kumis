const CompilerPassInterface = Jymfony.Component.DependencyInjection.Compiler.CompilerPassInterface;
const Reference = Jymfony.Component.DependencyInjection.Reference;

/**
 * @memberOf Kumis.Bundle.DependencyInjection.CompilerPass
 */
class AddExtensionPass extends implementationOf(CompilerPassInterface) {
    /**
     * @param {Jymfony.Component.DependencyInjection.ContainerBuilder} container
     */
    process(container) {
        const def = container.findDefinition(Kumis.Environment);
        for (const [ tagged ] of __jymfony.getEntries(container.findTaggedServiceIds('kumis.extension'))) {
            def.addMethodCall('addExtension', [ new Reference(tagged) ]);
        }
    }
}

module.exports = AddExtensionPass;
