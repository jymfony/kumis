declare namespace Kumis.Bundle {
    import Bundle = Jymfony.Component.Kernel.Bundle;
    import ContainerBuilder = Jymfony.Component.DependencyInjection.ContainerBuilder;

    export class KumisBundle extends Bundle {
        build(container: ContainerBuilder): void;
    }
}
