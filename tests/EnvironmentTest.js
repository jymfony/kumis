const FilesystemLoader = Kumis.Loader.FilesystemLoader;
const Environment = Kumis.Environment;
const { expect } = require('chai');
const util = require('./util');
const templatesPath = 'tests/templates';
const path = require('path');

describe('api', function() {
    it('should always force compilation of parent template', async () => {
        const env = new Environment(new FilesystemLoader(templatesPath));

        const child = await env.getTemplate('base-inherit.kumis');
        expect(await child.render()).to.be.equal('Foo*Bar*BazFizzle');
    });

    it('should handle correctly relative paths', async () => {
        if ('undefined' === typeof path) {
            this.skip();
            return;
        }
        const env = new Environment(new FilesystemLoader(templatesPath));
        const child1 = await env.getTemplate('relative/test1.kumis');
        const child2 = await env.getTemplate('relative/test2.kumis');

        expect(await child1.render()).to.be.equal('FooTest1BazFizzle');
        expect(await child2.render()).to.be.equal('FooTest2BazFizzle');
    });

    it('should handle correctly cache for relative paths', async () => {
        const env = new Environment(new FilesystemLoader(templatesPath));
        const test = await env.getTemplate('relative/test-cache.kumis');

        expect(util.normEOL(await test.render())).to.be.equal('Test1\nTest2');
    });

    it('should handle correctly relative paths in renderString', async () => {
        const env = new Environment(new FilesystemLoader(templatesPath));
        expect(await env.renderString('{% extends "./relative/test1.kumis" %}{% block block1 %}Test3{% endblock %}', {}, {
            path: path.resolve(templatesPath, 'string.kumis'),
        })).to.be.equal('FooTest3BazFizzle');
    });
});
