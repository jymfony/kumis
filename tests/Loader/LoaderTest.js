import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';

const ArrayAdapter = Jymfony.Component.Cache.Adapter.ArrayAdapter;
const Environment = Kumis.Environment;
const Filesystem = Jymfony.Component.Filesystem.Filesystem;
const LoaderInterface = Kumis.Loader.LoaderInterface;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class LoaderTest extends TestCase {
    __construct() {
        super.__construct();

        this._tempdir = undefined;
    }

    before() {
        this._tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'templates'));
    }

    async after() {
        await new Filesystem().remove(this._tempdir);
    }

    async testShouldAllowASimpleLoaderToBeCreated() {
        class MyLoader extends implementationOf(LoaderInterface) {
            getSource() {
                return {
                    src: 'Hello World',
                    path: '/tmp/somewhere',
                };
            }

            resolve() { return '/tmp/somewhere'; }
            invalidateCache() { }
        }

        const env = Environment.create(new MyLoader());
        const parent = await env.getTemplate('fake.kumis');
        expect(await parent.render()).to.be.equal('Hello World');
    }

    async testShouldCatchLoaderError() {
        class MyLoader extends implementationOf(LoaderInterface) {
            async getSource() {
                await __jymfony.sleep(1);
                throw new Error('test');
            }

            resolve() { return '/tmp/tmp'; }
            invalidateCache() { }
        }

        const env = Environment.create(new MyLoader());
        try {
            await env.getTemplate('fake.kumis');
        } catch (err) {
            expect(err).to.be.instanceOf(Error);
        }
    }

    async testShouldCacheTemplates() {
        const templateLoader = new Kumis.Loader.FilesystemLoader(this._tempdir, new ArrayAdapter());
        const e = Environment.create(templateLoader);

        fs.writeFileSync(this._tempdir + '/test.html', '{{ name }}', 'utf-8');
        expect(await e.render('test.html', { name: 'foo' })).to.be.equal('foo');

        Jymfony.Component.Filesystem.StreamWrapper.FileStreamWrapper.clearStatCache();

        fs.writeFileSync(this._tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
        expect(await e.render('test.html', { name: 'foo' })).to.be.equal('foo');
    }

    async testShouldNotCacheTemplatesByDefault() {
        const templateLoader = new Kumis.Loader.FilesystemLoader(this._tempdir);
        const e = Environment.create(templateLoader);

        fs.writeFileSync(this._tempdir + '/test.html', '{{ name }}', 'utf-8');
        expect(await e.render('test.html', { name: 'foo' })).to.be.equal('foo');

        Jymfony.Component.Filesystem.StreamWrapper.FileStreamWrapper.clearStatCache();

        fs.writeFileSync(this._tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
        expect(await e.render('test.html', { name: 'foo' })).to.be.equal('foo-changed');
    }
}
