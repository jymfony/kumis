declare namespace Kumis.Bundle.DependencyInjection.CompilerPass {
    import CompilerPassInterface = Jymfony.Component.DependencyInjection.Compiler.CompilerPassInterface;
    import ContainerBuilder = Jymfony.Component.DependencyInjection.ContainerBuilder;

    export class AddExtensionPass extends implementationOf(CompilerPassInterface) {
        process(container: ContainerBuilder): void;
    }
}
