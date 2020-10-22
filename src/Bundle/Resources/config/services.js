/** @global container */
/** @var {Jymfony.Component.DependencyInjection.ContainerBuilder} container */

const Alias = Jymfony.Component.DependencyInjection.Alias;
const Reference = Jymfony.Component.DependencyInjection.Reference;

container.register(Kumis.Environment)
    .addArgument([
        new Reference(Kumis.Bundle.Loader.CachedLoader),
        new Reference(Kumis.Bundle.Loader.FilesystemLoader)
    ])
;

container.register(Kumis.Extension.BuiltinExtension)
    .addTag('kumis.extension')
;

container.register(Kumis.Bundle.Extension.GlobalsExtension)
    .addTag('kumis.extension')
    .addArgument({})
;

container.register(Kumis.Bundle.Loader.CachedLoader)
    .addArgument('%kernel.cache_dir%/kumis/templates.js')
;

container.register(Kumis.Bundle.Loader.FilesystemLoader)
    .addArgument(new Reference('kernel'))
    .addArgument([])
;

container.setAlias('kumis', new Alias(Kumis.Bundle.Engine, true));
container.setAlias('templating.engine.kumis', new Alias(Kumis.Bundle.Engine, true));
container.register(Kumis.Bundle.Engine)
    .setPublic(true)
    .addArgument(new Reference(Kumis.Environment))
;

container.register(Kumis.Bundle.CacheWarmer.TemplatesCacheWarmer)
    .addTag('kernel.cache_warmer')
    .addArgument(new Reference('kernel'))
    .addArgument(new Reference(Kumis.Environment))
    .addArgument([])
;

container.register(Kumis.Bundle.View.ViewHandler)
    .addTag('kernel.event_subscriber')
    .addArgument(new Reference(Kumis.Bundle.Engine))
;
