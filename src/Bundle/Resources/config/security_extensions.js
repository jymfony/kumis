/** @global container */
/** @var {Jymfony.Component.DependencyInjection.ContainerBuilder} container */

const Reference = Jymfony.Component.DependencyInjection.Reference;
const Container = Jymfony.Component.DependencyInjection.Container;

container.register(Kumis.Bundle.Extension.SecurityExtension)
    .addTag('kumis.extension')
    .addTag('kernel.event_subscriber')
    .addArgument(new Reference(Jymfony.Component.Security.Authorization.AuthorizationCheckerInterface, Container.IGNORE_ON_INVALID_REFERENCE))
    .addArgument(new Reference(Jymfony.Component.Security.Authentication.Token.Storage.TokenStorageInterface, Container.IGNORE_ON_INVALID_REFERENCE))
;
