import * as util from './util';
import * as path from 'path';

const Prophet = Jymfony.Component.Testing.Prophet;
const FilesystemLoader = Kumis.Loader.FilesystemLoader;
const LoaderInterface = Kumis.Loader.LoaderInterface;
const Environment = Kumis.Environment;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

const templatesPath = 'tests/templates';

export default class EnvironmentTest extends TestCase {
    __construct() {
        super.__construct();

        /**
         * @type {Jymfony.Component.Testing.Prophet}
         *
         * @private
         */
        this._prophet = undefined;
    }

    beforeEach() {
        this._prophet = new Prophet();
    }

    afterEach() {
        this._prophet.checkPredictions();
    }

    async testShouldAlwaysForceCompilationOfParentTemplate() {
        const env = Environment.create(new FilesystemLoader(templatesPath));

        const child = await env.getTemplate('base-inherit.kumis');
        __self.assertEquals('Foo*Bar*BazFizzle', await child.render());
    }

    async testShouldHandleCorrectlyRelativePaths() {
        if ('undefined' === typeof path) {
            this.markTestSkipped();
        }

        const env = Environment.create(new FilesystemLoader(templatesPath));
        const child1 = await env.getTemplate('relative/test1.kumis');
        const child2 = await env.getTemplate('relative/test2.kumis');

        __self.assertEquals('FooTest1BazFizzle', await child1.render());
        __self.assertEquals('FooTest2BazFizzle', await child2.render());
    }

    async testShouldHandleCorrectlyCacheForRelativePaths() {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        const test = await env.getTemplate('relative/test-cache.kumis');

        __self.assertEquals('Test1\nTest2', util.normEOL(await test.render()));
    }

    async testShouldHandleCorrectlyRelativePathsInRenderString() {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        __self.assertEquals('FooTest3BazFizzle', await env.renderString('{% extends "./relative/test1.kumis" %}{% block block1 %}Test3{% endblock %}', {}, {
            path: path.resolve(templatesPath, 'string.kumis'),
        }));
    }

    testShouldInvalidateLoadersCache() {
        const loader1 = this._prophet.prophesize(LoaderInterface);
        const loader2 = this._prophet.prophesize(LoaderInterface);

        loader1.invalidateCache().shouldBeCalled();
        loader2.invalidateCache().shouldBeCalled();

        const env = new Environment([ loader1.reveal(), loader2.reveal() ]);
        env.invalidateCache();
    }
}
