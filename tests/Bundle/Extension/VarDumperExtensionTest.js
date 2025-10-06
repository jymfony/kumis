import { readFileSync } from 'fs';

const DumperKernel = Tests.Fixtures.DumperKernel;
const TestCase = Jymfony.Component.Testing.Framework.TestCase;

export default class VarDumperExtensionTest extends TestCase {
    __construct() {
        super.__construct();

        /**
         * @type {Jymfony.Component.Kernel.KernelInterface}
         */
        this._kernel = undefined;
    }

    beforeEach() {
        this._kernel = new DumperKernel({
            paths: __dirname + '/../../templates',
        });
    }

    async afterEach() {
        await this._kernel.shutdown();
    }

    async testDumpShouldEmitNothingIfDebugIsFalse() {
        this._kernel._debug = false;
        await this._kernel.boot();

        const engine = this._kernel.container.get('kumis');

        const buffer = new __jymfony.StreamBuffer();
        await engine.render(buffer, 'var_dumper/dumper1.html.kumis', {
            app: 'testfoo',
        });

        __self.assertEquals('TEST', __jymfony.trim(buffer.buffer.toString()));
    }

    async testDumpShouldEmitDump() {
        await this._kernel.boot();
        const engine = this._kernel.container.get('kumis');

        const buffer = new __jymfony.StreamBuffer();
        await engine.render(buffer, 'var_dumper/dumper2.html.kumis', {
            app: 'testfoo',
        });

        __self.assertEquals(
            __jymfony.trim(readFileSync(__dirname + '/../../templates/var_dumper/dumper2.html').toString()),
            __jymfony.trim(
                buffer.buffer.toString().replace(/jf-dump-\d+/g, 'jf-dump')
            )
        );
    }
}
