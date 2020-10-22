import { expect } from 'chai';

const ContainerControllerResolver = Jymfony.Component.HttpFoundation.Controller.ContainerControllerResolver;
const Request = Jymfony.Component.HttpFoundation.Request;
const RequestHandler = Jymfony.Component.HttpServer.RequestHandler;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;
const AppKernel = Tests.Fixtures.AppKernel;
const SecurityKernel = Tests.Fixtures.SecurityKernel;

export default class SecurityExtensionTest extends TestCase {
    __construct() {
        super.__construct();

        /**
         * @type {Jymfony.Component.Kernel.KernelInterface}
         */
        this.kernel = undefined;
    }

    async beforeEach() {
        this.kernel = new SecurityKernel({
            paths: __dirname + '/../../templates',
        });

        await this.kernel.boot();
    }

    async afterEach() {
        await this.kernel.shutdown();
    }

    async testIsGrantedShouldNotBeAvailableIfSecurityBundleIsNotRegistered() {
        await this.kernel.shutdown();
        this.kernel = new AppKernel({
            paths: __dirname + '/../../templates',
        });

        this.expectExceptionMessageRegex(/Undefined variable "is_granted"/);

        await this.kernel.boot();
        const engine = this.kernel.container.get('kumis');
        await engine.render(new __jymfony.StreamBuffer(), 'security/is_granted.html.kumis');
    }

    async testIsGrantedShouldThrowIfNoTokenIsPassedAndNotInARequest() {
        this.expectExceptionMessageRegex(/Cannot retrieve a security token/);

        const engine = this.kernel.container.get('kumis');
        await engine.render(new __jymfony.StreamBuffer(), 'security/is_granted.html.kumis');
    }

    async testIsGrantedShouldWork() {
        const resolver = new ContainerControllerResolver(this.kernel.container);
        const handler = new RequestHandler(this.kernel.container.get('event_dispatcher'), resolver);

        let response = await handler.handle(new Request('/'));
        expect(__jymfony.trim(response.content)).to.be.equal('false');

        response = await handler.handle(new Request('/anonymous'));
        expect(__jymfony.trim(response.content)).to.be.equal('true');
    }
}
