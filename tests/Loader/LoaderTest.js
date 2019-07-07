const ArrayAdapter = Jymfony.Component.Cache.Adapter.ArrayAdapter;
const Environment = Kumis.Environment;
const Filesystem = Jymfony.Component.Filesystem.Filesystem;
const LoaderInterface = Kumis.Loader.LoaderInterface;
const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('Loader', function() {
    let tempdir;

    before(() => {
        tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'templates'));
    });

    after(async () => {
        await new Filesystem().remove(tempdir);
    });

    it('should allow a simple loader to be created', async () => {
        class MyLoader extends implementationOf(LoaderInterface) {
            getSource() {
                return {
                    src: 'Hello World',
                    path: '/tmp/somewhere',
                };
            }

            invalidateCache() { }
        }

        const env = new Environment(new MyLoader());
        const parent = await env.getTemplate('fake.kumis');
        expect(await parent.render()).to.be.equal('Hello World');
    });

    it('should catch loader error', async () => {
        // We should be able to create a loader that only exposes getSource
        class MyLoader extends implementationOf(LoaderInterface) {
            async getSource() {
                await __jymfony.sleep(1);
                throw new Error('test');
            }

            invalidateCache() { }
        }

        const env = new Environment(new MyLoader());
        try {
            await env.getTemplate('fake.kumis');
        } catch(err) {
            expect(err).to.be.instanceOf(Error);
        }
    });

    it('should cache templates', async () => {
        const TemplateLoader = new Kumis.Loader.FilesystemLoader(tempdir, new ArrayAdapter());
        const e = new Environment(TemplateLoader);

        fs.writeFileSync(tempdir + '/test.html', '{{ name }}', 'utf-8');
        expect(await e.render('test.html', {name: 'foo'})).to.be.equal('foo');

        Jymfony.Component.Filesystem.StreamWrapper.FileStreamWrapper.clearStatCache();

        fs.writeFileSync(tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
        expect(await e.render('test.html', {name: 'foo'})).to.be.equal('foo');
    });

    it('should not cache templates by default', async () => {
        const TemplateLoader = new Kumis.Loader.FilesystemLoader(tempdir);
        const e = new Environment(TemplateLoader);

        fs.writeFileSync(tempdir + '/test.html', '{{ name }}', 'utf-8');
        expect(await e.render('test.html', {name: 'foo'})).to.be.equal('foo');

        Jymfony.Component.Filesystem.StreamWrapper.FileStreamWrapper.clearStatCache();

        fs.writeFileSync(tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
        expect(await e.render('test.html', {name: 'foo'})).to.be.equal('foo-changed');
    });
});
