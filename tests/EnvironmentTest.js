import { expect } from 'chai';
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
        expect(await child.render()).to.be.equal('Foo*Bar*BazFizzle');
    }

    async testShouldHandleCorrectlyRelativePaths() {
        if ('undefined' === typeof path) {
            this.markTestSkipped();
        }

        const env = Environment.create(new FilesystemLoader(templatesPath));
        const child1 = await env.getTemplate('relative/test1.kumis');
        const child2 = await env.getTemplate('relative/test2.kumis');

        expect(await child1.render()).to.be.equal('FooTest1BazFizzle');
        expect(await child2.render()).to.be.equal('FooTest2BazFizzle');
    }

    async testShouldHandleCorrectlyCacheForRelativePaths() {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        const test = await env.getTemplate('relative/test-cache.kumis');

        expect(util.normEOL(await test.render())).to.be.equal('Test1\nTest2');
    }

    async testShouldHandleCorrectlyRelativePathsInRenderString() {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        expect(await env.renderString('{% extends "./relative/test1.kumis" %}{% block block1 %}Test3{% endblock %}', {}, {
            path: path.resolve(templatesPath, 'string.kumis'),
        })).to.be.equal('FooTest3BazFizzle');
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
