const Prophet = Jymfony.Component.Testing.Prophet;
const FilesystemLoader = Kumis.Loader.FilesystemLoader;
const LoaderInterface = Kumis.Loader.LoaderInterface;
const Environment = Kumis.Environment;
const { expect } = require('chai');
const util = require('./util');
const templatesPath = 'tests/templates';
const path = require('path');

describe('Environment', function () {
    beforeEach(() => {
        /**
         * @type {Jymfony.Component.Testing.Prophet}
         *
         * @private
         */
        this._prophet = new Prophet();
    });

    afterEach(() => {
        this._prophet.checkPredictions();
    });

    it('should always force compilation of parent template', async () => {
        const env = Environment.create(new FilesystemLoader(templatesPath));

        const child = await env.getTemplate('base-inherit.kumis');
        expect(await child.render()).to.be.equal('Foo*Bar*BazFizzle');
    });

    it('should handle correctly relative paths', async () => {
        if ('undefined' === typeof path) {
            this.skip();
            return;
        }
        const env = Environment.create(new FilesystemLoader(templatesPath));
        const child1 = await env.getTemplate('relative/test1.kumis');
        const child2 = await env.getTemplate('relative/test2.kumis');

        expect(await child1.render()).to.be.equal('FooTest1BazFizzle');
        expect(await child2.render()).to.be.equal('FooTest2BazFizzle');
    });

    it('should handle correctly cache for relative paths', async () => {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        const test = await env.getTemplate('relative/test-cache.kumis');

        expect(util.normEOL(await test.render())).to.be.equal('Test1\nTest2');
    });

    it('should handle correctly relative paths in renderString', async () => {
        const env = Environment.create(new FilesystemLoader(templatesPath));
        expect(await env.renderString('{% extends "./relative/test1.kumis" %}{% block block1 %}Test3{% endblock %}', {}, {
            path: path.resolve(templatesPath, 'string.kumis'),
        })).to.be.equal('FooTest3BazFizzle');
    });

    it('should invalidate loaders cache', () => {
        const loader1 = this._prophet.prophesize(LoaderInterface);
        const loader2 = this._prophet.prophesize(LoaderInterface);

        loader1.invalidateCache().shouldBeCalled();
        loader2.invalidateCache().shouldBeCalled();

        const env = new Environment([ loader1.reveal(), loader2.reveal() ]);
        env.invalidateCache();
    });
});
