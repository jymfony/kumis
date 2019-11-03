/** @global container */
/** @var {Jymfony.Component.DependencyInjection.ContainerBuilder} container */

const Reference = Jymfony.Component.DependencyInjection.Reference;
const Container = Jymfony.Component.DependencyInjection.Container;

container.register(Kumis.Bundle.Extension.VarDumperExtension)
    .addTag('kumis.extension')
    .addArgument(new Reference('var_dumper.cloner', Container.NULL_ON_INVALID_REFERENCE))
    .addArgument('%kernel.debug%')
;
