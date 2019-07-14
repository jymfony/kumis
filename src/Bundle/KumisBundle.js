const CompilerPass = Kumis.Bundle.DependencyInjection.CompilerPass;
const Bundle = Jymfony.Component.Kernel.Bundle;

/**
 * Bundle
 *
 * @memberOf Kumis.Bundle
 */
class KumisBundle extends Bundle {
    build(container) {
        container
            .addCompilerPass(new CompilerPass.AddExtensionPass())
        ;
    }
}

module.exports = KumisBundle;
