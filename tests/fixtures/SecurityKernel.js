const SecurityBundle = Jymfony.Bundle.SecurityBundle.SecurityBundle;
const Route = Jymfony.Component.Routing.Route;
const RouteCollection = Jymfony.Component.Routing.RouteCollection;
const View = Kumis.Bundle.View.View;
const AppKernel = Tests.Fixtures.AppKernel;

/**
 * @memberOf Tests.Fixtures
 */
class SecurityKernel extends AppKernel {
    * registerBundles() {
        yield * super.registerBundles();
        yield new SecurityBundle();
    }

    _configureContainer(container, loader) {
        super._configureContainer(container, loader);
        container.loadFromExtension('framework', {
            router: {
                resource: 'kernel:configureRoutes',
                type: 'service',
            },
            http_server: {
                enabled: true,
            },
        });

        container.loadFromExtension('security', {
            firewalls: {
                main: {
                    anonymous: true,
                },
            },
        });
    }

    async homeAction() {
        return new View('security/is_granted.html.kumis');
    }

    async anonymousAction() {
        return new View('security/is_anonymous.html.kumis');
    }

    configureRoutes() {
        const collection = new RouteCollection();
        collection
            .add('home', new Route('/', {
                _controller: 'kernel:homeAction',
            }))
            .add('anonymous', new Route('/anonymous', {
                _controller: 'kernel:anonymousAction',
            }))
        ;

        return collection;
    }
}

module.exports = SecurityKernel;
