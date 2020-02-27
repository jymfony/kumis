const Bundle = Jymfony.Component.Kernel.Bundle;
const CompilerPass = Kumis.Bundle.DependencyInjection.CompilerPass;

/**
 * Bundle
 *
 * @memberOf Kumis.Bundle
 */
export default class KumisBundle extends Bundle {
    build(container) {
        container
            .addCompilerPass(new CompilerPass.AddExtensionPass())
        ;
    }
}
