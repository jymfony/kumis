const Environment = Kumis.Environment;
const Loader = Kumis.Loader.FilesystemLoader;
const Template = Kumis.Template;
const templatesPath = 'tests/templates';
const Assert = Jymfony.Component.Testing.Framework.Assert;

export async function equal(str, ctx, opts, str2, env) {
    if ('string' === typeof ctx) {
        env = opts;
        str2 = ctx;
        ctx = null;
        opts = {};
    }
    if ('string' === typeof opts) {
        env = str2;
        str2 = opts;
        opts = {};
    }

    opts = opts || {};
    const res = await render(str, ctx, opts, env);
    Assert.assertEquals(str2, res);
}

export function normEOL(str) {
    if (!str) {
        return str;
    }

    return str.replace(/\r\n|\r/g, '\n');
}

export async function render(str, ctx = {}, opts = {}, env = undefined) {
    opts = opts || {};

    const loader = new Loader(templatesPath);
    const e = env || Environment.create(loader, opts);

    if (opts.filters) {
        Object.assign(e.filters, opts.filters);
    }

    if (opts.extensions) {
        for (const extension of opts.extensions) {
            e.addExtension(extension);
        }
    }

    ctx = ctx || {};
    const t = new Template(str, e);

    return await t.render(ctx);
}
