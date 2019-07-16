const ContainerControllerResolver = Jymfony.Component.HttpFoundation.Controller.ContainerControllerResolver;
const Request = Jymfony.Component.HttpFoundation.Request;
const RequestHandler = Jymfony.Component.HttpServer.RequestHandler;
const AppKernel = Tests.Fixtures.AppKernel;
const SecurityKernel = Tests.Fixtures.SecurityKernel;
const { expect } = require('chai');

describe('SecurityExtension', function () {
    it('is_granted should not be available if security bundle is not registered', async () => {
        const kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();
            const engine = kernel.container.get('kumis');
            await engine.render(new __jymfony.StreamBuffer(), 'security/is_granted.html.kumis');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Undefined variable "is_granted"/);
        } finally {
            await kernel.shutdown();
        }
    });

    it('is_granted should throw if no token is passed and not in a request', async () => {
        const kernel = new SecurityKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();
            const engine = kernel.container.get('kumis');
            await engine.render(new __jymfony.StreamBuffer(), 'security/is_granted.html.kumis');

            throw new Error('FAIL');
        } catch (e) {
            expect(e).to.match(/Cannot retrieve a security token/);
        } finally {
            await kernel.shutdown();
        }
    });

    it('is_granted should work', async () => {
        const kernel = new SecurityKernel({
            paths: __dirname + '/../../templates',
        });

        try {
            await kernel.boot();
            const resolver = new ContainerControllerResolver(kernel.container);
            const handler = new RequestHandler(kernel.container.get('event_dispatcher'), resolver);

            let response = await handler.handle(new Request('/'));
            expect(__jymfony.trim(response.content)).to.be.equal('false');

            response = await handler.handle(new Request('/anonymous'));
            expect(__jymfony.trim(response.content)).to.be.equal('true');
        } finally {
            await kernel.shutdown();
        }
    });
});
